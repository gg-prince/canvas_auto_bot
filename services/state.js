const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../data/state.json');
const DAY_FILE = path.join(__dirname, '../data/day.json');

function createDefaultState(today = '') {

    return {

        date: today,

        announcedAssignments: [],

        sentType1: false,

        sentType2: false,

        sentType3: false,

        sentType4: false

    };

}

function readDatabase() {

    try {

        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

    } catch {

        return {

            majors: {}

        };

    }

}

function writeDatabase(stateDatabase) {

    fs.writeFileSync(STATE_FILE, JSON.stringify(stateDatabase, null, 2));

}

function loadState(majorId) {

    const stateDatabase = readDatabase();

    if (!stateDatabase.majors[majorId]) {

        stateDatabase.majors[majorId] = createDefaultState();

        writeDatabase(stateDatabase);

    }

    return stateDatabase.majors[majorId];

}

function saveState(majorId, state) {

    const stateDatabase = readDatabase();

    stateDatabase.majors[majorId] = state;

    writeDatabase(stateDatabase);

}

function resetState(majorId, today) {

    const state = createDefaultState(today);

    saveState(majorId, state);

    return state;

}

function loadDay() {

    return JSON.parse(fs.readFileSync(DAY_FILE, 'utf8'));

}

function saveDay(day) {

    fs.writeFileSync(DAY_FILE, JSON.stringify(day, null, 2));

}

module.exports = {

    loadState,

    saveState,

    resetState,

    loadDay,

    saveDay

};
