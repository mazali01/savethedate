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

// Send messages endpoint with progress updates
app.post('/send', async (req, res) => {
    const { users } = req.body;

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const results = { success: [], failed: [] };
    const total = users.length;

    try {
        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            try {
                const chatId = formatPhone(user.phoneNumber);
                const message = `היי ${user.name} 👋

מזכירים לך שהחתונה שלנו מתקרבת! 💍✨
📅 תאריך: 16.10

נשמח מאוד אם תוכל/י לאשר את הגעתך דרך הקישור:
https://fistuk.vercel.app/${user.id}

⚠️ חשוב: כדי שהקישור יהיה לחיץ, פשוט הגב/י לכאן עם כל תשובה (למשל: "קיבלתי" 😊)

באתר מחכות לך עוד הפתעות שווות שהכנו במיוחד:
🚗 ארגון טרמפים משותפים
📸 גלריית תמונות חיה
💌 ברכות ואיחולים
🎵 בחירת שירים לרחבת הריקודים
🎁 מתנות דיגיטליות
💫 פינת היכרויות לרווקים/ות 😉
...ועוד כמה הפתעות! 🎉

מחכים לך בשמחה! ❤️
מזל וערן`;

                const numberId = await client.getNumberId(chatId.replace('@c.us', ''));
                if (!numberId) {
                    results.failed.push({ ...user, error: 'Not on WhatsApp' });
                    // Send progress update
                    res.write(`data: ${JSON.stringify({
                        type: 'progress',
                        current: i + 1,
                        total,
                        status: 'failed',
                        user: user.name,
                        error: 'Not on WhatsApp'
                    })}\n\n`);
                    continue;
                }

                await client.sendMessage(numberId._serialized, message);
                results.success.push(user);

                // Send progress update
                res.write(`data: ${JSON.stringify({
                    type: 'progress',
                    current: i + 1,
                    total,
                    status: 'success',
                    user: user.name
                })}\n\n`);

                // Random delay between 3-8 seconds to avoid spam detection
                const randomDelay = Math.floor(Math.random() * 5000) + 3000;
                await new Promise(resolve => setTimeout(resolve, randomDelay));

            } catch (error) {
                results.failed.push({ ...user, error: error.message });

                // Send progress update
                res.write(`data: ${JSON.stringify({
                    type: 'progress',
                    current: i + 1,
                    total,
                    status: 'failed',
                    user: user.name,
                    error: error.message
                })}\n\n`);
            }
        }

        // Send final results
        res.write(`data: ${JSON.stringify({
            type: 'complete',
            results
        })}\n\n`);

        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
        })}\n\n`);
        res.end();
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
