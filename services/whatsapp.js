const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;

/*
 * Start WhatsApp.
 */

console.log('Initializing WhatsApp...');

async function initializeWhatsapp() {

    client = new Client({
        authStrategy: new LocalAuth(),
	puppeteer: {
    	   executablePath: '/usr/bin/chromium',
           headless: false,
           args: [
           '--no-sandbox',
           '--disable-setuid-sandbox'
    	   ]
	}
    });

    return new Promise((resolve, reject) => {

        client.on('qr', (qr) => {

            console.log(
                'Scan this QR code with WhatsApp:'
            );

            qrcode.generate(qr, {
                small: true
            });

        });

        client.on('authenticated', () => {
            console.log('Authenticated');
        });

        client.on('ready', () => {
            console.log('WhatsApp ready and analyzing...');
            resolve();
        });

        client.on('auth_failure', (msg) => {
            console.log('Auth failure:', msg);
            reject(new Error(msg));
        });

        client.on('disconnected', (reason) => {
            console.log('Disconnected:', reason);
        });

        client.initialize();

    });
}

/*
 * Send message to target group.
 */
async function sendMessage(groupName, message) {

    const chats = await client.getChats();

    const group = chats.find(
        chat =>
            chat.isGroup &&
            chat.name === groupName
    );

    if (!group) {
        throw new Error(
            `Group "${groupName}" not found`
        );
    }

    await group.sendMessage(message);
}

module.exports = {
    initializeWhatsapp,
    sendMessage
};
