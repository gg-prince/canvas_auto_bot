const {
    fetchCanvasEvents
} = require('./services/canvas');

const {
    loadState,
    saveState,
    resetState
} = require('./services/state');

const {
    organizeAssignments
} = require('./scheduler');

const {
    formatType1,
    formatType2,
    formatType3,
    formatType4
} = require('./messages/message');


async function processSource(source, hour, today, day, sendMessage) {

    let state = loadState(source.id);

    if (state.date != today) {

        state = resetState(source.id, today);

    }

    console.log("\tFetching Canvas feed...");

    const assignments = await fetchCanvasEvents(
        source.feed,
        source.backupfile
    );

    console.log("\tCanvas fetched");

    const {
        dueToday,
        dueSoon
    } = organizeAssignments(
        assignments,
        source.daysAhead,
        source.morningPromotionHour
    );

    console.log("\tProcessing messages...");


    if (hour >= 7 && (!state.sentType1 || !state.sentType2)) {

        const type1 = formatType1(dueSoon);

        const type2 = formatType2(dueToday);


        if (
            type1 &&
            !state.sentType1 &&
            day.day % source.type1Frequency === 0 &&
            day.day != 6
        ) {

            await sendMessage(type1);

            state.sentType1 = true;

            console.log("\t\t\tSent type 1!");

        }


        if (type2 && !state.sentType2) {

            await sendMessage(type2);

            state.sentType2 = true;

            console.log("\t\t\tSent type 2!");

        }

    }


    if (hour >= 12 && !state.sentType3) {

        const type3 = formatType3(dueToday);

        if (type3) {

            await sendMessage(type3);

            state.sentType3 = true;

            console.log("\t\t\tSent type 3!");

        }

    }


    if (hour >= 18 && !state.sentType4) {

        const type4 = formatType4(dueToday);

        if (type4) {

            await sendMessage(type4);

            state.sentType4 = true;

            console.log("\t\t\tSent type 4!");

        }

    }


    console.log("\tFinished the messaging part!");

    saveState(source.id, state);

}


module.exports = {
    processSource
};