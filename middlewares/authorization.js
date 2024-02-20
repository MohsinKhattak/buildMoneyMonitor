const jwt = require("jsonwebtoken")
const User = require("../models/User")
const asyncHandler = require("express-async-handler")

const authorize = asyncHandler(async (req, res, next) => {
    console.log("headers==", req.headers)
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const tokenSent = req.headers.authorization.split(" ")[1]
            console.log(tokenSent)
            const userDecoded = jwt.verify(tokenSent, process.env.SECRET_KEY)
            console.log(userDecoded)
            const user = await User.findOne({ _id: userDecoded.id });
            console.log(user)
            if (user) {
                req.user = user;
                next();
            }
            else {
                res.status(404).json({message: "user not found"})
                throw new Error("user not found");
            }
        }
        catch (error) {
            res.status(401).json({message: "Not authorized, token failed"})
            throw new Error("Not authorized, token failed");
        }
    }
    else {
        res.status(401).json({message: "Not authorized, token failed"})
        throw new Error("Not authorized, token failed");
    }

})

module.exports = { authorize }