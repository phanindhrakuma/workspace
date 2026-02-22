const express = require('express');
const { Seat, Company } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// List all seats
router.get('/', auth, async (req, res) => {
    try {
        const seats = await Seat.findAll({
            where: { ownerId: req.userId },
            include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
            order: [['label', 'ASC']],
        });
        res.json(seats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch seats' });
    }
});

// Get seat stats
router.get('/stats', auth, async (req, res) => {
    try {
        const total = await Seat.count({ where: { ownerId: req.userId } });
        const occupied = await Seat.count({ where: { ownerId: req.userId, status: 'occupied' } });
        const available = await Seat.count({ where: { ownerId: req.userId, status: 'available' } });
        const maintenance = await Seat.count({ where: { ownerId: req.userId, status: 'maintenance' } });
        res.json({ total, occupied, available, maintenance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Create seat(s)
router.post('/', auth, async (req, res) => {
    try {
        const { count, type, floor, labelPrefix } = req.body;
        const numSeats = count || 1;
        const existing = await Seat.count({ where: { ownerId: req.userId } });

        const seats = [];
        for (let i = 0; i < numSeats; i++) {
            seats.push({
                ownerId: req.userId,
                label: `${labelPrefix || 'S'}${existing + i + 1}`,
                type: type || 'dedicated',
                floor: floor || 'Ground',
                status: 'available',
            });
        }
        const created = await Seat.bulkCreate(seats);
        res.status(201).json(created);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create seats' });
    }
});

// Assign seat to company
router.put('/:id/assign', auth, async (req, res) => {
    try {
        const seat = await Seat.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!seat) return res.status(404).json({ error: 'Seat not found' });
        await seat.update({ companyId: req.body.companyId, status: 'occupied' });
        res.json(seat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign seat' });
    }
});

// Unassign seat
router.put('/:id/unassign', auth, async (req, res) => {
    try {
        const seat = await Seat.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!seat) return res.status(404).json({ error: 'Seat not found' });
        await seat.update({ companyId: null, status: 'available' });
        res.json(seat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to unassign seat' });
    }
});

// Update seat
router.put('/:id', auth, async (req, res) => {
    try {
        const seat = await Seat.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!seat) return res.status(404).json({ error: 'Seat not found' });
        await seat.update(req.body);
        res.json(seat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update seat' });
    }
});

// Delete seat
router.delete('/:id', auth, async (req, res) => {
    try {
        const seat = await Seat.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!seat) return res.status(404).json({ error: 'Seat not found' });
        await seat.destroy();
        res.json({ message: 'Seat deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete seat' });
    }
});

module.exports = router;
