import Worker from "../models/Worker.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import MilkRecord from "../models/MilkRecord.js";
import Animal from "../models/Animal.js";
import { paginate } from "../utils/paginate.js";
import MilkStock from "../models/MilkStock.js";

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

// ==========================
// ADD MILK (WORKER OR ADMIN)
// ==========================
export const addMilk = async (req, res) => {
    try {
        const {
            animal,
            date,
            morningYield,
            eveningYield,
            remarks,
        } = req.body;

        const adminId = req.worker?.adminId || req.id; // 🔥 WHO OWNS DATA

        // 🔥 Make sure animal belongs to this admin
        const animalExists = await Animal.findOne({
            _id: animal,
            createdBy: adminId,
        });

        if (!animalExists) {
            return res.status(404).json({ message: "Animal not found" });
        }

        const recordDate = date ? new Date(date) : new Date();
        recordDate.setHours(0, 0, 0, 0);

        const existing = await MilkRecord.findOne({
            animal,
            date: recordDate,
            createdBy: adminId,
        });

        if (existing) {
            return res.status(400).json({
                message: "Milk record for this animal and date already exists",
            });
        }

        const totalYield = Number(morningYield || 0) + Number(eveningYield || 0);

        // 1️⃣ Save milk record
        const record = await MilkRecord.create({
            animal,
            date: recordDate,
            morningYield,
            eveningYield,
            totalYield,
            addedBy: req.worker?.id || null,
            remarks,
            createdBy: adminId, // 🔥 OWNER
        });

        // 2️⃣ Update THIS admin stock
        await MilkStock.findOneAndUpdate(
            { createdBy: adminId },
            { $inc: { totalMilk: totalYield } },
            { new: true, upsert: true }
        );

        res.status(201).json({
            success: true,
            message: "Milk record added & stock updated",
            data: record,
        });
    } catch (error) {
        console.error("ADD MILK ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ==========================
// UPDATE MILK (ADMIN ONLY)
// ==========================
export const updateMilk = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await MilkRecord.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!data)
            return res.status(404).json({ message: "Record Not Found" });

        const { morningYield = data.morningYield, eveningYield = data.eveningYield } = req.body;

        const totalYield = Number(morningYield || 0) + Number(eveningYield || 0);

        const updatedMilkData = await MilkRecord.findOneAndUpdate(
            { _id: id, createdBy: req.id },
            {
                ...req.body,
                totalYield,
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: "Milk record updated successfully",
            data: updatedMilkData,
        });
    } catch (error) {
        console.error("UPDATE MILK ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// DELETE MILK (ADMIN ONLY)
// ==========================
export const deleteMilk = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await MilkRecord.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!data)
            return res.status(404).json({ message: "Data Not Found" });

        await MilkRecord.deleteOne({ _id: id, createdBy: req.id });

        res.json({ message: "Record Deleted", success: true });
    } catch (error) {
        console.error("DELETE MILK ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// GET ALL MILK RECORDS (ADMIN ONLY)
// ==========================
export const totalMilk = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const data = await paginate(
            MilkRecord,
            { createdBy: req.id }, // 🔥 ONLY OWN DATA
            {
                page,
                limit,
                sort: { date: -1, createdAt: -1 },
                populate: {
                    path: "animal",
                    select: "tagId species breed",
                },
            }
        );

        res.json({
            success: true,
            message: "Milk records fetched successfully",
            ...data,
        });
    } catch (error) {
        console.error("TOTAL MILK ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// GET MILK STOCK (ADMIN ONLY)
// ==========================
export const getMilkStock = async (req, res) => {
    const stock = await MilkStock.findOne({ createdBy: req.id });

    res.json({
        totalMilk: stock?.totalMilk || 0,
    });
};
export const single = async (req, res) => {
    try {
        const milk = await MilkRecord.findOne({ _id:req.params.id, createdBy: req.id, });

        if (!milk) {
            return res.status(404).json({ message: "milk not found" });
        }

        res.json({
            success: true,
            data: milk,
        });
    } catch (error) {
        console.error("GET milk ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
}