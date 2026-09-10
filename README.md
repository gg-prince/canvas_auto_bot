# Canvas Auto Bot

A Node.js bot that watches Canvas LMS calendar feeds for multiple course cohorts and posts assignment deadline reminders straight into WhatsApp group chats — no manual checking required.

It runs on a schedule (morning, midday, evening), tracks what it's already announced so it never spams the same reminder twice in a day, and gracefully falls back to a local backup calendar file if the live Canvas feed is unreachable.

## How it works

1. **Fetch** — for each configured cohort ("major"), the bot pulls the Canvas calendar feed (an `.ics` URL) using `node-ical`. If the live feed fails, it falls back to a static backup `.ics` file stored in `backupfiles/`.
2. **Organize** — assignments are split into "due today" and "due soon" (within a configurable number of days ahead). Canvas represents end-of-day deadlines as `00:00`, which the bot treats as `23:00` so they don't look like they're due at midnight. Assignments due tomorrow are promoted into "due today" once a configured morning hour has passed, so they show up as more urgent as the deadline approaches.
3. **Message** — depending on the time of day and what's already been sent for that cohort today, the bot sends one of four WhatsApp message types to that cohort's group chat:
   - 📚 **Due in a week** — a heads-up digest, sent in the morning, only on days matching a configurable frequency (e.g. every 2 days)
   - ⚠️ **Due today** — sent once in the morning
   - 🚨 **A few hours remaining** — sent from midday onward
   - 🚨🚨 **Make sure you submitted** — a final evening check-in
4. **Track state** — what's been sent for each cohort each day is persisted to `data/state.json`, and a running day/week counter used for message frequency is kept in `data/day.json`. This is what prevents duplicate reminders if the bot runs more than once on the same day.
5. **Repeat** — this whole cycle is designed to run three times a day via a systemd timer (see below), not to run continuously.

## Requirements

- Node.js
- Chromium installed at `/usr/bin/chromium` (used headlessly by [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js) via Puppeteer to drive a real WhatsApp Web session)
- A WhatsApp account to pair as the sending account (you'll scan a QR code once; the session is cached locally afterward)
- One or more Canvas calendar feed URLs (from your Canvas account's calendar settings)
- A WhatsApp group chat per cohort that the paired account is already a member of

## Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/gg-prince/canvas_auto_bot.git
   cd canvas_auto_bot
   npm install
   ```
2. Create a `.env` file in the project root with the feed URL and group name for each cohort you want to track. Based on the current cohorts configured in `config/majors.js`:
   ```env
   CANVAS_FEED=your_canvas_ics_feed_url
   GROUP_NAME=your_whatsapp_group_name

   CANVAS_FEED_BEL=...
   GROUP_NAME_BEL=...

   CANVAS_FEED_BEL_M25=...
   GROUP_NAME_BEL_M25=...

   CANVAS_FEED_BSE_M25=...
   GROUP_NAME_BSE_M25=...

   CANVAS_FEED_BSE_S25=...
   GROUP_NAME_BSE_S25=...
   ```
   `GROUP_NAME*` must match the exact name of an existing WhatsApp group the paired account is already in — the bot looks it up by name, it doesn't create groups.
3. First run: start the bot manually and scan the QR code it prints in the terminal with WhatsApp (Linked Devices → Link a Device):
   ```bash
   node bot.js
   ```
   Once authenticated, the session is cached locally (see `.gitignore` — `.wwebjs_auth/`) so you won't need to re-scan on every run.

## Adding or editing cohorts

Cohorts ("majors") are defined in `config/majors.js`. Each entry needs:

| Field | Meaning |
|---|---|
| `id` | Unique internal identifier, used as the key for saved state |
| `name` | Human-readable label, shown in console logs |
| `feed` | Canvas `.ics` calendar feed URL (from an env var) |
| `backupfile` | Path to a static `.ics` fallback file, used if the live feed fails |
| `group` | Exact WhatsApp group name to post reminders into |
| `daysAhead` | How many days out counts as "due soon" |
| `type1Frequency` | Send the "due in a week" digest every N days |
| `morningPromotionHour` | Hour after which a next-day deadline gets escalated to "due today" |

## Running on a schedule

The bot is a one-shot script, not a long-running server — it's meant to be triggered on a timer, not left running. Systemd unit files are included for this:

- **`canvas-bot.service`** — runs `node bot.js` once, from the project's working directory
- **`canvas-bot.timer`** — triggers the service three times a day, at 06:58, 11:58, and 17:58

To install them on Linux:
```bash
cp canvas-bot.service canvas-bot.timer ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now canvas-bot.timer
```
Update the `WorkingDirectory` path in `canvas-bot.service` to match where you actually cloned the repo, since it currently points at a specific `%h/Projects/canvas-bot` path.

## Project structure

```
canvas_auto_bot/
├── bot.js                  # Entry point — loads majors, tracks the day counter, runs each cohort
├── processMajor.js         # Per-cohort orchestration: fetch → organize → decide what to send
├── scheduler.js            # Splits assignments into "due today" / "due soon" buckets
├── config/
│   └── majors.js           # Cohort definitions (feed URL, group name, timing rules)
├── services/
│   ├── canvas.js           # Fetches the live Canvas feed, falls back to a local .ics file
│   ├── whatsapp.js         # Initializes the WhatsApp Web client and sends messages
│   └── state.js            # Reads/writes daily state so reminders aren't duplicated
├── messages/
│   └── message.js          # Builds the four WhatsApp reminder message templates
├── backupfiles/            # Static .ics fallback calendars, one per cohort
├── data/                   # Persisted state.json / day.json (created at runtime)
├── utils/
│   └── dates.js            # Currently unused placeholder
├── canvas-bot.service       # systemd unit: runs the bot once
├── canvas-bot.timer         # systemd timer: fires the unit 3x/day
└── timer.target.wants/      # systemd install target for the timer
```

## Notes and limitations

- `whatsapp-web.js` is an unofficial client that automates the WhatsApp Web interface — it isn't Meta's official API, so it depends on WhatsApp's web client not changing in breaking ways, and using it may carry some risk to the paired account under WhatsApp's terms of service.
- Puppeteer's Chromium path is currently hardcoded to `/usr/bin/chromium` in `services/whatsapp.js` — if Chromium is installed elsewhere on your system, update that path.
- `headless: false` is set for the WhatsApp client, which means it expects a display environment to launch a visible browser window (or needs to run under something like `xvfb` on a headless server).
- `utils/dates.js` exists in the repo but is currently empty/unused.
- There's no automated test suite yet.

## Disclaimer

This project uses your Canvas calendar feed and an unofficial WhatsApp automation library. Keep your `.env` file (feed URLs, group names) and your `.wwebjs_auth/` session data private — both are already excluded via `.gitignore`, so make sure they stay that way if you fork or modify this project.
