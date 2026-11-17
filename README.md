# Canvas WhatsApp Reminder Bot

An automated WhatsApp reminder system that helps students stay updated with their Canvas assignments and deadlines.

The system retrieves assignment deadlines from Canvas Calendar feeds and sends scheduled WhatsApp reminders to academic intake groups and individual premium subscribers.

It is built with Node.js and designed to support multiple academic majors, intakes, and personalized reminder subscriptions through a configuration-driven architecture.

---

## Features

### 1. Automated Canvas Integration

- Retrieves assignments directly from Canvas Calendar (iCalendar) feeds.
- Extracts assignment titles and due dates.
- Automatically falls back to local `.ics` backups when a Canvas feed is unavailable.
- Supports multiple majors and academic intakes without duplicating processing logic.

### 2. Scheduled WhatsApp Reminders

The bot sends four types of reminders throughout the day:

| Reminder | Schedule | Purpose |
|---|---|---|
| Type 1 | 7:00 AM | Upcoming assignments due within the configured number of days |
| Type 2 | 7:00 AM | Assignments due today, including their deadlines |
| Type 3 | 12:00 PM | Afternoon reminder for assignments due today |
| Type 4 | 6:00 PM | Evening reminder for assignments due today |

The system tracks which reminders have already been sent to prevent duplicate messages.

### 3. Multi-Major and Multi-Intake Support

All academic sources are managed through a centralized configuration file.

Each major or intake can have its own:

- Canvas Calendar feed.
- Local backup file.
- WhatsApp destination.
- Reminder settings.
- Independent reminder state.

Adding another intake does not require duplicating the processing logic.

### 4. Premium Personalized Reminders

Students can subscribe to premium reminders and receive assignment notifications directly in their personal WhatsApp inbox.

Premium users use the same Canvas fetching, assignment processing, and reminder-generation pipeline as academic groups.

However, their messages are delivered privately rather than to a WhatsApp group.

Premium subscriptions support:

- Individually configured Canvas feeds.
- Personalized reminder delivery.
- Configurable reminder periods.
- Configurable Type 1 reminder frequency.
- Subscription-day tracking.
- Paid-day accounting.
- Renewal and late-renewal handling.
- Independent reminder states.

### 5. Automatic Canvas Backup Refresh

The bot automatically refreshes local Canvas `.ics` backups every Sunday.

Each backup is refreshed independently.

The refresh process:

1. Downloads the latest Canvas Calendar feed.
2. Checks the HTTP response.
3. Parses the downloaded iCalendar content.
4. Writes the new content to a temporary file.
5. Replaces the existing backup only after successful validation.

If a particular feed fails, its existing backup remains untouched.

This prevents one unavailable Canvas feed from affecting other backups.

---

## Project Structure

```text
canvas-bot/
│
├── bot.js
├── processSource.js
├── scheduler.js
├── backup-refresh.js
│
├── config/
│   └── majors.js
│
├── services/
│   ├── canvas.js
│   ├── state.js
│   └── whatsapp.js
│
├── messages/
│   └── message.js
│
├── backupfiles/
│   ├── bckup.ics
│   ├── bel_j26.ics
│   ├── bel_m25.ics
│   ├── bse_m25.ics
│   └── bse_s25.ics
│
├── data/
│   ├── day.json
│   └── state.json
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

*The backup filenames and intake examples above represent the existing project structure; adjust them as new intakes are added.*

### Main Files

| File | Responsibility |
|---|---|
| `bot.js` | Application entry point and orchestration |
| `processSource.js` | Processes an individual major or premium user |
| `scheduler.js` | Handles reminder scheduling |
| `backup-refresh.js` | Refreshes local Canvas backups |
| `config/majors.js` | Central configuration for majors and premium users |
| `services/canvas.js` | Retrieves and processes Canvas Calendar feeds |
| `services/state.js` | Manages persistent reminder and subscription state |
| `services/whatsapp.js` | Handles WhatsApp connections and message delivery |
| `messages/message.js` | Formats reminder messages |
| `data/day.json` | Tracks the bot's daily and weekly progression |
| `data/state.json` | Stores reminder and premium subscription state |

---

## How It Works

The application follows a shared processing pipeline for academic groups and premium users.

```text
                    bot.js
                      |
                      v
                  scheduler.js
                      |
                      v
                config/majors.js
                      |
             +--------+--------+
             |                 |
             v                 v
          Majors          Premium Users
             |                 |
             +--------+--------+
                      |
                      v
                processSource()
                      |
                      v
                services/canvas.js
                      |
             +--------+--------+
             |                 |
             v                 v
        Live Canvas       Local Backup
             |                 |
             +--------+--------+
                      |
                      v
              Assignment Processing
                      |
                      v
               Reminder Generation
                      |
                      v
             services/whatsapp.js
                      |
             +--------+--------+
             |                 |
             v                 v
        WhatsApp Groups   Private Messages
```

### Processing Flow

1. The application starts and initializes WhatsApp.
2. The scheduler determines which reminder operations should run.
3. The application loads configured majors and premium users.
4. Each source is passed to the shared `processSource()` function.
5. Canvas assignments are retrieved from the live feed or local backup.
6. Assignments are categorized according to their due dates.
7. Appropriate reminders are generated.
8. Messages are delivered to the configured WhatsApp destination.
9. Persistent state is updated to prevent duplicate notifications.

---

## Configuration

All academic majors and premium subscribers are managed through:

`config/majors.js`

The configuration separates academic groups from individual premium subscribers.

### Academic Majors

Example:

```js
{
    id: 'bse_m25',
    name: 'BSE May 2025',
    feed: process.env.BSE_M25_FEED,
    backupfile: 'backupfiles/bse_m25.ics',
    destination: 'BSE May 2025',
    daysAhead: 7,
    type1Frequency: 2,
    morningPromotionHour: 10
}
```

Each field serves a specific purpose:

| Field | Description |
|---|---|
| `id` | Unique identifier for the source |
| `name` | Human-readable source name |
| `feed` | Canvas Calendar API URL |
| `backupfile` | Local `.ics` fallback file |
| `destination` | WhatsApp group destination |
| `daysAhead` | How far ahead to consider upcoming assignments |
| `type1Frequency` | Frequency of Type 1 reminders |
| `morningPromotionHour` | Configurable morning promotion hour |

The actual configuration should follow the existing implementation.

### Premium Users

Premium users are defined separately within the same configuration.

Example:

```js
{
    id: '250781165054',
    name: 'Gatete Fabrice',
    feed: process.env.CANVAS_FEED_250781165054,
    destination: process.env.CONTACT_INFO_250781165054,
    daysAhead: 7,
    type1Frequency: 2,
    morningPromotionHour: 10
}
```

Premium users do not need a WhatsApp group.

Their `destination` identifies their personal WhatsApp contact.

The shared processing function handles both academic groups and premium users, while the WhatsApp service determines the appropriate delivery method.

### Adding a New Major

1. Add the Canvas feed URL to `.env`.
2. Add the corresponding configuration entry to `config/majors.js`.
3. Create or provide the appropriate local backup file.
4. Configure its WhatsApp group destination.

No changes to the shared processing logic should be necessary.

### Adding a Premium User

1. Add the user's Canvas feed URL to `.env`.
2. Add their WhatsApp contact information to `.env`.
3. Add their configuration to the `premiumUsers` array.
4. Initialize their subscription state with the appropriate purchased days.

Example environment variables:

```env
CANVAS_FEED_250781165054=https://canvas.example/calendar/feed/...
CONTACT_INFO_250781165054=250781165054@c.us
```

Never commit `.env` to Git.

---

## Premium Subscription Management

Premium subscriptions are managed independently for each user.

The system tracks subscription usage through persistent state.

### Subscription State

Each premium user has the following subscription fields:

| Field | Description |
|---|---|
| `paidDays` | Total number of subscription days purchased |
| `usedDays` | Total number of subscription days consumed |
| `months` | Number of fully consumed 30-day subscription periods |

These values are maintained independently of daily reminder flags.

### Subscription Duration

Subscriptions are measured in days.

One subscription month is equivalent to 30 consumed days.

The system tracks actual consumed days rather than relying on calendar-month boundaries.

For example:

- 30 paid days represent one subscription month.
- 60 paid days represent two subscription months.
- 90 paid days represent three subscription months.

The `months` value represents consumed 30-day periods.

### Daily Subscription Accounting

Subscription usage is tracked through `usedDays`.

A user retains access while:

```js
usedDays <= paidDays
```

This means the final purchased day remains usable.

The subscription expires only when:

```js
usedDays > paidDays
```

Expired users are skipped during premium processing, while their subscription usage continues to be tracked according to the implemented accounting rules.

### Renewals

When a user renews before their subscription expires, the newly purchased days are added to their existing paid balance.

When a user renews after expiration, the new subscription starts from their accumulated usage position.

The late-renewal calculation is:

```js
paidDays = usedDays + newPaidDays;
```

This prevents previously consumed or expired days from being incorrectly restored.

For example:

- A user has purchased 30 days.
- Their usage reaches 35 days.
- They purchase another 30 days.

The new paid balance becomes:

```js
paidDays = 35 + 30;
```

The user receives 30 additional days from their renewal rather than having their previous usage reset.

### Subscription State and Daily Reminder State

Daily reminder flags must be reset independently of subscription information.

Resetting a user's daily reminder state must not erase:

- Purchased days.
- Consumed days.
- Subscription month accounting.

This separation prevents normal daily processing from corrupting premium subscription records.

---

## Reminder Types

The bot uses four progressively timed reminders.

### Type 1 — Upcoming Assignments

<text>Schedule: 7:00 AM</text>

Notifies students about assignments approaching within the configured `daysAhead` period.

The reminder frequency is configurable through `type1Frequency`.

For example, a frequency of `2` means the reminder is eligible on alternating bot day-counter values.

Type 1 reminders are not sent on Sunday.

### Type 2 — Due Today

<text>Schedule: 7:00 AM</text>

Lists assignments due on the current day, including their respective deadline times.

### Type 3 — A Few Hours Remaining

<text>Schedule: 12:00 PM</text>

Sends a reminder for assignments due today.

### Type 4 — Doomed

<text>Schedule: 6:00 PM</text>

Sends the final evening reminder for assignments due today.

Each reminder type has its own state flag to prevent repeated messages during the same processing day.

---

## Canvas Backup System

The bot prioritizes live Canvas feeds.

If a live feed cannot be retrieved, the application attempts to read the corresponding local `.ics` backup.

The backup process is designed to preserve the last working copy of each feed.

### Automatic Weekly Refresh

Backups are refreshed on Sunday.

The application tracks the current day and week in `data/day.json`.

When the date changes and the weekly counter reaches Sunday, `refreshBackups()` is executed.

Each configured major is processed independently.

### Safe Backup Replacement

The refresh process follows these steps:

1. Fetch the live Canvas feed.
2. Verify the HTTP response.
3. Parse the iCalendar content.
4. Write the content to a temporary `.tmp` file.
5. Rename the temporary file over the existing backup.

If a download or validation fails, the existing backup is preserved.

A failed backup does not prevent other successful backups from being updated.

---

## WhatsApp Integration

The application uses `whatsapp-web.js` to communicate through WhatsApp Web.

The WhatsApp service is responsible for:

- Establishing the WhatsApp connection.
- Managing authentication.
- Handling QR-code authentication when required.
- Sending messages to WhatsApp groups.
- Sending personalized messages to premium users.

### Group Delivery

Academic sources send reminders to their configured WhatsApp groups.

### Private Delivery

Premium users receive reminders directly in their personal WhatsApp inbox.

The shared processing pipeline allows both types of sources to use the same reminder logic without duplicating Canvas retrieval or message formatting.

---

## Persistent State Management

The bot maintains state to prevent duplicate messages and manage subscription accounting.

### Daily and Weekly State

`data/day.json` tracks the application's current date and day/week progression.

This is used for:

- Detecting a new processing day.
- Managing the weekly counter.
- Determining Type 1 reminder frequency.
- Triggering Sunday backup refreshes.

### Reminder State

`data/state.json` stores source-specific processing state.

It tracks which reminders have already been sent and stores premium subscription information.

Each source has an independent state identifier.

This prevents one major or premium user's reminder history from affecting another.

---

## Environment Variables

Sensitive configuration values are stored in `.env`.

Examples:

```env
BSE_M25_FEED=https://canvas.example/calendar/feed/...
BEL_J26_FEED=https://canvas.example/calendar/feed/...

CANVAS_FEED_250781165054=https://canvas.example/calendar/feed/...
CONTACT_INFO_250781165054=250781165054@c.us
```

Actual values should never be committed to Git.

Use `.gitignore` to exclude:

- `.env`
- WhatsApp authentication/session data.
- Sensitive backup data.
- Temporary files.
- Local development artifacts.

---

## Installation and Setup

### Requirements

- Node.js.
- npm.
- Chromium.
- Git.
- Internet connectivity.
- A WhatsApp account for the bot.

### Install Dependencies

Clone the repository:

```bash
git clone https://github.com/gg-prince/canvas_auto_bot.git
cd canvas_auto_bot
```

Install project dependencies:

```bash
npm install
```

Configure the required environment variables in `.env`.

Ensure the configured Chromium executable is available at the path expected by the WhatsApp service.

### Run the Bot

```bash
node bot.js
```

On first authentication, scan the displayed WhatsApp QR code using the WhatsApp account intended for the bot.

The application can then initialize its scheduled processing.

---

## Running as a Linux Service

For continuous operation, the bot can be managed through `systemd`.

A service allows the application to:

- Start automatically after a server reboot.
- Restart after unexpected failures.
- Run independently of an interactive terminal.
- Produce logs accessible through `journalctl`.

Example service management commands:

```bash
sudo systemctl start canvas-bot
sudo systemctl status canvas-bot
sudo systemctl restart canvas-bot
sudo systemctl stop canvas-bot
```

View application logs:

```bash
sudo journalctl -u canvas-bot -f
```

The actual service configuration should use the correct project directory, Node.js executable, environment file, and execution user.

---

## Design Principles

The project follows several engineering principles:

1. **Configuration-driven architecture:** New majors and premium users should not require duplicated processing logic.
2. **Shared processing pipeline:** Academic groups and premium users use the same Canvas retrieval and reminder-generation logic.
3. **Independent state:** Each source maintains its own reminder and subscription state.
4. **Fault tolerance:** Local Canvas backups allow processing to continue when live feeds are unavailable.
5. **Safe file replacement:** Backup files are only replaced after successful retrieval and validation.
6. **Separation of responsibilities:** Canvas, WhatsApp, state management, scheduling, and message formatting are handled by separate modules.
7. **Maintainability:** New intakes and premium subscribers should primarily require configuration changes.

---

## Future Development

Potential areas for further development include:

- Self-service student intake registration.
- Automatic WhatsApp group provisioning.
- A public intake discovery website.
- Automated premium subscription management.
- Administrative dashboards.
- Improved operational monitoring.
- More resilient state and backup management.

---

## License

Add the project's chosen license here.

---

**Built to help students stay ahead of their Canvas deadlines.**
