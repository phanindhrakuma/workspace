const express = require('express');
const { Invoice, Company, RoomBooking, Seat, Payment, sequelize } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// Dashboard stats
router.get('/dashboard', auth, async (req, res) => {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [totalCompanies, totalSeats, occupiedSeats, availableSeats] = await Promise.all([
            Company.count({ where: { ownerId: req.userId, status: 'active' } }),
            Seat.count({ where: { ownerId: req.userId } }),
            Seat.count({ where: { ownerId: req.userId, status: 'occupied' } }),
            Seat.count({ where: { ownerId: req.userId, status: 'available' } }),
        ]);

        const monthlyInvoices = await Invoice.findAll({
            where: { ownerId: req.userId, createdAt: { [Op.between]: [monthStart, monthEnd] } },
        });
        const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
        const monthlyGst = monthlyInvoices.reduce((sum, inv) => sum + parseFloat(inv.gstAmount || 0), 0);

        const pendingPayments = await Invoice.count({
            where: { ownerId: req.userId, status: { [Op.in]: ['draft', 'sent', 'partial'] } },
        });

        const overdueInvoices = await Invoice.count({
            where: { ownerId: req.userId, status: { [Op.in]: ['sent', 'partial'] }, dueDate: { [Op.lt]: now } },
        });

        const upcomingBilling = await Company.count({
            where: {
                ownerId: req.userId,
                status: 'active',
                billingDate: { [Op.between]: [now.getDate(), now.getDate() + 7] },
            },
        });

        // Monthly revenue chart (last 6 months)
        const revenueChart = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const invs = await Invoice.findAll({
                where: { ownerId: req.userId, status: 'paid', paidDate: { [Op.between]: [start, end] } },
            });
            const revenue = invs.reduce((s, inv) => s + parseFloat(inv.total || 0), 0);
            revenueChart.push({
                month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
                revenue: Math.round(revenue),
            });
        }

        res.json({
            totalCompanies,
            totalSeats,
            occupiedSeats,
            availableSeats,
            monthlyRevenue: Math.round(monthlyRevenue),
            monthlyGst: Math.round(monthlyGst),
            pendingPayments,
            overdueInvoices,
            upcomingBilling,
            revenueChart,
            occupancyRate: totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Revenue report
router.get('/revenue', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = { ownerId: req.userId, status: 'paid' };
        if (startDate && endDate) where.paidDate = { [Op.between]: [startDate, endDate] };

        const invoices = await Invoice.findAll({
            where,
            include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
            order: [['paid_date', 'DESC']],
        });
        const total = invoices.reduce((s, inv) => s + parseFloat(inv.total || 0), 0);
        const totalGst = invoices.reduce((s, inv) => s + parseFloat(inv.gstAmount || 0), 0);
        res.json({ invoices, total: Math.round(total * 100) / 100, totalGst: Math.round(totalGst * 100) / 100 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch revenue report' });
    }
});

// Overdue report
router.get('/overdue', auth, async (req, res) => {
    try {
        const invoices = await Invoice.findAll({
            where: { ownerId: req.userId, status: { [Op.in]: ['sent', 'partial'] }, dueDate: { [Op.lt]: new Date() } },
            include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'email', 'phone'] }],
            order: [['due_date', 'ASC']],
        });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch overdue report' });
    }
});

// GST report
router.get('/gst', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = { ownerId: req.userId, gstAmount: { [Op.gt]: 0 } };
        if (startDate && endDate) where.createdAt = { [Op.between]: [startDate, endDate] };

        const invoices = await Invoice.findAll({
            where,
            include: [{ model: Company, as: 'company', attributes: ['id', 'name', 'gstNumber'] }],
            order: [['created_at', 'DESC']],
        });
        const totalGst = invoices.reduce((s, inv) => s + parseFloat(inv.gstAmount || 0), 0);
        res.json({ invoices, totalGst: Math.round(totalGst * 100) / 100 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch GST report' });
    }
});

// Room utilization report
router.get('/room-utilization', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = { ownerId: req.userId, status: 'completed' };
        if (startDate && endDate) where.bookingDate = { [Op.between]: [startDate, endDate] };

        const bookings = await RoomBooking.findAll({
            where,
            include: [
                { model: require('../models').MeetingRoom, as: 'room', attributes: ['id', 'name'] },
                { model: Company, as: 'company', attributes: ['id', 'name'] },
            ],
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch room utilization report' });
    }
});

module.exports = router;
