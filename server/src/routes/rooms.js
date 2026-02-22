const express = require('express');
const { MeetingRoom, RoomBooking, Company, CompanyRoomAllowance } = require('../models');
const { auth } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { Op } = require('sequelize');
const router = express.Router();

// ==================== MEETING ROOMS ====================

// List rooms
router.get('/', auth, async (req, res) => {
    try {
        const rooms = await MeetingRoom.findAll({ where: { ownerId: req.userId }, order: [['name', 'ASC']] });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// Create room
router.post('/', auth, auditLog('create', 'meeting_room'), async (req, res) => {
    try {
        const room = await MeetingRoom.create({ ...req.body, ownerId: req.userId });
        res.status(201).json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Update room
router.put('/:id', auth, async (req, res) => {
    try {
        const room = await MeetingRoom.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        await room.update(req.body);
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update room' });
    }
});

// Delete room
router.delete('/:id', auth, async (req, res) => {
    try {
        const room = await MeetingRoom.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        await room.update({ status: 'inactive' });
        res.json({ message: 'Room deactivated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

// ==================== BOOKINGS ====================

// List bookings (with optional date/room filters)
router.get('/bookings', auth, async (req, res) => {
    try {
        const { date, roomId, companyId, status, startDate, endDate } = req.query;
        const where = { ownerId: req.userId };
        if (date) where.bookingDate = date;
        if (roomId) where.roomId = roomId;
        if (companyId) where.companyId = companyId;
        if (status) where.status = status;
        if (startDate && endDate) where.bookingDate = { [Op.between]: [startDate, endDate] };

        const bookings = await RoomBooking.findAll({
            where,
            include: [
                { model: MeetingRoom, as: 'room', attributes: ['id', 'name', 'code', 'capacity'] },
                { model: Company, as: 'company', attributes: ['id', 'name'] },
            ],
            order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
        });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Create booking
router.post('/bookings', auth, auditLog('create', 'booking'), async (req, res) => {
    try {
        const { roomId, companyId, bookingDate, startTime, endTime, attendees, purpose, specialRequirements, notes, isRecurring } = req.body;

        // Check room exists
        const room = await MeetingRoom.findOne({ where: { id: roomId, ownerId: req.userId, status: 'active' } });
        if (!room) return res.status(404).json({ error: 'Room not found or inactive' });

        // Check conflict (overlapping bookings)
        const conflict = await RoomBooking.findOne({
            where: {
                roomId,
                bookingDate,
                status: { [Op.in]: ['pending', 'approved'] },
                [Op.or]: [
                    { startTime: { [Op.lt]: endTime }, endTime: { [Op.gt]: startTime } },
                ],
            },
        });
        if (conflict) return res.status(409).json({ error: 'Time slot conflicts with an existing booking' });

        // Calculate cost
        const startParts = startTime.split(':').map(Number);
        const endParts = endTime.split(':').map(Number);
        const hours = (endParts[0] + endParts[1] / 60) - (startParts[0] + startParts[1] / 60);
        const cost = Math.round(hours * parseFloat(room.hourlyCost) * 100) / 100;
        const gstAmount = room.gstApplicable ? Math.round(cost * parseFloat(room.gstPercent) / 100 * 100) / 100 : 0;
        const totalCost = cost + gstAmount;

        const booking = await RoomBooking.create({
            roomId, companyId, ownerId: req.userId, bookingDate, startTime, endTime,
            attendees, purpose, specialRequirements, notes, isRecurring,
            cost, gstAmount, totalCost, status: 'pending',
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Update booking status (approve/reject/cancel/complete)
router.put('/bookings/:id/status', auth, auditLog('update_status', 'booking'), async (req, res) => {
    try {
        const booking = await RoomBooking.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        const { status, rejectionReason, actualEndTime } = req.body;
        const updateData = { status };
        if (rejectionReason) updateData.rejectionReason = rejectionReason;
        if (actualEndTime) updateData.actualEndTime = actualEndTime;

        await booking.update(updateData);
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// Get available slots for a room on a date
router.get('/rooms/:roomId/availability', auth, async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'Date is required' });

        const bookings = await RoomBooking.findAll({
            where: {
                roomId: req.params.roomId,
                bookingDate: date,
                status: { [Op.in]: ['pending', 'approved'] },
            },
            order: [['start_time', 'ASC']],
        });

        res.json({ date, bookedSlots: bookings.map(b => ({ start: b.startTime, end: b.endTime, status: b.status })) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

// Room allowances
router.get('/allowances', auth, async (req, res) => {
    try {
        const allowances = await CompanyRoomAllowance.findAll({
            where: { ownerId: req.userId },
            include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
        });
        res.json(allowances);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch allowances' });
    }
});

router.post('/allowances', auth, async (req, res) => {
    try {
        const allowance = await CompanyRoomAllowance.create({ ...req.body, ownerId: req.userId });
        res.status(201).json(allowance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create allowance' });
    }
});

module.exports = router;
