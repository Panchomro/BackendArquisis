const axios = require('axios');

exports.initiatePayment = async (req, res) => {
    const { amount, sessionId, buyOrder, returnUrl, finalUrl } = req.body;
    try {
        const response = await axios.post('https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.0/transactions', {
            buy_order: buyOrder,
            session_id: sessionId,
            amount,
            return_url: returnUrl
        }, {
            headers: {
                'Tbk-Api-Key-Id': process.env.WEBPAY_API_KEY,
                'Tbk-Api-Key-Secret': process.env.WEBPAY_API_SECRET,
                'Content-Type': 'application/json'
            }
        });

        res.json({
            token: response.data.token,
            url: response.data.url
        });
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(500).json({ error: 'Error initiating payment' });
    }
};

exports.handleReturn = async (req, res) => {
    const { token } = req.body;
    try {
        const response = await axios.put(`https://webpay3g.transbank.cl/rswebpaytransaction/api/webpay/v1.0/transactions/${token}`, {}, {
            headers: {
                'Tbk-Api-Key-Id': process.env.WEBPAY_API_KEY,
                'Tbk-Api-Key-Secret': process.env.WEBPAY_API_SECRET,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status === 'AUTHORIZED') {
            res.json({ success: true, details: response.data });
        } else {
            res.json({ success: false, details: response.data });
        }
    } catch (error) {
        console.error('Error handling return:', error);
        res.status(500).json({ error: 'Error handling return' });
    }
};

exports.handleFinal = (req, res) => {
    // Manejo de la página final después del pago
    res.send('Payment completed');
};
