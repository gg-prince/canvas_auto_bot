require('dotenv').config();

const fs = require('node:fs/promises');

const {
    fetchCanvasEvents
} = require('./services/canvas');

(async () => {

    const backupPath = 'backupfiles/bel_j26.ics';

    const assignments =
        await fetchCanvasEvents("https://alueducation.instructure.com/feeds/calendars/user_SeBRboPcqwRojTFkbNwRmjdqi1LUB7LprQxJYg0s.ics", backupPath);

    const today =
        new Date().toLocaleDateString('en-CA');

    console.log("==================================");
    console.log("Today's date:", today);
    console.log("==================================\n");

    for (const assignment of assignments) {

        console.log("Title:");
        console.log(assignment.title);

        console.log("Local Date:");
        console.log(
            new Date(assignment.dueDate)
                .toLocaleDateString('en-CA')
        );

        console.log(
            "isDueToday:",
            new Date(assignment.dueDate)
                .toLocaleDateString('en-CA') === today
        );

        console.log("----------------------------------");

    }

})();
