require('dotenv').config();

const config = require('./config/majors');

const { loadMajors } = require('./services/sources');

const { refreshBackups } = require('./backup-refresh');

const {
    initializeWhatsapp,
    sendMessage,
    sendPrivateMessage,
    groupExists
} = require('./services/whatsapp');

const {
    loadDay,
    saveDay
} = require('./services/state');

const { processSource } = require('./processSource');

(async () => {

    const majors = await loadMajors(config.majors);

    const now = new Date();

    const hour = now.getHours();

    const today = now.toLocaleDateString('en-CA');

    let day = loadDay();

    if (day.date != today) {

        day.date = today;

        if (day.day == 6) {

            day.day = 0;
            day.week++;

            await refreshBackups(majors);

        } else {

            day.day++;

        }

        saveDay(day);

    }

    await initializeWhatsapp();

    const activeMajors = [];

    for (const major of majors) {

        if (major.websiteManaged) {

            const exists = await groupExists(major.destination);

            if (!exists) {
                console.log(
                    `Skipping ${major.name}: WhatsApp group not found.`
                );
                continue;
            }

        }

        activeMajors.push(major);

    }

    for (const major of activeMajors) {

        console.log(`\nProcessing ${major.name}...`);

        await processSource(
            major,
            hour,
            today,
            day,
            message => sendMessage(major.destination, message)
        );

        console.log('Done✅');
        console.log('------------------------------');

    }

    for (const user of config.premiumUsers) {

        if (!user.active) continue;

        console.log(`\nProcessing ${user.name}...`);

        await processSource(
            user,
            hour,
            today,
            day,
            message => sendPrivateMessage(user.destination, message)
        );

        console.log('Done✅');
        console.log('------------------------------');

    }

    await new Promise(resolve => setTimeout(resolve, 30000));

    process.exit(0);

})();