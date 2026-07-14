const express = require('express');
const router = express.Router();
const path = require('path');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

router.get('/login', (req, res) => {
    if (req.session && req.session.loggedIn) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.loggedIn = true;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Password salah!' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
