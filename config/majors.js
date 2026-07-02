require('dotenv').config();

module.exports = [

    {
        id: 'bse-j26',

        name: 'BSE January 2026',

        feed: process.env.CANVAS_FEED,

        group: process.env.GROUP_NAME,

        daysAhead: 7,

        type1Frequency: 2,

        morningPromotionHour: 10

    },

    {
        id: 'bel-j26',

        name: 'BEL January 2026',

        feed: process.env.CANVAS_FEED_BEL,

        group: process.env.GROUP_NAME_BEL,

        daysAhead: 7,

        type1Frequency: 2,

        morningPromotionHour: 10

    }

];
