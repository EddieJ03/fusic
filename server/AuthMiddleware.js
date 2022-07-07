const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    const { cookie } = req.headers

    if (!cookie) {
        // Status code 401 means unauthorized
        return res.status(401).json({verified: false})
    } else {
        let cookies = cookie.split("; ")
        let token = cookies[0].replace("AuthToken=", "")
        let userId = cookies[1].substring(7);

        jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
            if (err || payload.user_id !== userId) {
                return res.status(401).json({verified: false})
            } else {
                next();
            }
        })
    }
}