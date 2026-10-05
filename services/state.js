const fs = require('fs');
const path = require('path')

const STATE_FILE = path.join(__dirname, '../data/state.json');
const DAY_FILE = path.join(__dirname, '../data/day.json');

function createDefaultState(today = '') {

    return {

        date: today,

        sentType1: false,

        sentType2: false,

        sentType3: false,

        sentType4: false

    };

}

function readDatabase() {

    try {

        const database = JSON.parse(
            fs.readFileSync(STATE_FILE, 'utf8')
        );

        if (!database.sources) {

            database.sources = database.majors || {};

            delete database.majors;

            writeDatabase(database);

        }

        return database;

    } catch {

        return {

            sources: {}

        };

    }

}

function writeDatabase(stateDatabase) {

    fs.writeFileSync(STATE_FILE, JSON.stringify(stateDatabase, null, 2));

}

function loadState(sourceId) {

    const stateDatabase = readDatabase();

    if (!stateDatabase.sources[sourceId]) {

        stateDatabase.sources[sourceId] = createDefaultState();

    }

    return stateDatabase.sources[sourceId];

}

function saveState(sourceId, state) {

    const stateDatabase = readDatabase();

    stateDatabase.sources[sourceId] = state;

    writeDatabase(stateDatabase);

}

function resetState(sourceId, today) {

    const state = createDefaultState(today);

    saveState(sourceId, state);

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
