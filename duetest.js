const {
    fetchCanvasEvents
} = require('./canvas');

async function testCanvasDates() {
    try {
        const assignments = await fetchCanvasEvents("https://alueducation.instructure.com/feeds/calendars/user_WUgFl10bkBuH66w4aOzzNHxlvDXkYJZwpvUvl131.ics");

        console.log(`Found ${assignments.length} assignments.\n`);

        for (const assignment of assignments) {

            if (!assignment.dueDate) continue;

            const due = new Date(assignment.dueDate);

	if ((new Date()).setHours(0, 0, 0, 0) == due.setHours(0, 0, 0, 0)){

            console.log("========================================");
            console.log(assignment);
	}
        }

    } catch (err) {
        console.error(err);
    }
}

testCanvasDates();
