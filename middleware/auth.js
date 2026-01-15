import jwt from "jsonwebtoken";

export const isLogin = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // ✅ MUST BE let (not const)
        let token = authHeader?.split(" ")[1];

        console.log("TOKEN FROM HEADER:", token);

        // ✅ For PDF / CSV downloads
        if (!token && req.query.token) {
            token = req.query.token;
            console.log("TOKEN FROM QUERY:", token);
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        console.log("AUTH TOKEN RECEIVED:", token);

        const tokenData = jwt.verify(token, process.env.JWT_SECRET);

        req.id = tokenData.id;
        req.role = tokenData.role;
        req.fullname = tokenData.fullname;

        next();
    } catch (error) {
        console.error("API Auth error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};
