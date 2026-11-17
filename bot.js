require('dotenv').config();

const config = require('./config/majors');

const {
    refreshBackups 
} = require('./backup-refresh');

const {
    initializeWhatsapp,
    sendMessage,
    sendPrivateMessage
} = require('./services/whatsapp');

const {
    loadDay,
    saveDay
} = require('./services/state');

const {
    processSource
} = require('./processSource');

(async () => {

    const now = new Date();

    const hour = now.getHours();

    const today = now.toLocaleDateString('en-CA');

    let day = loadDay();

    if (day.date != today) {

        day.date = today;

        if (day.day == 6) {

            day.day = 0;
            day.week++;

	    await refreshBackups(config.majors);

        }else{
            day.day++;
	}

        saveDay(day);

    }

    await initializeWhatsapp();

    for (const major of config.majors) {

        console.log(`\nProcessing ${major.name}...`);

        await processSource(
            major,
            hour,
            today,
            day,
            message => sendMessage(major.destination, message)
        );

        console.log(`Done✅`);

        console.log(`------------------------------`);

    }

    for (const user of config.premiumUsers) {

	if(!user.active){

	    continue;

	}

        console.log(`\nProcessing ${user.name}...`);

        await processSource(
            user,
            hour,
            today,
            day,
            message => sendPrivateMessage(
                user.destination,
                message
            )
        );

        console.log(`Done✅`);

        console.log(`------------------------------`);

    }

    await new Promise(resolve =>

        setTimeout(resolve, 30000)

    );

    process.exit(0);

})();
