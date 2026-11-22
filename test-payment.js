const {
    addPaidDays,
    loadState
} = require('./services/state');

const userId = '250781165054';

console.log('Before:');
console.log(loadState(userId).subscription);

addPaidDays(userId, 30);

console.log('After:');
console.log(loadState(userId).subscription);
