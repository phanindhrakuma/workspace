const { AuditLog } = require('../models');

const auditLog = (action, entityType) => async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
        try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                await AuditLog.create({
                    ownerId: req.ownerId || null,
                    userId: req.userId || null,
                    action,
                    entityType,
                    entityId: req.params.id || data?.id || null,
                    details: { method: req.method, path: req.path, body: req.method !== 'GET' ? req.body : undefined },
                    ipAddress: req.ip,
                });
            }
        } catch (e) { console.error('Audit log error:', e.message); }
        return originalJson(data);
    };
    next();
};

module.exports = { auditLog };
