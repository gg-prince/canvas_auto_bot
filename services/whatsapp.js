const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;

/*
 * Start WhatsApp.
 */

console.log('Opening WhatsApp...');

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

        client.on('ready', async () => {

	    await new Promise(resolve => setTimeout(resolve, 10000));
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

  try{

    const chats = await client.getChats();

    const group = chats.find(
        chat =>
            chat.isGroup &&
            chat.name === groupName
    );

    if (!group) {

        throw new Error(`Group "${groupName}" not found`);

    }

    await group.sendMessage(message);

  } catch(err){

     console.error(err);

  }

}


// Send message to premiums

async function sendPrivateMessage(chatId, message) {

    try {

        const chat = await client.getChatById(chatId);

        if (!chat) {

            throw new Error(`Private chat "${chatId}" not found`);

        }

        await chat.sendMessage(message);

    } catch (err) {

        console.error(err);

    }

}

// Group check

async function groupExists(groupName) {

    const chats = await client.getChats();

    return chats.some(
        chat => chat.isGroup && chat.name === groupName
    );

}

module.exports = {
    initializeWhatsapp,
    sendMessage,
    sendPrivateMessage,
    groupExists
};
