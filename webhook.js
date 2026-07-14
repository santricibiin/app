const express = require('express');
const { getTransaction, updateTransactionStatus } = require('./utils/transactionService');
const { getDeposit, updateDepositStatus } = require('./utils/depositService');
const { takeStock } = require('./utils/productService');
const { getProductById } = require('./utils/productService');
const { updateSaldo } = require('./utils/saldoService');
const font = require('./utils/font');
const stickers = require('./stickers.json');

let botInstance = null;
let qrisMessages = new Map();

const setBotInstance = (bot) => {
    botInstance = bot;
};

const setQrisMessage = (orderId, chatId, messageId) => {
    qrisMessages.set(orderId, { chatId, messageId });
};

const startWebhook = () => {
    const app = express();
    app.use(express.json());

    app.post('/webhook/pakasir', async (req, res) => {
        try {
            const { order_id, status } = req.body;
            console.log('Webhook received:', order_id, status);

            if (status !== 'completed') {
                return res.json({ success: false, message: 'Not completed' });
            }

            const qrisMsg = qrisMessages.get(order_id);
            if (qrisMsg && botInstance) {
                try { await botInstance.telegram.deleteMessage(qrisMsg.chatId, qrisMsg.messageId); } catch (e) { }
                qrisMessages.delete(order_id);
            }

            if (order_id.startsWith('DEP')) {
                const dep = await getDeposit(order_id);
                if (!dep) return res.json({ success: false, message: 'Deposit not found' });
                if (dep.status === 'completed') return res.json({ success: false, message: 'Already processed' });

                await updateDepositStatus(order_id, 'completed');
                await updateSaldo(dep.user_id, dep.amount);

                const formatPrice = (p) => p.toLocaleString('id-ID');
                let msg = `✅ 𝐃𝐄𝐏𝐎𝐒𝐈𝐓 𝐁𝐄𝐑𝐇𝐀𝐒𝐈𝐋\n\n`;
                msg += `📋 Detail\n`;
                msg += `└ Nominal: Rp ${formatPrice(dep.amount)}\n`;
                msg += `└ Order: ${order_id}`;

                if (botInstance) {
                    await botInstance.telegram.sendMessage(dep.user_id, font.convert(msg));
                    try { await botInstance.telegram.sendMessage(process.env.OWNER_ID, `✅ Deposit QRIS\nUser: ${dep.user_id} | Rp ${formatPrice(dep.amount)}`); } catch (e) { }
                }

                return res.json({ success: true, type: 'deposit' });
            }

            const trx = await getTransaction(order_id);
            if (!trx) return res.json({ success: false, message: 'Transaction not found' });
            if (trx.status === 'completed') return res.json({ success: false, message: 'Already processed' });

            await updateTransactionStatus(order_id, 'completed');

            const product = await getProductById(trx.product_id);
            const stocks = await takeStock(trx.product_id, trx.qty);

            if (!stocks) return res.json({ success: false, message: 'Stock not available' });

            const formatPrice = (p) => p.toLocaleString('id-ID');
            let msg = `✅ 𝐏𝐄𝐌𝐁𝐄𝐋𝐈𝐀𝐍 𝐁𝐄𝐑𝐇𝐀𝐒𝐈𝐋\n\n`;
            msg += `📦 Produk\n`;
            msg += `└ ${product.name}\n\n`;
            msg += `📋 Detail\n`;
            msg += `└ Qty: ${trx.qty}\n`;
            msg += `└ Total: Rp ${formatPrice(trx.amount)}\n`;
            msg += `└ Metode: QRIS`;

            const fileContent = stocks.join('\n');
            const fileName = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_${order_id}.txt`;

            if (botInstance) {
                // Animated sticker before success message
                const stickerMsg = await botInstance.telegram.sendSticker(trx.user_id, stickers.purchase);
                await new Promise(r => setTimeout(r, 1500));
                try { await botInstance.telegram.deleteMessage(trx.user_id, stickerMsg.message_id); } catch (e) { }

                await botInstance.telegram.sendMessage(trx.user_id, font.convert(msg), {
                    message_effect_id: stickers.effects.heart
                });
                await botInstance.telegram.sendDocument(trx.user_id, {
                    source: Buffer.from(fileContent),
                    filename: fileName
                }, { caption: '📦 Produk kamu' });
                if (product.snk) await botInstance.telegram.sendMessage(trx.user_id, font.convert(`📜 𝐒𝐍𝐊\n${product.snk}`));

                let notifMsg = `💵 𝐏𝐄𝐌𝐁𝐄𝐋𝐈𝐀𝐍 𝐐𝐑𝐈𝐒\n\n`;
                notifMsg += `👤 User\n`;
                notifMsg += `└ ID: ${trx.user_id}\n\n`;
                notifMsg += `📦 Produk\n`;
                notifMsg += `└ ${product.name} x${trx.qty}\n`;
                notifMsg += `└ Total: Rp ${formatPrice(trx.amount)}`;
                try { await botInstance.telegram.sendMessage(process.env.OWNER_ID, notifMsg); } catch (e) { }
            }

            res.json({ success: true, type: 'purchase' });
        } catch (e) {
            console.error('Webhook error:', e.message);
            res.json({ success: false, message: e.message });
        }
    });

    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        font.log(`WEBHOOK PORT ${PORT}`);
    });
};

module.exports = { startWebhook, setBotInstance, setQrisMessage };


