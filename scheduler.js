function isDueToday(dueDate) {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    return due === today;

}

function isDueWithinDays(dueDate, numberOfDays) {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const limit = new Date(today);
    limit.setDate(limit.getDate() + numberOfDays);

    return due > today && due <= limit;

}

function morningAssignments(dueToday, dueSoon, morningHour) {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const dayMs = 1000 * 60 * 60 * 24;

    for (let i = dueSoon.length - 1; i >= 0; i--) {

        const assignment = dueSoon[i];

        const due = new Date(assignment.dueDate);

        const dateOnly = new Date(due);

        dateOnly.setHours(0, 0, 0, 0);

        const daysLeft = Math.ceil((dateOnly - today) / dayMs);

        let hour = due.getHours();

        const minute = due.getMinutes();

	/*
	 * Canvas represents end-of-day deadlines
	 * as 00:00. Treat these as 23:00 instead.
	 */

        if (hour === 0 && minute === 0) {

            hour = 23;

        }

        if (daysLeft === 1 && hour <= morningHour) {

            dueToday.push(assignment);

            dueSoon.splice(i, 1);

        }

    }

}

function organizeAssignments(assignments, daysAhead, morningHour) {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const dueToday = assignments.filter(assignment => isDueToday(assignment.dueDate));

    const dueSoon = assignments.filter(assignment => isDueWithinDays(assignment.dueDate, daysAhead));

    morningAssignments(dueToday, dueSoon, morningHour);

    return {

        dueToday,

        dueSoon

    };

}

module.exports = {

    organizeAssignments

};
