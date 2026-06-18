const fs = require('fs');

const STATE_FILE = './state.json';

/*
 * Reads state.json and returns its contents.
 */
function loadState() {
    try {
        return JSON.parse(
            fs.readFileSync(STATE_FILE, 'utf8')
        );
    } catch (err) {
        return {
            date: '',
            announcedAssignments: []
        };
    }
}

/*
 * Saves state back to state.json.
 */
function saveState(state) {
    fs.writeFileSync(
        STATE_FILE,
        JSON.stringify(state, null, 2)
    );
}

/*
 * Resets daily state.
 */
function resetState(today) {
    return {
        date: today,
        announcedAssignments: [],
	sentType1: false,
	sentType2: false,
	sentType3: false,
	sentType4: false
    };
}

module.exports = {
    loadState,
    saveState,
    resetState
};
