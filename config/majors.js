require('dotenv').config();

module.exports = {
    
    majors: [

        {
            id: 'bse-j26',

            name: 'BSE January 2026',

            feed: process.env.CANVAS_FEED,

            backupfile: 'backupfiles/bckup.ics',

            destination: process.env.GROUP_NAME,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10

        },

        {
            id: 'bel-j26',

            name: 'BEL January 2026',

            feed: process.env.CANVAS_FEED_BEL,

            backupfile: 'backupfiles/bel_j26.ics',

            destination: process.env.GROUP_NAME_BEL,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10

        },

        {
            id: 'bel-m25',

            name: 'BEL May 2025',

            feed: process.env.CANVAS_FEED_BEL_M25,

            backupfile: 'backupfiles/bel_m25.ics',

            destination: process.env.GROUP_NAME_BEL_M25,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10

        },

        {
            id: 'bse-m25',

            name: 'BSE May 2025',

            feed: process.env.CANVAS_FEED_BSE_M25,

            backupfile: 'backupfiles/bse_m25.ics',

            destination: process.env.GROUP_NAME_BSE_M25,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10

        },

        {
            id: 'bse-s25',

            name: 'BSE September 2025',

            feed: process.env.CANVAS_FEED_BSE_S25,

            backupfile: 'backupfiles/bse_s25.ics',

            destination: process.env.GROUP_NAME_BSE_S25,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10

        }


    ],


    premiumUsers: [

        {
            id: '250787545783',

            name: 'Ivan Uwakunda',

            feed: process.env.CANVAS_FEED_250787545783,

            backupfile: '../backupfile/250787545783.ics',

            destination: process.env.CONTACT_INFO_250787545783,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10,

	    active: false

        },
        {
            id: '250794786256',

            name: 'Ndagijimana Ismael',

            feed: process.env.CANVAS_FEED_250794786256,

            backupfile: '../backupfile/250794786256.ics',

            destination: process.env.CONTACT_INFO_250794786256,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10

        },
        {
            id: '250796666336',

            name: 'Gwiza Ian',

            feed: process.env.CANVAS_FEED_250796666336,

            backupfile: '../backupfile/250796666336.ics',

            destination: process.env.CONTACT_INFO_250796666336,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10,

            active: false


        },
        {
            id: '250791893007',

            name: 'Micomyiza Bonheur',

            feed: process.env.CANVAS_FEED_250791893007,

            backupfile: '../backupfile/250791893007.ics',

            destination: process.env.CONTACT_INFO_250791893007,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10,

            active: false


        },
        {
            id: '250791514938',

            name: 'Gerardine Uwase',

            feed: process.env.CANVAS_FEED_250791514938,

            backupfile: '../backupfile/250791514938.ics',

            destination: process.env.CONTACT_INFO_250791514938,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10,

            active: false


        },
        {
            id: '250792892140',

            name: 'Grace Idoko',

            feed: process.env.CANVAS_FEED_250792892140,

            backupfile: '../backupfile/250792892140.ics',

            destination: process.env.CONTACT_INFO_250792892140,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10,

            active: false


        },
        {
            id: '250736433186',

            name: 'Sabin Manzi',

            feed: process.env.CANVAS_FEED_250736433186,

            backupfile: '../backupfile/250736433186.ics',

            destination: process.env.CONTACT_INFO_250736433186,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10,

            active: false


        },
        {
            id: '250788254098',

            name: 'Hirwa Bruno',

            feed: process.env.CANVAS_FEED_250788254098,

            backupfile: '../backupfile/250788254098.ics',

            destination: process.env.CONTACT_INFO_250788254098,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10,

            active: false


        },
        {
            id: '250781165054',

            name: 'Gatete Fabrice',

            feed: process.env.CANVAS_FEED_250781165054,

            backupfile: '../backupfile/250781165054.ics',

            destination: process.env.CONTACT_INFO_250781165054,

            daysAhead: 7,

            type1Frequency: 2,

            morningPromotionHour: 10,

            active: false


        },

    ]



};
