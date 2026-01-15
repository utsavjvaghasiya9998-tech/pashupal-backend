export const isWorker = (req, res, next) => {
    if (req.role !== "worker") {
        return res.status(403).json({ message: "Worker only access" });
    }
    next();
};
