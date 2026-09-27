# Canvas WhatsApp Bot

A Node.js bot that fetches assignments from Canvas and sends automated deadline reminders to students through WhatsApp.

The bot is designed to support multiple majors and intakes from a single configuration, making it possible to expand the system without duplicating the bot logic.

## Features

* Fetches assignments directly from Canvas iCal feeds.
* Supports multiple majors/intakes from one configuration.
* Sends scheduled assignment reminders through WhatsApp.
* Maintains daily state to prevent duplicate processing.
* Automatically uses local Canvas backup files when a live Canvas feed is unavailable.
* Automatically refreshes Canvas backup files every Sunday.
* Safely replaces individual backup files only when their new feed has been successfully downloaded and parsed.
* Preserves the previous backup when a specific Canvas feed fails.
* Runs continuously through the Linux system scheduler.

## Project Structure

```text
canvas-bot/
├── backupfiles/
│   ├── bel_j26.ics
│   ├── bel_m25.ics
│   ├── bse_m25.ics
│   └── bse_s25.ics
│
├── bot.js
├── canvas.js
├── whatsapp.js
├── state.js
├── message.js
├── backup-refresh.js
├── package.json
├── .env
└── ...
```

## How It Works

The bot follows this general flow:

```text
Start bot
   │
   ▼
Check daily state
   │
   ▼
Is this a new day?
   │
   ├── No ────────────────┐
   │                      │
   └── Yes                │
        │                 │
        ▼                 │
   Update day state       │
        │                 │
        ▼                 │
   Is it Sunday?          │
        │                 │
       Yes                │
        │                 │
        ▼                 │
   Refresh Canvas         │
   backup files           │
        │                 │
        └────────┬────────┘
                 ▼
        Process each major
                 │
                 ▼
          Fetch Canvas feed
                 │
          ┌──────┴──────┐
          │             │
       Success       Failure
          │             │
          ▼             ▼
     Use live feed   Use local
                     backup file
          │             │
          └──────┬──────┘
                 ▼
          Process assignments
                 │
                 ▼
          Send WhatsApp reminders
```

## Canvas Feed

Each major/intake is configured with:

* A Canvas iCal feed URL.
* A corresponding local backup file.
* A unique ID used by the bot for state management.

Example:

```js
{
    id: 'bse_m25',
    feed: process.env.BSE_M25_FEED,
    backupfile: 'backupfiles/bse_m25.ics'
}
```

This configuration is shared by both the normal Canvas fetching process and the backup-refresh process.

## Canvas Backup System

The bot maintains local `.ics` files so that assignment processing can continue when a live Canvas feed is temporarily unavailable.

For example:

```text
Canvas BSE M25 feed
        │
        ▼
backupfiles/bse_m25.ics
```

During normal operation, the bot always attempts to use the live Canvas feed first.

If the live feed cannot be reached, the bot reads the corresponding local backup:

```text
Live Canvas
     │
     ├── Available ──► Process live feed
     │
     └── Unavailable ─► Process local backup
```

### Automatic Sunday Refresh

The backup files are automatically refreshed when the bot detects the first new day of Sunday.

The bot already maintains the current date and day in its state. When the date changes:

```js
if (day.date != today) {

    day.date = today;

    if (day.day == 6) {

        day.day = 0;
        day.week++;

        await refreshBackups(majors);

    } else {

        day.day++;

    }

    saveDay(day);
}
```

Therefore, the backup refresh does not require a separate cron job or timer.

The Sunday process is:

```text
First bot run on Sunday
        │
        ▼
Download each Canvas feed
        │
        ▼
Parse and validate feed
        │
        ├── Valid ──────► Replace that backup
        │
        └── Invalid ────► Keep existing backup
```

The other scheduled bot runs on Sunday do not refresh the backups because the date has already been recorded.

### Independent Backup Updates

Each major is handled independently.

For example, if four feeds are refreshed:

```text
BSE M25    ✓ Updated
BSE S25    ✓ Updated
BEL M25    ✗ Failed → Existing backup preserved
BEL J26    ✓ Updated
```

The failure of one feed does not prevent the other valid feeds from being updated.

### Safe File Replacement

The backup refresher does not immediately overwrite the existing backup.

Instead, it:

1. Downloads the Canvas feed.
2. Checks that the HTTP request succeeded.
3. Parses the downloaded content as iCalendar data.
4. Writes the new content to a temporary file.
5. Replaces the existing backup with the validated temporary file.

Conceptually:

```text
Existing backup
      │
      │ remains untouched
      ▼
Download new feed
      │
      ▼
Temporary .tmp file
      │
      ▼
Parse as iCalendar
      │
   ┌──┴──┐
   │     │
 Valid  Invalid
   │     │
   ▼     ▼
Replace  Delete temporary
backup   file
```

This prevents a failed download or invalid Canvas response from destroying a previously working backup.

## Backup Refresh Implementation

The refresh logic is contained in:

```text
backup-refresh.js
```

Its main responsibility is to refresh all configured backup files.

The module is intentionally separate from `canvas.js`.

`canvas.js` is responsible for **reading and processing Canvas feeds**, while `backup-refresh.js` is responsible for **maintaining the local backup files**.

## Assignment Processing

After the Canvas feed has been obtained, the bot extracts events that contain:

* An event type of `VEVENT`
* An assignment title
* A start/due date

These are converted into assignment objects used by the reminder system.

Example:

```js
{
    title: event.summary,
    dueDate: event.start
}
```

## Reminder Schedule

The bot checks assignments at scheduled times throughout the day.

The reminder system is designed to provide progressively more urgent notifications as an assignment deadline approaches.

The exact reminder behavior is controlled by the bot's state and message-processing logic.

## State Management

The bot maintains state so that it knows:

* Which date it is processing.
* Which assignments have already triggered specific reminders.
* The current weekly/day progression used by the bot.

The state prevents the same reminder from being repeatedly sent during multiple bot executions.

A new date causes the daily state to be reset.

## WhatsApp

WhatsApp messaging is handled separately from Canvas processing.

The bot first determines what messages need to be sent and then passes the resulting messages to the WhatsApp layer.

This separation allows assignment retrieval and WhatsApp delivery to remain independent parts of the system.

## Environment Variables

Sensitive Canvas feed URLs and other configuration values should be stored in `.env` rather than directly in source code.

Example:

```env
BSE_M25_FEED=your_canvas_feed_url
BSE_S25_FEED=your_canvas_feed_url
BEL_M25_FEED=your_canvas_feed_url
BEL_J26_FEED=your_canvas_feed_url
```

The `.env` file should not be committed to version control.

## Running the Bot

Install dependencies:

```bash
npm install
```

Start the bot:

```bash
node bot.js
```

For continuous operation on Arch Linux, the bot can be managed as a `systemd` service so that it starts automatically and can restart after failures.

## Adding a New Major

Adding another major/intake should only require adding its configuration.

For example:

```js
{
    id: 'bse_j26',
    feed: process.env.BSE_J26_FEED,
    backupfile: 'backupfiles/bse_j26.ics'
}
```

Then create the corresponding backup file:

```text
backupfiles/bse_j26.ics
```

The existing processing and backup-refresh logic automatically handles it because both systems iterate over the same `majors` configuration.

## Design Principles

The project is structured around a few important principles:

### Single Configuration

Major/intake information is defined once and reused throughout the system.

### Separation of Responsibilities

```text
bot.js
    ↓
Controls the workflow

canvas.js
    ↓
Fetches and parses Canvas data

backup-refresh.js
    ↓
Maintains local Canvas backups

state.js
    ↓
Maintains bot state

message.js
    ↓
Builds reminder messages

whatsapp.js
    ↓
Delivers messages
```

### Fail Safely

When an external service fails, the bot should preserve the last known working data rather than replacing it with invalid or incomplete data.

### Scale Through Configuration

Adding majors or intakes should require configuration changes rather than duplicated processing code.

### Keep External Dependencies Isolated

Canvas and WhatsApp are external systems. Their failures should not unnecessarily break unrelated parts of the bot.
