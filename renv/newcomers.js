const fs = require('fs/promises');
const path = require('path');

const INPUT_FILE_NAME = 'input.txt'; 
const ENV_FILE_NAME = '../.env';

function parseMultipleData() {
  try {const path = require('path');
    const currentDir = process.cwd();
    const inputPath = path.join(currentDir, INPUT_FILE_NAME);
    const envPath = path.join(currentDir, ENV_FILE_NAME);

    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Input file "${INPUT_FILE_NAME}" not found.`);
      return;
    }
    const fileContent = fs.readFileSync(inputPath, 'utf8');
    filecontent.trim();

    // 1. Find ALL phone numbers and ALL .ics links using global /g flag
    const phoneRegex = /\+(\d+)/g;
    const icsRegex = /https:[^\s"']+\.ics/g;

    // Use matchAll to easily extract the capture groups (the digits without the '+')
    const phoneMatches = [...fileContent.matchAll(phoneRegex)];
    const icsMatches = fileContent.match(icsRegex) || [];

    if (phoneMatches.length === 0 || icsMatches.length === 0) {
      console.error("Error: No matching phone numbers or .ics links found.");
      return;
    }

    // 2. Determine how many pairs we can safely create
    const totalPairs = Math.min(phoneMatches.length, icsMatches.length);
    console.log(`Found ${phoneMatches.length} numbers and ${icsMatches.length} links. Processing ${totalPairs} pairs...`);

    let envContentToAppend = '';

    // 3. Loop through and format each pair
    for (let i = 0; i < totalPairs; i++) {
      const rawNumber = phoneMatches[i][1]; // Gets just the digits (e.g. 123456789)
      const jidNumber = `${rawNumber}@c.us`;
      const icsLink = icsMatches[i];

      // Build the block of text for this specific pair
      envContentToAppend += `\nCANVAS_FEED_${rawNumber}=${icsLink}\nCONTACT_INFO_${rawNumber}=${jidNumber}\n`;
    }

    // 4. Append all pairs to the .env file at once
    fs.appendFileSync(envPath, envContentToAppend, 'utf8');
    console.log(`Successfully appended ${totalPairs} pairs to your .env file!`);

    // Alert the user if there was an uneven count
    if (phoneMatches.length !== icsMatches.length) {
      console.warn(`⚠️ Warning: Mismatch detected. Unpaired items were ignored.`);
    }

  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

parseMultipleData();
