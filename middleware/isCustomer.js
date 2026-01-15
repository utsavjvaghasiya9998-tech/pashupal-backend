export const isWorker = (req, res, next) => {
    if (req.role !== "customer") {
        return res.status(403).json({ message: "Worker only access" });
    }
    next();
};
