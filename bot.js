require('dotenv').config();

const majors = require('./config/majors');

const {
    initializeWhatsapp
} = require('./services/whatsapp');

const {
    loadDay,
    saveDay
} = require('./services/state');

const {
    processMajor
} = require('./processMajor');

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

        }else{
            day.day++;
	}

        saveDay(day);

    }

    await initializeWhatsapp();

    for (const major of majors) {

        console.log(`Processing ${major.name}...`);

        await processMajor(major, hour, today, day);

	console.log(`Done✅`);

    }

    await new Promise(resolve =>

        setTimeout(resolve, 30000)

    );

    process.exit(0);

})();
