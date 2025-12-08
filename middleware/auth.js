const MANAGER_PIN = process.env.MANAGER_PIN || '1234'; // Default PIN is 1234

const authenticateManager = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Expecting format: "Bearer <PIN>"
    const token = authHeader.split(' ')[1];

    if (token !== MANAGER_PIN) {
        return res.status(403).json({ error: 'Forbidden: Invalid PIN' });
    }

    next();
};

module.exports = { authenticateManager };
