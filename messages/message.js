function formatDeadlineTime(dueDate) {

    const due = new Date(dueDate);

    // Canvas sometimes returns end-of-day deadlines as 00:00 local time.
    if (due.getHours() === 0 && due.getMinutes() === 0) {
        due.setHours(23, 59, 0, 0);
    }

    return due.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

}

function buildDeadlineList(assignments) {

    return assignments.map(a =>
        `• ${a.title}\n  *⏰${formatDeadlineTime(a.dueDate)}⏰*`
    );

}

function formatType1(assignments) {

    if (assignments.length === 0) {
        return null;
    }

    const lines = assignments.map(a => {

	let day = Math.round((new Date(a.dueDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
	
	let s = day > 1 ? "s" : "";

    return `• ${a.title}\n  *Due: ${day} day${s}*`;
});

    return (
        '📚 *DUE IN A WEEK*\n\n' +
        lines.join('\n\n')
    );

}

function formatType2(assignments) {

    if (assignments.length === 0) {
        return null;
    }

    let s = assignments.length > 1 ? "S" : "";

    return (
        `⚠️ *(${assignments.length}) ASSIGNMENT${s} DUE TODAY*\n\n` +
        buildDeadlineList(assignments).join('\n\n')
    );

}

function formatType3(assignments) {

    if (assignments.length === 0) {
        return null;
    }

    return (
        '🚨 *A FEW HOURS REMAINING*\n\n' +
        buildDeadlineList(assignments).join('\n\n')
    );

}

function formatType4(assignments) {

    if (assignments.length === 0) {
        return null;
    }

    return (
        '🚨🚨 *MAKE SURE YOU SUBMITTED*\n\n' +
        buildDeadlineList(assignments).join('\n\n')
    );

}

module.exports = {
    formatType1,
    formatType2,
    formatType3,
    formatType4,
    formatDeadlineTime,
    buildDeadlineList
};
