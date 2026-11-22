const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const INTAKES_FILE = path.join(
    ROOT,
    'website/public/data/intakes.json'
);

const REGISTRATIONS_FILE = path.join(
    ROOT,
    'website/data/registrations.json'
);

async function readJson(file) {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
}

async function loadMajors(existingMajors) {

    const websiteData = await readJson(INTAKES_FILE);
    const registrations = await readJson(REGISTRATIONS_FILE);

    const majors = [...existingMajors];

    const existingIds = new Set(
        existingMajors.map(major => major.id)
    );

    for (const intake of websiteData.intakes) {

        // Do not load inactive intakes.
        if (!intake.active) continue;

        // Do not load an intake without a WhatsApp destination.
        if (!intake.destination) continue;

        // Avoid processing an existing major twice.
        if (existingIds.has(intake.id)) continue;

        const registration = registrations.intakes[intake.id];

        // Require a verified Canvas feed submission.
        if (
            !registration ||
            !registration.primary ||
            !registration.primary.feed ||
            !registration.primary.eventCount
        ) {
            continue;
        }

        majors.push({

            id: intake.id,

            name: intake.name,

            feed: registration.primary.feed,

            backupfile: path.join(
                ROOT,
                'backupfiles',
                `${intake.id}.ics`
            ),

            destination: intake.destination,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10,

            websiteManaged: true

        });

        console.log(`Loaded website intake: ${intake.name}`);

    }

    return majors;
}

module.exports = { loadMajors };
