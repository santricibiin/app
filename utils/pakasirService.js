const { getSettings } = require('./settingsService');

const createQrisPayment = async (orderId, amount) => {
    const settings = await getSettings();
    const slug = settings.pakasir_slug || 'fastx';
    const apikey = settings.pakasir_apikey;

    if (!apikey) {
        throw new Error('API Key tidak diset');
    }

    const body = {
        project: slug,
        order_id: orderId,
        amount: amount,
        api_key: apikey
    };



    const response = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await response.json();


    if (!data.payment) {
        throw new Error(data.message || 'Gagal membuat pembayaran');
    }

    return data.payment;
};

const generateOrderId = () => {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${y}${m}${d}${rand}`;
};

module.exports = { createQrisPayment, generateOrderId };

