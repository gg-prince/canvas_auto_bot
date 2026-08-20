const ical = require('node-ical');
const fs = require('node:fs/promises');

/*
 * Fetch assignments from Canvas Calendar Feed.
 */
async function fetchCanvasEvents(url, backupFilePath) {

    let events;

    try {

	console.log("Trying live canvas...");
	events = await ical.fromURL(url);
	console.log("Found live canvas!");

    }catch (error){

	console.log(`Live canvas not found. Trying local file at: ${backupFilePath}...\n`);

	try {
    
	   const rawFileData = await fs.readFile(backupFilePath, 'utf-8');
	   events = ical.parseICS(rawFileData);

	   console.log("Found local file, and now processing!");

	}

	catch (fileError){

	   console.error("Couldn't find the file!", fileError.message);

	}
    

    }

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
