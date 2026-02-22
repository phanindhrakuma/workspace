const jwt = require('jsonwebtoken');
const { User, OwnerProfile } = require('../models');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Authentication required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
            include: [{ model: OwnerProfile, as: 'profile' }],
        });
        if (!user) return res.status(401).json({ error: 'User not found' });

        req.user = user;
        req.userId = user.id;
        req.ownerId = user.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
};

module.exports = { auth, requireRole };
