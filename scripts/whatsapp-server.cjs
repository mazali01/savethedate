/**
 * Minimal WhatsApp Server
 * Run once: node scripts/whatsapp-server.js
 * Keep it running in background
 */

const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n📱 Scan QR code:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ WhatsApp ready'));
client.on('authenticated', () => console.log('✅ Authenticated'));

client.initialize();

const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('972')) return `${cleaned}@c.us`;
    if (cleaned.startsWith('0')) return `972${cleaned.substring(1)}@c.us`;
    return `972${cleaned}@c.us`;
};

// Send messages endpoint
app.post('/send', async (req, res) => {
    try {
        const { users } = req.body;
        const results = { success: [], failed: [] };

        for (const user of users) {
            try {
                const chatId = formatPhone(user.phoneNumber);
                const message = `היי ${user.name} 👋

זיכרון ידידותי שעדיין לא קיבלנו אישור הגעה ממך לחתונה שלנו! 💍

נשמח מאוד אם תוכל/י לאשר את הגעתך בקישור הבא:
https://your-site.com/${user.id}

מחכים לך! ❤️
מזל וערן`;

                const numberId = await client.getNumberId(chatId.replace('@c.us', ''));
                if (!numberId) {
                    results.failed.push({ ...user, error: 'Not on WhatsApp' });
                    continue;
                }

                await client.sendMessage(numberId._serialized, message);
                results.success.push(user);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                results.failed.push({ ...user, error: error.message });
            }
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({ ready: client.info !== null });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 WhatsApp server running on http://localhost:${PORT}`);
    console.log('Keep this running in the background\n');
});
