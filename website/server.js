const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const ical = require("node-ical");

require("dotenv").config();

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const INTAKES_FILE = path.join(PUBLIC_DIR, "data", "intakes.json");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");

const HOST = "0.0.0.0";
const PORT = Number(process.env.WEBSITE_PORT || 3000);

const CANVAS_HOST = "alueducation.instructure.com";
const CANVAS_PATH = "/feeds/calendars";

const MAX_FEED_SIZE = 2 * 1024 * 1024;
const MAX_REQUEST_SIZE = 12 * 1024;

const SESSION_DURATION = 8 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW = 15 * 60 * 1000;

const COOKIE_NAME = "duetask_admin";

let writeQueue = Promise.resolve();

// In-memory sessions and login limits.
const sessions = new Map();
const loginAttempts = new Map();


/* -------------------- JSON / STORAGE -------------------- */

async function readJson(file, fallback) {
    try {
        return JSON.parse(await fs.readFile(file, "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") return fallback;
        throw error;
    }
}

async function writeRegistrations(data) {
    const temporary = `${REGISTRATIONS_FILE}.tmp`;

    await fs.writeFile(
        temporary,
        JSON.stringify(data, null, 2),
        { mode: 0o600 }
    );

    await fs.rename(temporary, REGISTRATIONS_FILE);
}

function queueWrite(operation) {
    const result = writeQueue.then(operation);
    writeQueue = result.catch(() => {});
    return result;
}

async function writeIntakes(data) {
    const tempFile = `${INTAKES_FILE}.tmp`;

    await fs.writeFile(
        tempFile,
        JSON.stringify(data, null, 2),
        { mode: 0o600 }
    );

    await fs.rename(tempFile, INTAKES_FILE);
}


/* -------------------- HTTP HELPERS -------------------- */

function sendJson(res, status, data) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
    });

    res.end(JSON.stringify(data));
}

function readCookies(req) {
    const cookieHeader = req.headers.cookie || "";

    const cookies = {};

    for (const item of cookieHeader.split(";")) {
        const [name, ...value] = item.trim().split("=");

        if (name) {
            cookies[name] = value.join("=");
        }
    }

    return cookies;
}

function isSecureRequest(req) {
    return req.socket.encrypted ||
        process.env.COOKIE_SECURE === "true";
}

function setSessionCookie(res, token, req) {
    const parts = [
        `${COOKIE_NAME}=${token}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Strict",
        `Max-Age=${Math.floor(SESSION_DURATION / 1000)}`
    ];

    if (isSecureRequest(req)) {
        parts.push("Secure");
    }

    res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res, req) {
    const parts = [
        `${COOKIE_NAME}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Strict",
        "Max-Age=0"
    ];

    if (isSecureRequest(req)) {
        parts.push("Secure");
    }

    res.setHeader("Set-Cookie", parts.join("; "));
}

async function readRequestBody(req) {
    let body = "";
    let size = 0;

    for await (const chunk of req) {
        size += chunk.length;

        if (size > MAX_REQUEST_SIZE) {
            throw new Error("Request is too large.");
        }

        body += chunk;
    }

    return JSON.parse(body);
}


/* -------------------- ADMIN AUTH -------------------- */

function getSession(req) {
    const token = readCookies(req)[COOKIE_NAME];

    if (!token) return null;

    const session = sessions.get(token);

    if (!session) return null;

    if (session.expiresAt <= Date.now()) {
        sessions.delete(token);
        return null;
    }

    return session;
}

function requireAdmin(req, res) {
    const session = getSession(req);

    if (!session) {
        sendJson(res, 401, {
            message: "Please sign in again."
        });

        return false;
    }

    return true;
}

function getClientIp(req) {
    return req.socket.remoteAddress || "unknown";
}

function checkLoginLimit(ip) {
    const record = loginAttempts.get(ip);

    if (!record) return true;

    if (record.resetAt <= Date.now()) {
        loginAttempts.delete(ip);
        return true;
    }

    return record.count < MAX_LOGIN_ATTEMPTS;
}

function recordLoginFailure(ip) {
    let record = loginAttempts.get(ip);

    if (!record || record.resetAt <= Date.now()) {
        record = {
            count: 0,
            resetAt: Date.now() + LOGIN_WINDOW
        };
    }

    record.count++;

    loginAttempts.set(ip, record);
}

function resetLoginAttempts(ip) {
    loginAttempts.delete(ip);
}

function passwordMatches(password) {
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredPassword) return false;

    // Hash both values to produce equal-length buffers.
    const submittedHash = crypto
        .createHash("sha256")
        .update(password)
        .digest();

    const configuredHash = crypto
        .createHash("sha256")
        .update(configuredPassword)
        .digest();

    return crypto.timingSafeEqual(
        submittedHash,
        configuredHash
    );
}

function createSession() {

    const nonce = crypto.randomBytes(32).toString("hex");

    const token = crypto
        .createHmac("sha256", process.env.ADMIN_SESSION_SECRET)
        .update(nonce)
        .digest("hex");

    sessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
    });

    return token;
}


/* -------------------- CANVAS REGISTRATION -------------------- */

function validateCanvasUrl(value) {
    let url;

    try {
        url = new URL(value);
    } catch {
        throw new Error("Please enter a valid Canvas calendar URL.");
    }

    if (
        url.protocol !== "https:" ||
        url.hostname !== CANVAS_HOST ||
        url.port ||
        url.username ||
        url.password ||
        (
            !url.pathname.startsWith(CANVAS_PATH + "/") &&
            url.pathname !== CANVAS_PATH
        )
    ) {
        throw new Error("Please use your ALU Canvas calendar feed URL.");
    }

    return url;
}

async function validateFeed(feedUrl) {
    const response = await fetch(feedUrl, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(12000),
        headers: {
            "Accept": "text/calendar, text/plain;q=0.9"
        }
    });

    if (!response.ok) {
        throw new Error(
            "Canvas could not provide this calendar. Check that the link is correct."
        );
    }

    const contentType = response.headers.get("content-type") || "";

    if (
        contentType &&
        !contentType.includes("text/calendar") &&
        !contentType.includes("text/plain") &&
        !contentType.includes("application/octet-stream")
    ) {
        throw new Error("The submitted link did not return a calendar file.");
    }

    const declaredSize = Number(
        response.headers.get("content-length") || 0
    );

    if (declaredSize > MAX_FEED_SIZE) {
        throw new Error("The calendar file is too large.");
    }

    if (!response.body) {
        throw new Error("Canvas returned an empty response.");
    }

    const reader = response.body.getReader();
    const chunks = [];
    let totalSize = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            totalSize += value.length;

            if (totalSize > MAX_FEED_SIZE) {
                await reader.cancel();
                throw new Error("The calendar file is too large.");
            }

            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const raw = Buffer.concat(chunks).toString("utf8");

    if (
        !raw.includes("BEGIN:VCALENDAR") ||
        !raw.includes("END:VCALENDAR")
    ) {
        throw new Error("This does not appear to be a valid Canvas calendar.");
    }

    let events;

    try {
        events = ical.parseICS(raw);
    } catch {
        throw new Error(
            "We couldn't read this calendar. Please check your Canvas link."
        );
    }

    const assignments = Object.values(events).filter(event =>
        event &&
        event.type === "VEVENT" &&
        event.summary &&
        event.start
    );

    if (assignments.length === 0) {
        throw new Error(
            "No calendar events were found. Please check your Canvas calendar link."
        );
    }

    return {
        eventCount: assignments.length,
        calendar: raw
    };
}

async function registerIntake(intakeId, feedUrl, calendar) {
    return queueWrite(async () => {
        const registrations = await readJson(
            REGISTRATIONS_FILE,
            { intakes: {} }
        );

        const existing = registrations.intakes[intakeId];

        const submission = {
            submittedAt: new Date().toISOString(),
            feed: feedUrl,
            eventCount: calendar.eventCount
        };

        if (!existing) {
            registrations.intakes[intakeId] = {
                status: "pending",
                primary: submission,
                backups: []
            };
        } else {
            const allFeeds = [
                existing.primary,
                ...(existing.backups || [])
            ];

            if (allFeeds.some(item => item.feed === feedUrl)) {
                return "duplicate";
            }

            existing.backups = existing.backups || [];
            existing.backups.push(submission);
        }

        await writeRegistrations(registrations);

        return existing ? "backup" : "first";
    });
}


/* -------------------- STATIC FILES -------------------- */

async function serveStatic(req, res, pathname) {

    // Admin dashboard requires an authenticated session.
    if (
        pathname === "/admin/dashboard.html" ||
        pathname === "/admin/dashboard" ||
        pathname === "/admin/"
    ) {
        if (!getSession(req)) {
            res.writeHead(302, {
                Location: "/admin/login.html",
                "Cache-Control": "no-store"
            });

            res.end();
            return;
        }
    }

    const routes = {
        "/": "index.html",
        "/admin": "admin/login.html"
    };

    let relativePath;

    try {
        relativePath = routes[pathname] ||
            decodeURIComponent(pathname.slice(1));
    } catch {
        return sendJson(res, 400, { message: "Invalid URL." });
    }

    const filePath = path.resolve(PUBLIC_DIR, relativePath);

    if (
        !filePath.startsWith(PUBLIC_DIR + path.sep) &&
        filePath !== PUBLIC_DIR
    ) {
        return sendJson(res, 403, { message: "Forbidden." });
    }

    const contentTypes = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".mp4": "video/mp4"
    };

    try {
        const file = await fs.readFile(filePath);

        res.writeHead(200, {
            "Content-Type":
                contentTypes[path.extname(filePath)] ||
                "application/octet-stream",

            "X-Content-Type-Options": "nosniff",

            "Cache-Control":
                path.extname(filePath) === ".json"
                    ? "no-store"
                    : "public, max-age=3600"
        });

        if (req.method === "HEAD") {
            res.end();
        } else {
            res.end(file);
        }

    } catch (error) {
        if (error.code === "ENOENT" || error.code === "EISDIR") {
            return sendJson(res, 404, { message: "Not found." });
        }

        console.error("Static file error:", error.message);

        sendJson(res, 500, { message: "Server error." });
    }
}


/* -------------------- ROUTES -------------------- */

const server = http.createServer(async (req, res) => {

    try {
        const url = new URL(
            req.url,
            `http://${req.headers.host || "localhost"}`
        );

        /* Admin login */

        if (
            req.method === "POST" &&
            url.pathname === "/api/admin/login"
        ) {
            const ip = getClientIp(req);

            if (!checkLoginLimit(ip)) {
                return sendJson(res, 429, {
                    message: "Too many login attempts. Please wait 15 minutes."
                });
            }

            const body = await readRequestBody(req);

            if (
                typeof body.password !== "string" ||
                !passwordMatches(body.password)
            ) {
                recordLoginFailure(ip);

                return sendJson(res, 401, {
                    message: "Incorrect password."
                });
            }

            resetLoginAttempts(ip);

            // Invalidate previous sessions from this browser.
            const previousToken = readCookies(req)[COOKIE_NAME];

            if (previousToken) {
                sessions.delete(previousToken);
            }

            const token = createSession();

            setSessionCookie(res, token, req);

            return sendJson(res, 200, {
                message: "Login successful."
            });
        }

        /* Session check */

        if (
            req.method === "GET" &&
            url.pathname === "/api/admin/session"
        ) {
            if (!getSession(req)) {
                return sendJson(res, 401, {
                    authenticated: false
                });
            }

            return sendJson(res, 200, {
                authenticated: true
            });
        }

        /* Admin logout */

        if (
            req.method === "POST" &&
            url.pathname === "/api/admin/logout"
        ) {
            const token = readCookies(req)[COOKIE_NAME];

            if (token) {
                sessions.delete(token);
            }

            clearSessionCookie(res, req);

            return sendJson(res, 200, {
                message: "Logged out."
            });
        }

                /* ---------------- ADMIN DASHBOARD ---------------- */

        // Get dashboard data.
        if (
            req.method === "GET" &&
            url.pathname === "/api/admin/dashboard"
        ) {
            if (!requireAdmin(req, res)) {
                return;
            }

            const [publicData, registrationsData] = await Promise.all([
                readJson(INTAKES_FILE, { intakes: [] }),
                readJson(REGISTRATIONS_FILE, { intakes: {} })
            ]);

            const registrations = registrationsData.intakes || {};

            const intakes = publicData.intakes.map(intake => {
                const registration = registrations[intake.id];

                return {
                    id: intake.id,
                    name: intake.name,
                    active: intake.active,
                    destination: intake.destination || "",
                    groupLink: intake.groupLink || "",

                    registrationStatus: registration
                        ? registration.status
                        : "none",

                    registrations: registration
                        ? 1 + (registration.backups || []).length
                        : 0,

                    eventCount: registration?.primary?.eventCount ?? null
                };
            });

            const pendingRegistrations = Object.values(registrations)
                .filter(registration => registration.status === "pending")
                .length;

            const totalRegistrations = Object.values(registrations)
                .reduce((total, registration) => {
                    return total + 1 + (registration.backups || []).length;
                }, 0);

            return sendJson(res, 200, {
                intakes,
                pendingRegistrations,
                totalRegistrations
            });
        }


        // Update intake details and activation status.
        if (
            req.method === "POST" &&
            url.pathname === "/api/admin/intake/update"
        ) {
            if (!requireAdmin(req, res)) {
                return;
            }

            const body = await readRequestBody(req);

            const { id, active, destination, groupLink } = body;

            if (
                typeof id !== "string" ||
                typeof active !== "boolean" ||
                typeof destination !== "string" ||
                typeof groupLink !== "string"
            ) {
                return sendJson(res, 400, {
                    message: "Invalid intake data."
                });
            }

            const result = await queueWrite(async () => {
                const publicData = await readJson(
                    INTAKES_FILE,
                    { intakes: [] }
                );

                const registrationsData = await readJson(
                    REGISTRATIONS_FILE,
                    { intakes: {} }
                );

                const intake = publicData.intakes.find(
                    item => item.id === id
                );

                if (!intake) {
                    return {
                        status: 404,
                        message: "Intake not found."
                    };
                }

                const registration =
                    registrationsData.intakes?.[id];

                // An intake cannot be activated before verification.
                if (active && registration?.status !== "verified") {
                    return {
                        status: 400,
                        message: "Verify the Canvas registration before activating this intake."
                    };
                }

                if (active && !destination.trim()) {
                    return {
                        status: 400,
                        message: "A WhatsApp destination is required."
                    };
                }

                if (
                    active &&
                    !/^https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]+$/.test(
                        groupLink.trim()
                    )
                ) {
                    return {
                        status: 400,
                        message: "Enter a valid WhatsApp group invitation link."
                    };
                }

                intake.active = active;
                intake.destination = destination.trim();
                intake.groupLink = groupLink.trim();

                await writeIntakes(publicData);

                return {
                    status: 200,
                    message: "Intake updated successfully."
                };
            });

            return sendJson(res, result.status, {
                message: result.message
            });
        }


        // Verify a pending Canvas registration.
        if (
            req.method === "POST" &&
            url.pathname === "/api/admin/intake/verify"
        ) {
            if (!requireAdmin(req, res)) {
                return;
            }

            const body = await readRequestBody(req);
            const { id } = body;

            if (typeof id !== "string" || !id) {
                return sendJson(res, 400, {
                    message: "Invalid intake ID."
                });
            }

            const result = await queueWrite(async () => {
                const registrationsData = await readJson(
                    REGISTRATIONS_FILE,
                    { intakes: {} }
                );

                const registration =
                    registrationsData.intakes?.[id];

                if (!registration) {
                    return {
                        status: 404,
                        message: "No registration found for this intake."
                    };
                }

                if (registration.status !== "pending") {
                    return {
                        status: 400,
                        message: "This registration is not pending verification."
                    };
                }

                if (!registration.primary) {
                    return {
                        status: 400,
                        message: "The primary Canvas registration is missing."
                    };
                }

                registration.status = "verified";

                await writeRegistrations(registrationsData);

                return {
                    status: 200,
                    message: "Canvas registration verified successfully."
                };
            });

            return sendJson(res, result.status, {
                message: result.message
            });
        }

        /* Student registration */

        if (
            req.method === "POST" &&
            url.pathname === "/api/register"
        ) {
            const body = await readRequestBody(req);

            const { intakeId, feed } = body;

            if (
                typeof intakeId !== "string" ||
                typeof feed !== "string" ||
                !intakeId ||
                !feed
            ) {
                return sendJson(res, 400, {
                    message: "Please select an intake and provide your Canvas link."
                });
            }

            const publicData = await readJson(
                INTAKES_FILE,
                { intakes: [] }
            );

            const intake = publicData.intakes.find(
                item => item.id === intakeId
            );

            if (!intake) {
                return sendJson(res, 404, {
                    message: "That intake could not be found."
                });
            }

            const feedUrl = validateCanvasUrl(feed);
            const calendar = await validateFeed(feedUrl);

            const result = await registerIntake(
                intakeId,
                feedUrl.href,
                calendar
            );

            if (result === "duplicate") {
                return sendJson(res, 409, {
                    message: "This calendar link has already been submitted for this intake."
                });
            }

            return sendJson(res, 200, {
                message: result === "first"
                    ? "Your Canvas link has been verified and submitted. Thank you! This intake is now awaiting group activation."
                    : "Your Canvas link has been verified and saved as a backup. Thank you!"
            });
        }

        /* Restrict methods */

        if (req.method !== "GET" && req.method !== "HEAD") {
            return sendJson(res, 405, {
                message: "Method not allowed."
            });
        }

        await serveStatic(req, res, url.pathname);

    } catch (error) {
        console.error("Request error:", error.message);

        sendJson(res, 400, {
            message: error.message || "We couldn't process your request."
        });
    }
});


/* -------------------- STARTUP -------------------- */

async function start() {

    if (!process.env.ADMIN_PASSWORD) {
        throw new Error("ADMIN_PASSWORD is missing from .env");
    }

    if (!process.env.ADMIN_SESSION_SECRET) {
        throw new Error("ADMIN_SESSION_SECRET is missing from .env");
    }

    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
        await fs.access(REGISTRATIONS_FILE);
    } catch {
        await writeRegistrations({ intakes: {} });
    }

    server.listen(PORT, HOST, () => {
        console.log(`Website running at http://localhost:${PORT}`);
    });

}

start().catch(error => {
    console.error("Website startup failed:", error.message);
    process.exit(1);
});