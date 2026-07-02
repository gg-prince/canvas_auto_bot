const {
    fetchCanvasEvents
} = require('./services/canvas');

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

    if (state.date !== today) {

        state = resetState(today);

        saveState(major.id, state);

    }

    const assignments = await fetchCanvasEvents(major.feed);

    const { dueToday, dueSoon } = organizeAssignments(assignments, major.daysAhead, major.morningPromotionHour);

    const announcedAssignmentPush = !state.sentType1;

    if (hour >= 7 && (!state.sentType1 || !state.sentType2)) {

        const type1 = formatType1(dueSoon);

        const type2 = formatType2(dueToday);

        if (type1 && !state.sentType1 && day.day % major.type1Frequency === 0) {

            await sendMessage(major.group, type1);

        }

        state.sentType1 = true;

        if (type2 && !state.sentType2) {

            await sendMessage(major.group, type2);

            state.sentType2 = true;

        }

    }

    if (hour >= 12 && !state.sentType3) {

        const type3 = formatType3(dueToday);

        if (type3) {

            await sendMessage(major.group, type3);

            state.sentType3 = true;

        }

    }


    if (hour >= 18 && !state.sentType4) {

        const type4 = formatType4(dueToday);

        if (type4) {

            await sendMessage(major.group, type4);

            state.sentType4 = true;

        }

    }


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
