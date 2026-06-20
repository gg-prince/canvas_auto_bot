require('dotenv').config();

const fs = require('fs');

const {
    fetchCanvasEvents
} = require('./canvas');

const {
    loadState,
    saveState,
    resetState,
    loadDay,
    saveDay
} = require('./state');

const {
    loadStateBel,
    saveStateBel,
    resetStateBel
} = require('./state_bel');

const {
    initializeWhatsapp,
    sendMessage
} = require('./whatsapp');

const {
    formatType1,
    formatType2,
    formatType3,
    formatType4
} = require('./message');

function isDueToday(dueDate, today) {

    return (new Date(dueDate).setHours(0, 0, 0, 0) === today);

}

function isDueWithinWeek(dueDate) {

    const todayNow = new Date();

    const dueDay = new Date(dueDate);

    const sevenDaysLater = new Date();

    sevenDaysLater.setDate(todayNow.getDate() + 7);

    return dueDay >= todayNow && dueDay <= sevenDaysLater;

}

(async () => {

    const hour = new Date().getHours();

    const today = new Date().toLocaleDateString('en-CA');

    const todayForFunc = new Date().setHours(0, 0, 0, 0);

    let state = loadState();

    let day = loadDay();

    let stateBel = loadStateBel();

    /*
     * Reset daily state
     * at the first 7 AM run.
     */
    if (state.date !== today) {

        state = resetState(today);

        saveState(state);

	saveDay(day);

	day.day = day.day + 1;

    }

    if (stateBel.date !== today) {

        stateBel = resetStateBel(today);

        saveStateBel(stateBel);

        console.log('State reset.');
    }


    const assignments = await fetchCanvasEvents(process.env.CANVAS_FEED);
    const assignmentsBel = await fetchCanvasEvents(process.env.CANVAS_FEED_BEL);

    const dueToday = assignments.filter(assignment => isDueToday(assignment.dueDate,todayForFunc));
    const dueTodayBel = assignmentsBel.filter(assignment => isDueToday(assignment.dueDate,todayForFunc));

    const dueInWeek = assignments.filter(assignment => isDueWithinWeek(assignment.dueDate) && !isDueToday(assignment.dueDate, todayForFunc));
    const dueInWeekBel = assignmentsBel.filter(assignment => isDueWithinWeek(assignment.dueDate) && !isDueToday(assignment.dueDate, todayForFunc));



    await initializeWhatsapp();

    const defaultsentType1 = state.sentType1;
    const defaultsentType1Bel = stateBel.sentType1;


    if (hour >= 7 && (!state.sentType1 || !state.sentType2)) {

 	   const type1 = formatType1(dueInWeek);

	    const type2 = formatType2(dueToday);

	    if (type1 && !state.sentType1 && day.day % 2 == 0 && day.day != 6) {

	        await sendMessage(process.env.GROUP_NAME,type1);

		state.sentType1 = true;

	    }

	    if (type2 && !state.sentType2) {

	        await sendMessage(process.env.GROUP_NAME,type2);

		state.sentType2 = true;

	    }

	}



	if (hour >= 7 && (!stateBel.sentType1 || !stateBel.sentType2)) {

           const type1Bel = formatType1(dueInWeekBel);

            const type2Bel = formatType2(dueTodayBel);

            if (type1Bel && !stateBel.sentType1 && day.day % 2 ==0 && day.day != 6) {

                await sendMessage(process.env.GROUP_NAME_BEL,type1Bel);

                stateBel.sentType1 = true;

            }

            if (type2Bel && !stateBel.sentType2) {

                await sendMessage(process.env.GROUP_NAME_BEL,type2Bel);

                stateBel.sentType2 = true;

            }

        }




	
	if (hour >= 12 && !state.sentType3) {

	    const type3 = formatType3(dueToday);

	    if (type3) {

	        await sendMessage(process.env.GROUP_NAME,type3);

		state.sentType3 = true;

	    }

	}



	if (hour >= 12 && !stateBel.sentType3) {

            const type3Bel = formatType3(dueTodayBel);

            if (type3Bel) {

                await sendMessage(process.env.GROUP_NAME_BEL,type3Bel);

                stateBel.sentType3 = true;

            }

        }




	if (hour >= 18 && !state.sentType4) {

	    const type4 = formatType4(dueToday);

	    if (type4) {

	        await sendMessage(process.env.GROUP_NAME,type4);

		state.sentType4 = true;

	    }

	}



	if (hour >= 18 && !stateBel.sentType4) {

            const type4Bel = formatType4(dueTodayBel);

            if (type4Bel) {

                await sendMessage(process.env.GROUP_NAME_BEL,type4Bel);

                stateBel.sentType4 = true;

            }

        }




	if(!defaultsentType1){

	for (const assignment of dueInWeek) {

	    state.announcedAssignments.push(assignment.title);

	}

	}

	if(!defaultsentType1Bel){

        for (const assignmentBel of dueInWeekBel) {

            stateBel.announcedAssignments.push(assignmentBel.title);

        }

        }

	if(day.day % 6 == 0){

	   day.week = day.week + 1;
	   day.day = 0;

	}

	saveDay(day);

	saveState(state);
	saveStateBel(stateBel);

	await new Promise(
	    resolve =>
	        setTimeout(
	            resolve,
	            30000
	        )
	);

	process.exit(0);

})();
