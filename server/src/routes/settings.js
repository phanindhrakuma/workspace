const express = require('express');
const { ReminderSetting, EmailTemplate, AuditLog } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// ==================== REMINDER SETTINGS ====================
router.get('/reminders', auth, async (req, res) => {
    try {
        let settings = await ReminderSetting.findOne({ where: { ownerId: req.userId } });
        if (!settings) {
            settings = await ReminderSetting.create({ ownerId: req.userId });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reminder settings' });
    }
});

router.put('/reminders', auth, async (req, res) => {
    try {
        let settings = await ReminderSetting.findOne({ where: { ownerId: req.userId } });
        if (!settings) {
            settings = await ReminderSetting.create({ ...req.body, ownerId: req.userId });
        } else {
            await settings.update(req.body);
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update reminder settings' });
    }
});

// ==================== EMAIL TEMPLATES ====================
router.get('/email-templates', auth, async (req, res) => {
    try {
        let templates = await EmailTemplate.findAll({ where: { ownerId: req.userId } });
        if (templates.length === 0) {
            // Create defaults
            const defaults = [
                { templateType: 'invoice_reminder', subject: 'Invoice Reminder - {{invoiceNumber}}', body: 'Dear {{companyName}},\n\nThis is a reminder that invoice {{invoiceNumber}} for ₹{{total}} is due on {{dueDate}}.\n\nPlease make the payment at your earliest convenience.\n\nThank you.' },
                { templateType: 'overdue_reminder', subject: 'Overdue Invoice - {{invoiceNumber}}', body: 'Dear {{companyName}},\n\nInvoice {{invoiceNumber}} for ₹{{total}} was due on {{dueDate}} and is now overdue.\n\nPlease make the payment immediately to avoid any disruption.\n\nThank you.' },
                { templateType: 'payment_confirmation', subject: 'Payment Received - {{invoiceNumber}}', body: 'Dear {{companyName}},\n\nWe have received your payment of ₹{{amount}} for invoice {{invoiceNumber}}.\n\nThank you for your prompt payment.' },
                { templateType: 'booking_confirmation', subject: 'Booking Confirmed - {{roomName}}', body: 'Dear {{companyName}},\n\nYour meeting room booking has been confirmed.\n\nRoom: {{roomName}}\nDate: {{date}}\nTime: {{startTime}} - {{endTime}}\nBooking ID: {{bookingId}}\n\nThank you.' },
                { templateType: 'booking_rejection', subject: 'Booking Rejected - {{roomName}}', body: 'Dear {{companyName}},\n\nYour meeting room booking request has been rejected.\n\nRoom: {{roomName}}\nDate: {{date}}\nReason: {{reason}}\n\nPlease contact us for alternatives.' },
            ];
            templates = await EmailTemplate.bulkCreate(defaults.map(d => ({ ...d, ownerId: req.userId })));
        }
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch email templates' });
    }
});

router.put('/email-templates/:id', auth, async (req, res) => {
    try {
        const template = await EmailTemplate.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!template) return res.status(404).json({ error: 'Template not found' });
        await template.update(req.body);
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// ==================== AUDIT LOGS ====================
router.get('/audit-logs', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50, entityType, action } = req.query;
        const where = { ownerId: req.userId };
        if (entityType) where.entityType = entityType;
        if (action) where.action = action;

        const logs = await AuditLog.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
        });
        res.json({ logs: logs.rows, total: logs.count, page: parseInt(page), totalPages: Math.ceil(logs.count / parseInt(limit)) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

module.exports = router;
