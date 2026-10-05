const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
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

client.on('qr', qr => {
    console.log('Scan QR');
});

client.on('authenticated', () => {
    console.log('Authenticated');
});

client.on('ready', async () => {
    console.log('Ready');

    try {
        const chats = await client.getState();
        console.log(`Chats: ${chats.length}`);

        const chat = await client.getChatById("250781165054@c.us");

        if (chat) {

            console.log(`Private chat "${chatId}" found`);

        }

    } catch (err) {
        console.error(err);
    }

    process.exit(0);
});

client.initialize();

