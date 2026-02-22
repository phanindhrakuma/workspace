const express = require('express');
const { Invoice, Company, Payment, OwnerProfile } = require('../models');
const { auth } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const { Op } = require('sequelize');
const router = express.Router();

// Helper: generate invoice number
async function generateInvoiceNumber(ownerId) {
    const profile = await OwnerProfile.findOne({ where: { userId: ownerId } });
    const prefix = profile?.invoicePrefix || 'INV';
    const count = await Invoice.count({ where: { ownerId } });
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
}

// List invoices
router.get('/', auth, async (req, res) => {
    try {
        const { status, companyId, startDate, endDate } = req.query;
        const where = { ownerId: req.userId };
        if (status) where.status = status;
        if (companyId) where.companyId = companyId;
        if (startDate && endDate) where.dueDate = { [Op.between]: [startDate, endDate] };

        const invoices = await Invoice.findAll({
            where,
            include: [
                { model: Company, as: 'company', attributes: ['id', 'name', 'gstNumber'] },
                { model: Payment, as: 'payments' },
            ],
            order: [['created_at', 'DESC']],
        });
        res.json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            where: { id: req.params.id, ownerId: req.userId },
            include: [
                { model: Company, as: 'company' },
                { model: Payment, as: 'payments' },
            ],
        });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// Generate invoice for company
router.post('/generate', auth, auditLog('create', 'invoice'), async (req, res) => {
    try {
        const { companyId, type, lineItems, customAmount, notes, dueDate, billingPeriodStart, billingPeriodEnd } = req.body;
        const company = await Company.findOne({ where: { id: companyId, ownerId: req.userId } });
        if (!company) return res.status(404).json({ error: 'Company not found' });

        let items = lineItems || [];
        let subtotal = 0;

        if (type === 'recurring' || type === 'prorata') {
            const seatCost = parseFloat(company.seatCost) || 0;
            const numSeats = company.seats || 1;
            let amount = seatCost * numSeats;

            if (type === 'prorata' && billingPeriodStart && billingPeriodEnd) {
                const start = new Date(billingPeriodStart);
                const end = new Date(billingPeriodEnd);
                const totalDaysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
                const remainingDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                amount = (remainingDays / totalDaysInMonth) * amount;
            }

            items.push({
                description: type === 'prorata' ? 'Pro-rata Seat Charges' : 'Monthly Seat Charges',
                quantity: numSeats,
                rate: seatCost,
                amount: Math.round(amount * 100) / 100,
            });
            subtotal = amount;
        } else if (type === 'custom') {
            subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        }

        if (customAmount) subtotal = parseFloat(customAmount);

        const gstPercent = company.gstApplicable ? parseFloat(company.gstPercent) || 18 : 0;
        const gstAmount = Math.round((subtotal * gstPercent / 100) * 100) / 100;
        const total = Math.round((subtotal + gstAmount) * 100) / 100;

        const invoiceNumber = await generateInvoiceNumber(req.userId);

        const invoice = await Invoice.create({
            companyId: company.id,
            ownerId: req.userId,
            invoiceNumber,
            type: type || 'recurring',
            subtotal: Math.round(subtotal * 100) / 100,
            gstAmount,
            total,
            gstPercent,
            lineItems: items,
            status: 'draft',
            dueDate: dueDate || null,
            notes,
            billingPeriodStart,
            billingPeriodEnd,
        });

        res.status(201).json(invoice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
});

// Update invoice
router.put('/:id', auth, auditLog('update', 'invoice'), async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        await invoice.update(req.body);
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});

// Record payment
router.post('/:id/payment', auth, auditLog('payment', 'invoice'), async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const { amount, paymentDate, mode, transactionId, notes } = req.body;
        const payment = await Payment.create({
            invoiceId: invoice.id,
            amount: parseFloat(amount),
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            mode,
            transactionId,
            notes,
        });

        const totalPaid = parseFloat(invoice.paidAmount || 0) + parseFloat(amount);
        const newStatus = totalPaid >= parseFloat(invoice.total) ? 'paid' : 'partial';
        await invoice.update({
            paidAmount: totalPaid,
            status: newStatus,
            paidDate: newStatus === 'paid' ? paymentDate : null,
            paymentMode: mode,
            transactionId,
        });

        res.status(201).json({ payment, invoice: await invoice.reload() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});

// Delete invoice
router.delete('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        await invoice.update({ status: 'cancelled' });
        res.json({ message: 'Invoice cancelled' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel invoice' });
    }
});

module.exports = router;
