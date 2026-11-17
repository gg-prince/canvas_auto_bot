require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const CHAT_ID = "250781165054@c.us";

if (!CHAT_ID) {

    console.error('TEST_CHAT_ID is missing from .env');
    process.exit(1);

}

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


client.on('qr', (qr) => {

    console.log('\nScan this QR code with WhatsApp:\n');

    qrcode.generate(qr, {
        small: true
    });

});


client.on('authenticated', () => {

    console.log('Authenticated');

});


client.on('ready', async () => {

    console.log('\nWhatsApp is ready.');

    // Give WhatsApp Web some time to finish loading.
    await new Promise(resolve =>
        setTimeout(resolve, 15000)
    );

    console.log('\nTarget chat ID:', CHAT_ID);

    try {

        console.log('\nGetting all chats...');

        const chats = await client.getChats();

        console.log(`Found ${chats.length} chats.`);

        const matchingChat = chats.find(
            chat => chat.id._serialized === CHAT_ID
        );

        if (!matchingChat) {

            console.log('\n❌ Target chat was NOT found in getChats().');

            console.log('\nPrivate chats found:');

            for (const chat of chats) {

                if (!chat.isGroup) {

                    console.log(
                        `${chat.name || '(no name)'} -> ${chat.id._serialized}`
                    );

                }

            }

        } else {

            console.log('\n✅ Target chat was found!');

            console.log('Name:', matchingChat.name);
            console.log('ID:', matchingChat.id._serialized);
            console.log('Is group:', matchingChat.isGroup);

        }


        console.log('\nNow testing getChatById()...');

        const chat = await client.getChatById(CHAT_ID);

        console.log('\n✅ getChatById() worked!');

        console.log('Name:', chat.name);
        console.log('ID:', chat.id._serialized);
        console.log('Is group:', chat.isGroup);

    } catch (error) {

        console.error('\n❌ Test failed.');

        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        console.error('\nFull stack:');
        console.error(error.stack);

    }

    console.log('\nTest finished.');

});


client.on('auth_failure', (message) => {

    console.error('Authentication failed:', message);

});


client.on('disconnected', (reason) => {

    console.log('WhatsApp disconnected:', reason);

});


console.log('Opening WhatsApp...');

client.initialize();
