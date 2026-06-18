const fs = require('fs');

const BEL_STATE_FILE = './state_bel.json';

/*
 * Reads state.json and returns its contents.
 */
function loadStateBel() {
    try {
        return JSON.parse(
            fs.readFileSync(BEL_STATE_FILE, 'utf8')
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
function saveStateBel(state) {
    fs.writeFileSync(
        BEL_STATE_FILE,
        JSON.stringify(state, null, 2)
    );
}

/*
 * Resets daily state.
 */
function resetStateBel(today) {
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
    loadStateBel,
    saveStateBel,
    resetStateBel
};
