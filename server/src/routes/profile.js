const express = require('express');
const { OwnerProfile } = require('../models');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// Get profile
router.get('/', auth, async (req, res) => {
    try {
        let profile = await OwnerProfile.findOne({ where: { userId: req.userId } });
        if (!profile) {
            profile = await OwnerProfile.create({ userId: req.userId, spaceName: 'My Coworking Space' });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update profile (onboarding + general updates)
router.put('/', auth, async (req, res) => {
    try {
        let profile = await OwnerProfile.findOne({ where: { userId: req.userId } });
        if (!profile) {
            profile = await OwnerProfile.create({ userId: req.userId, ...req.body });
        } else {
            await profile.update(req.body);
        }
        res.json(profile);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Upload logo
router.post('/logo', auth, (req, res, next) => { req.uploadDir = 'logos'; next(); }, upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const profile = await OwnerProfile.findOne({ where: { userId: req.userId } });
        await profile.update({ logoUrl: `/uploads/logos/${req.file.filename}` });
        res.json({ logoUrl: profile.logoUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload logo' });
    }
});

module.exports = router;
