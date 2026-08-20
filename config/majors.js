require('dotenv').config();

module.exports = [

    {
        id: 'bse-j26',

        name: 'BSE January 2026',

        feed: process.env.CANVAS_FEED,

	backupfile: '../backupfile/bckup.ics',

        group: process.env.GROUP_NAME,

        daysAhead: 7,

        type1Frequency: 2,

        morningPromotionHour: 10

    },

    {
        id: 'bel-j26',

        name: 'BEL January 2026',

        feed: process.env.CANVAS_FEED_BEL,

	backupfile: '../backupfile/bel_j26.ics',

        group: process.env.GROUP_NAME_BEL,

        daysAhead: 7,

        type1Frequency: 2,

        morningPromotionHour: 10

    },

    {
        id: 'bel-m25',

        name: 'BEL May 2025',

        feed: process.env.CANVAS_FEED_BEL_M25,

	backupfile: '../backupfile/bel_m25.ics',

        group: process.env.GROUP_NAME_BEL_M25,

        daysAhead: 7,

        type1Frequency: 2,

        morningPromotionHour: 10

    },

    {
        id: 'bse-m25',

        name: 'BSE May 2025',

        feed: process.env.CANVAS_FEED_BSE_M25,

	backupfile: '../backupfile/bse_m26.ics',

        group: process.env.GROUP_NAME_BSE_M25,

        daysAhead: 7,

        type1Frequency: 2,

        morningPromotionHour: 10

    },

    {
        id: 'bse-s25',

        name: 'BSE September 2025',

        feed: process.env.CANVAS_FEED_BSE_S25,

	backupfile: '../backupfile/bse_s26.ics',

        group: process.env.GROUP_NAME_BSE_S25,

        daysAhead: 7,

        type1Frequency: 2,

        morningPromotionHour: 10

    }


];
