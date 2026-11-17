const fs = require('fs/promises');
const path = require('path');
const ical = require('node-ical');

async function refreshBackups(majors) {

    console.log('\nRefreshing Canvas backups...');

    for (const major of majors) {

        const backup = path.join(__dirname, major.backupfile);
        const temp = `${backup}.tmp`;

        try {

            const response = await fetch(major.feed);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.text();

            ical.parseICS(data);

            await fs.writeFile(temp, data);
            await fs.rename(temp, backup);

            console.log(`\t✓ ${major.name}`);

        } catch (error) {

            console.error(`\t✗ ${major.name}: ${error.message}`);

            try {
                await fs.unlink(temp);
            } catch {}

        }
    }

    console.log('Backup refresh complete.\n');
}

module.exports = { refreshBackups };
