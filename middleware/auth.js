const jwt = require('jsonwebtoken')

function auth(req, res, next) {
    // const token = req.header('token')
    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
        res.status(401).json({ message: 'No token, authorization denied' })

    try {
        const decoded = jwt.verify(token, '4306435a1')
        req.user = decoded
        next()
    } catch (error) {
        res.status(400).json({ message: 'Token is not valid' })
    }
}

module.exports = auth;
