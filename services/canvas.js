const ical = require('node-ical');

/*
 * Fetch assignments from Canvas Calendar Feed.
 */
async function fetchCanvasEvents(url) {

    const events = await ical.fromURL(url);

    const assignments = [];

    for (const key in events) {

        const event = events[key];

        if (
            event.type === 'VEVENT' &&
            event.summary &&
            event.start
        ) {

            assignments.push({
                title: event.summary,
                dueDate: event.start
            });
        }
    }
    return assignments;
}
module.exports = {
    fetchCanvasEvents
};
