const {
    fetchCanvasEvents
} = require('./services/canvas');

const fs = require('node:fs/promises');

const {
    loadState,
    saveState,
    resetState,
    loadDay,
    saveDay
} = require('./services/state');

const {
    organizeAssignments
} = require('./scheduler');

const {
    sendMessage
} = require('./services/whatsapp');

const {
    formatType1,
    formatType2,
    formatType3,
    formatType4
} = require('./messages/message');

async function processMajor(major, hour, today, day) {

    let state = loadState(major.id);

    if (state.date != today) {

        state = resetState(major.id, today);

    }

    console.log("\tFetching Canvas feed...");

    const assignments = await fetchCanvasEvents(major.feed, major.backupfile);

    console.log("\tCanvas fetched");

    const { dueToday, dueSoon } = organizeAssignments(assignments, major.daysAhead, major.morningPromotionHour);

    const announcedAssignmentPush = !state.sentType1;

    console.log("\tProcessing messages...");

    if (hour >= 7 && (!state.sentType1 || !state.sentType2)) {

        const type1 = formatType1(dueSoon);

        const type2 = formatType2(dueToday);

        if (type1 && !state.sentType1 && day.day % major.type1Frequency === 0 && day.day != 6) {

            await sendMessage(major.group, type1);

            state.sentType1 = true;

	    console.log("\t\t\tSent type 1!");

	}

        if (type2 && !state.sentType2) {

            await sendMessage(major.group, type2);

            state.sentType2 = true;

	    console.log("\t\t\tSent type 2!");

        }

    }

    if (hour >= 12 && !state.sentType3) {

        const type3 = formatType3(dueToday);

        if (type3) {

            await sendMessage(major.group, type3);

            state.sentType3 = true;

	    console.log("\t\t\tSent type 3!");

        }

    }


    if (hour >= 18 && !state.sentType4) {

        const type4 = formatType4(dueToday);

        if (type4) {

            await sendMessage(major.group, type4);

            state.sentType4 = true;

	    console.log("\t\t\tSent type 4!");

        }

    }


    console.log("\tFinished the messaging part!");


    if (announcedAssignmentPush) {

        for (const assignment of dueSoon) {

            state.announcedAssignments.push(assignment.title);

        }

    }


    saveState(major.id, state);

}

module.exports = {

    processMajor

};
