function formatType1(assignments) {

    if (assignments.length === 0) {
        return null;
    }

    const lines = assignments.map(a =>
        `• ${a.title}\n  *Due: ${Math.ceil((new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} day(s)*`
    );

    return (
        '📚 Due in a week or less\n\n' +
        lines.join('\n\n')
    );
}

function formatType2(assignments) {

    if (assignments.length === 0) {
        return null;
    }

    const lines = assignments.map(a =>
        `• ${a.title}\n  *Deadline: ${new Date(a.dueDate).toLocaleTimeString()}*`
    );

    return (
        '⚠️ *ASSIGNMENTS DUE TODAY*\n\n' +
        lines.join('\n\n')
    );
}

function formatType3(assignments) {

    if (assignments.length === 0) {
        return null;
    }

    const lines = assignments.map(a =>
        `• ${a.title}\n  *Deadline: ${new Date(a.dueDate).toLocaleTimeString()}*`
    );

    return (
        '🚨 *A FEW HOURS REMAINING*\n\n' +
        lines.join('\n\n')
    );
}

function formatType4(assignments) {

    if (assignments.length === 0) {
        return null;
    }

    const lines = assignments.map(a =>
        `• ${a.title}\n  *Deadline: ${new Date(a.dueDate).toLocaleTimeString()}*`
    );

    return (
        '🚨🚨🚨 *MAKE SURE YOU SUBMITTED*\n\n' +
        lines.join('\n\n')
    );
}

module.exports = {
    formatType1,
    formatType2,
    formatType3,
    formatType4
};
