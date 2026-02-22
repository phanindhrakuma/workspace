const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, OwnerProfile } = require('../models');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ email, passwordHash, name, role: 'owner', emailVerified: true });

        // Create blank owner profile
        await OwnerProfile.create({ userId: user.id, spaceName: name || 'My Coworking Space' });

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const user = await User.findOne({ where: { email }, include: [{ model: OwnerProfile, as: 'profile' }] });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        res.json({
            token,
            user: {
                id: user.id, email: user.email, name: user.name, role: user.role,
                setupCompleted: user.profile?.setupCompleted || false,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Google OAuth (stub - architecture ready)
router.post('/google', async (req, res) => {
    try {
        const { googleToken, email, name, avatar, googleId } = req.body;
        let user = await User.findOne({ where: { email } });

        if (!user) {
            user = await User.create({ email, name, avatar, googleId, role: 'owner', emailVerified: true });
            await OwnerProfile.create({ userId: user.id, spaceName: name ? `${name}'s Space` : 'My Coworking Space' });
        } else if (!user.googleId) {
            await user.update({ googleId, avatar: avatar || user.avatar });
        }

        const profile = await OwnerProfile.findOne({ where: { userId: user.id } });
        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role, setupCompleted: profile?.setupCompleted || false },
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    const user = req.user;
    res.json({
        id: user.id, email: user.email, name: user.name, role: user.role,
        avatar: user.avatar, setupCompleted: user.profile?.setupCompleted || false,
        profile: user.profile,
    });
});

// Forgot password (stub)
router.post('/forgot-password', async (req, res) => {
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

module.exports = router;
