import Worker from "../models/Worker.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { paginate } from "../utils/paginate.js";
// ==========================
// WORKER LOGIN
// ==========================
export const workerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const worker = await Worker.findOne({ email });
        if (!worker)
            return res.status(400).json({ success: false, message: "Worker Not Found" });

        const isMatch = await bcrypt.compare(password, worker.password);
        if (!isMatch)
            return res.status(400).json({ success: false, message: "Invalid Password!" });

        const token = jwt.sign(
            {
                id: worker._id,
                role: worker.role,
                name: worker.name,
                adminId: worker.createdBy, // 🔥 VERY IMPORTANT
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            message: "Login Successful",
            worker: {
                id: worker._id,
                name: worker.name,
                role: worker.role,
                token,
            },
        });
    } catch (error) {
        console.error("WORKER LOGIN ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// GET ALL WORKERS (ADMIN ONLY)
// ==========================
export const allWorker = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const data = await paginate(
            Worker,
            { createdBy: req.id }, // 🔥 ONLY OWN WORKERS
            {
                page,
                limit,
                sort: { createdAt: -1 },
            }
        );

        res.json({
            success: true,
            message: "All workers fetched successfully",
            ...data,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// ADD WORKER (ADMIN ONLY)
// ==========================
export const addWorker = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        const worker = await Worker.create({
            name,
            email,
            password,
            phone,
            address,
            createdBy: req.id, // 🔥 ADMIN ID
        });

        res.json({
            message: "Worker Registered Successfully",
            success: true,
            data: worker,
        });
    } catch (error) {
        console.error("ADD WORKER ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// UPDATE WORKER (ADMIN ONLY)
// ==========================
export const updateWorker = async (req, res) => {
    try {
        const { id } = req.params;

        const worker = await Worker.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!worker)
            return res.status(404).json({ message: "Worker Not Found" });

        const updatedWorker = await Worker.findOneAndUpdate(
            { _id: id, createdBy: req.id },
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            message: "Worker Updated",
            success: true,
            data: updatedWorker,
        });
    } catch (error) {
        console.error("UPDATE WORKER ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// GET SINGLE WORKER (ADMIN ONLY)
// ==========================
export const singleData = async (req, res) => {
    try {
        const worker = await Worker.findOne({
            _id: req.params.id,
            createdBy: req.id,
        });

        if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        res.json({
            success: true,
            data: worker,
        });
    } catch (error) {
        console.error("GET WORKER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================
// DELETE WORKER (ADMIN ONLY)
// ==========================
export const deleteWorker = async (req, res) => {
    try {
        const { id } = req.params;

        const worker = await Worker.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!worker)
            return res.status(404).json({ message: "Worker Not Found" });

        await Worker.deleteOne({ _id: id, createdBy: req.id });

        res.json({
            success: true,
            message: "Worker deleted successfully",
        });
    } catch (error) {
        console.error("DELETE WORKER ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
