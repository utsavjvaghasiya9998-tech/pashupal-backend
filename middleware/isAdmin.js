export const isAdmin = (req, res, next) => {
    if (req.role !== "admin") {
        return res.status(403).json({ message: "Admin only access" });
    }
    console.log("req.role",req.role);
    
    next();
};
