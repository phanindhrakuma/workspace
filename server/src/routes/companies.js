const express = require('express');
const { Company, CompanyDocument, Seat, Invoice, RoomBooking } = require('../models');
const { auth } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');
const upload = require('../middleware/upload');
const { Op } = require('sequelize');
const router = express.Router();

// List companies
router.get('/', auth, async (req, res) => {
    try {
        const { search, status, sort, order } = req.query;
        const where = { ownerId: req.userId };
        if (status) where.status = status;
        if (search) where.name = { [Op.iLike]: `%${search}%` };

        const companies = await Company.findAll({
            where,
            include: [{ model: CompanyDocument, as: 'documents' }],
            order: [[sort || 'created_at', order || 'DESC']],
        });
        res.json(companies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Get single company
router.get('/:id', auth, async (req, res) => {
    try {
        const company = await Company.findOne({
            where: { id: req.params.id, ownerId: req.userId },
            include: [{ model: CompanyDocument, as: 'documents' }],
        });
        if (!company) return res.status(404).json({ error: 'Company not found' });
        res.json(company);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch company' });
    }
});

// Create company
router.post('/', auth, auditLog('create', 'company'), async (req, res) => {
    try {
        const company = await Company.create({ ...req.body, ownerId: req.userId });
        res.status(201).json(company);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});

// Update company
router.put('/:id', auth, auditLog('update', 'company'), async (req, res) => {
    try {
        const company = await Company.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!company) return res.status(404).json({ error: 'Company not found' });
        await company.update(req.body);
        res.json(company);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update company' });
    }
});

// Delete company
router.delete('/:id', auth, auditLog('delete', 'company'), async (req, res) => {
    try {
        const company = await Company.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!company) return res.status(404).json({ error: 'Company not found' });
        await company.update({ status: 'terminated' });
        // Unassign seats
        await Seat.update({ companyId: null, status: 'available' }, { where: { companyId: company.id } });
        res.json({ message: 'Company terminated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete company' });
    }
});

// Upload document
router.post('/:id/documents', auth, (req, res, next) => { req.uploadDir = 'documents'; next(); }, upload.single('document'), async (req, res) => {
    try {
        const company = await Company.findOne({ where: { id: req.params.id, ownerId: req.userId } });
        if (!company) return res.status(404).json({ error: 'Company not found' });
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const doc = await CompanyDocument.create({
            companyId: company.id,
            docType: req.body.docType || 'other',
            filePath: `/uploads/documents/${req.file.filename}`,
            originalName: req.file.originalname,
            fileSize: req.file.size,
        });
        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// Delete document
router.delete('/:companyId/documents/:docId', auth, async (req, res) => {
    try {
        const doc = await CompanyDocument.findOne({ where: { id: req.params.docId, companyId: req.params.companyId } });
        if (!doc) return res.status(404).json({ error: 'Document not found' });
        await doc.destroy();
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

module.exports = router;
