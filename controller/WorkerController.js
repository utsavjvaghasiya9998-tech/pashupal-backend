import Worker from "../models/Worker.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import MilkRecord from "../models/MilkRecord.js";
import Animal from "../models/Animal.js";
import { paginate } from "../utils/paginate.js";
import MilkStock from "../models/MilkStock.js";
import mongoose from "mongoose";
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
        console.log("=========== ADD MILK API CALLED ===========");
        console.log("ROLE:", req.role);
        console.log("REQ.ID:", req.id);

        const { animal, date, morningYield, eveningYield, remarks } = req.body;

        let adminId;
        let addedBy;

        // ================= RESOLVE IDS =================
        if (req.role === "admin") {
            adminId = req.id;
            addedBy = req.id;
            console.log("LOGIN AS ADMIN");
        }
        else if (req.role === "worker") {
            console.log("LOGIN AS WORKER");

            const worker = await Worker.findById(req.id);
            console.log("WORKER DOC:", worker);

            if (!worker) {
                console.log("❌ WORKER NOT FOUND");
                return res.status(404).json({ message: "Worker not found" });
            }

            console.log("WORKER.CREATEDBY:", worker.createdBy);

            adminId = worker.createdBy;
            addedBy = worker._id;
        }
        else {
            console.log("❌ INVALID ROLE");
            return res.status(403).json({ message: "Unauthorized" });
        }

        console.log("RAW adminId:", adminId);
        console.log("RAW addedBy:", addedBy);

        // ================= NORMALIZE =================
        const adminObjectId = new mongoose.Types.ObjectId(adminId);
        const addedByObjectId = new mongoose.Types.ObjectId(addedBy);

        console.log("FINAL adminObjectId:", adminObjectId);
        console.log("FINAL addedByObjectId:", addedByObjectId);

        // ================= CHECK ANIMAL =================
        const animalExists = await Animal.findOne({
            _id: animal,
            createdBy: adminObjectId,
        });

        console.log("ANIMAL FOUND:", animalExists ? "YES" : "NO");

        if (!animalExists) {
            return res.status(404).json({ message: "Animal not found" });
        }

        // ================= DATE NORMALIZE =================
        const recordDate = date ? new Date(date) : new Date();
        recordDate.setHours(0, 0, 0, 0);

        console.log("RECORD DATE:", recordDate);

        // ================= DUPLICATE CHECK =================
        const existing = await MilkRecord.findOne({
            animal,
            date: recordDate,
            createdBy: adminObjectId,
        });

        console.log("EXISTING RECORD:", existing ? "YES" : "NO");

        if (existing) {
            return res.status(400).json({
                message: "Milk record for this animal and date already exists",
            });
        }

        // ================= CALC =================
        const totalYield = Number(morningYield || 0) + Number(eveningYield || 0);
        console.log("TOTAL YIELD:", totalYield);

        // ================= SAVE =================
        const record = await MilkRecord.create({
            animal,
            date: recordDate,
            morningYield,
            eveningYield,
            totalYield,
            addedBy: addedByObjectId,
            createdBy: adminObjectId,
            remarks,
        });

        console.log("SAVED RECORD:", record);

        // ================= UPDATE STOCK =================
        const stock = await MilkStock.findOneAndUpdate(
            { createdBy: adminObjectId },
            { $inc: { totalMilk: totalYield } },
            { new: true, upsert: true }
        );

        console.log("UPDATED STOCK:", stock);

        console.log("=========== ADD MILK SUCCESS ===========");

        res.status(201).json({
            success: true,
            message: "Milk record added successfully",
            data: record,
        });

    } catch (error) {
        console.error("❌ ADD MILK ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// ==========================
// UPDATE MILK (ADMIN ONLY)
// ==========================
export const updateMilk = async (req, res) => {
    try {
        console.log("=========== UPDATE MILK API ===========");
        console.log("ROLE:", req.role);
        console.log("REQ.ID:", req.id);

        const { id } = req.params;

        let adminId;

        // ================= RESOLVE ADMIN =================
        if (req.role === "admin") {
            adminId = req.id;
            console.log("UPDATE BY ADMIN");
        }
        else if (req.role === "worker") {
            console.log("UPDATE BY WORKER");

            const worker = await Worker.findById(req.id);
            console.log("WORKER DOC:", worker);

            if (!worker) {
                return res.status(404).json({ message: "Worker not found" });
            }

            adminId = worker.createdBy;
        }
        else {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const adminObjectId = new mongoose.Types.ObjectId(adminId);
        console.log("ADMIN USED:", adminObjectId);

        // ================= FIND RECORD =================
        const data = await MilkRecord.findOne({
            _id: id,
            createdBy: adminObjectId,
        });

        console.log("RECORD FOUND:", data ? "YES" : "NO");

        if (!data)
            return res.status(404).json({ message: "Record Not Found" });

        const {
            morningYield = data.morningYield,
            eveningYield = data.eveningYield
        } = req.body;

        const totalYield = Number(morningYield || 0) + Number(eveningYield || 0);

        // ================= UPDATE =================
        const updatedMilkData = await MilkRecord.findOneAndUpdate(
            { _id: id, createdBy: adminObjectId },
            {
                ...req.body,
                totalYield,
            },
            { new: true, runValidators: true }
        );

        console.log("UPDATED RECORD:", updatedMilkData);

        res.json({
            success: true,
            message: "Milk record updated successfully",
            data: updatedMilkData,
        });

    } catch (error) {
        console.error("❌ UPDATE MILK ERROR:", error);
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

        let adminId;

        // 🔥 Resolve adminId
        if (req.role === "admin") {
            adminId = req.id;
        }
        else if (req.role === "worker") {
            const worker = await Worker.findById(req.id);
            if (!worker) {
                return res.status(404).json({ message: "Worker not found" });
            }
            adminId = worker.createdBy;
        }
        else {
            return res.status(403).json({ message: "Unauthorized" });
        }
        // console.log("admin",adminId);

        // 🔍 Find milk record belonging to this admin
        const record = await MilkRecord.findOne({
            _id: id,
            createdBy: adminId,
        });

        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }

        const qty = Number(record.totalYield || 0);

        // 🧮 Decrease stock
        await MilkStock.findOneAndUpdate(
            { createdBy: adminId },
            { $inc: { totalMilk: -qty } },
            { new: true }
        );

        // 🗑️ Delete record
        await MilkRecord.deleteOne({ _id: id });

        res.json({
            success: true,
            message: "Record deleted & stock updated",
        });

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
        let adminId;
        console.log("req.id==>", req.id)
        if (req.role === "admin") {
            adminId = req.id;
        }
        else if (req.role === "worker") {
            const worker = await Worker.findById(req.id);
            if (!worker) {
                return res.status(404).json({ message: "Worker not found" });
            }
            adminId = worker.createdBy;
        }
        else {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        const data = await paginate(
            MilkRecord,
            { createdBy: adminObjectId },
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
        res.status(403).json({
            success: false,
            message: error.message || "Unauthorized",
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
        console.log("=========== SINGLE MILK API ===========");
        console.log("ROLE:", req.role);
        console.log("REQ.ID:", req.id);
        console.log("PARAM ID:", req.params.id);

        const { id } = req.params;

        let adminId;

        if (req.role === "admin") {
            adminId = req.id;
        }
        else if (req.role === "worker") {
            const worker = await Worker.findById(req.id);
            if (!worker) {
                return res.status(404).json({ message: "Worker not found" });
            }
            adminId = worker.createdBy;
        }
        else {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        const data = await MilkRecord.findOne({
            _id: id,
            createdBy: adminObjectId,
        }).populate("animal", "tagId species breed");

        console.log("RECORD FOUND:", data ? "YES" : "NO");

        if (!data) {
            return res.status(404).json({ message: "Milk record not found" });
        }

        res.json({
            success: true,
            data,
        });

    } catch (error) {
        console.error("SINGLE MILK ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
