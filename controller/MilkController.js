import mongoose from "mongoose";
import MilkRecord  from "../models/MilkRecord.js";
import MilkStock from "../models/MilkStock.js";
import  Animal  from "../models/Animal.js";
import Worker  from "../models/Worker.js";
import {paginate} from "../utils/paginate.js";

// ==========================
// 🔧 HELPER: RESOLVE ADMIN
// ==========================
const resolveAdmin = async (req) => {
    if (req.role === "admin") return req.id;

    if (req.role === "worker") {
        const worker = await Worker.findById(req.id);
        if (!worker) throw new Error("Worker not found");
        return worker.createdBy;
    }

    throw new Error("Unauthorized");
};

// ==========================
// ➕ ADD MILK (TX SAFE)
// ==========================
export const addMilk = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { animal, date, morningYield, eveningYield, remarks } = req.body;

        const adminId = await resolveAdmin(req);

        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        // Check animal
        const animalExists = await Animal.findOne({
            _id: animal,
            createdBy: adminObjectId,
        }).session(session);

        if (!animalExists) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Animal not found" });
        }

        // Normalize date
        const recordDate = date ? new Date(date) : new Date();
        recordDate.setHours(0, 0, 0, 0);

        // Duplicate check
        const existing = await MilkRecord.findOne({
            animal,
            date: recordDate,
            createdBy: adminObjectId,
        }).session(session);

        if (existing) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Record already exists" });
        }

        const totalYield =
            Number(morningYield || 0) + Number(eveningYield || 0);

        const record = await MilkRecord.create(
            [
                {
                    animal,
                    date: recordDate,
                    morningYield,
                    eveningYield,
                    totalYield,
                    addedBy: req.id,
                    createdBy: adminObjectId,
                    remarks,
                },
            ],
            { session }
        );

        await MilkStock.findOneAndUpdate(
            { createdBy: adminObjectId },
            { $inc: { totalMilk: totalYield } },
            { new: true, upsert: true, session }
        );

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Milk added successfully",
            data: record[0],
        });
    } catch (err) {
        await session.abortTransaction();
        console.error("ADD MILK ERROR:", err);
        res.status(500).json({ message: err.message || "Server error" });
    } finally {
        session.endSession();
    }
};

// ==========================
// ✏️ UPDATE MILK (TX SAFE)
// ==========================
export const updateMilk = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const adminId = await resolveAdmin(req);
        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        const oldRecord = await MilkRecord.findOne({
            _id: id,
            createdBy: adminObjectId,
        }).session(session);

        if (!oldRecord) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Record not found" });
        }

        const oldTotal = Number(oldRecord.totalYield || 0);

        const {
            morningYield = oldRecord.morningYield,
            eveningYield = oldRecord.eveningYield,
        } = req.body;

        const newTotal =
            Number(morningYield || 0) + Number(eveningYield || 0);

        const diff = newTotal - oldTotal;

        const updated = await MilkRecord.findOneAndUpdate(
            { _id: id, createdBy: adminObjectId },
            { ...req.body, totalYield: newTotal },
            { new: true, session }
        );

        if (diff !== 0) {
            await MilkStock.findOneAndUpdate(
                { createdBy: adminObjectId },
                { $inc: { totalMilk: diff } },
                { new: true, upsert: true, session }
            );
        }

        await session.commitTransaction();

        res.json({
            success: true,
            message: "Milk updated successfully",
            data: updated,
        });
    } catch (err) {
        await session.abortTransaction();
        console.error("UPDATE MILK ERROR:", err);
        res.status(500).json({ message: err.message || "Server error" });
    } finally {
        session.endSession();
    }
};

// ==========================
// 🗑️ DELETE MILK (TX SAFE)
// ==========================
export const deleteMilk = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const adminId = await resolveAdmin(req);

        const record = await MilkRecord.findOne({
            _id: id,
            createdBy: adminId,
        }).session(session);

        if (!record) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Record not found" });
        }

        const qty = Number(record.totalYield || 0);

        await MilkStock.findOneAndUpdate(
            { createdBy: adminId },
            { $inc: { totalMilk: -qty } },
            { session }
        );

        await MilkRecord.deleteOne({ _id: id }).session(session);

        await session.commitTransaction();

        res.json({
            success: true,
            message: "Milk deleted & stock updated",
        });
    } catch (err) {
        await session.abortTransaction();
        console.error("DELETE MILK ERROR:", err);
        res.status(500).json({ message: err.message || "Server error" });
    } finally {
        session.endSession();
    }
};

// ==========================
// 📄 GET ALL MILK RECORDS
// ==========================
export const totalMilk = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const adminId = await resolveAdmin(req);

        const data = await paginate(
            MilkRecord,
            { createdBy: adminId },
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
            ...data,
        });
    } catch (err) {
        console.error("TOTAL MILK ERROR:", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// ==========================
// 📦 GET MILK STOCK
// ==========================
export const getMilkStock = async (req, res) => {
    try {
        const adminId = await resolveAdmin(req);

        const stock = await MilkStock.findOne({ createdBy: adminId });

        res.json({
            success: true,
            totalMilk: stock?.totalMilk || 0,
        });
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// ==========================
// 🔍 GET SINGLE RECORD
// ==========================
export const singleMilk = async (req, res) => {
    try {
        const { id } = req.params;

        const adminId = await resolveAdmin(req);

        const data = await MilkRecord.findOne({
            _id: id,
            createdBy: adminId,
        }).populate("animal", "tagId species breed");

        if (!data) {
            return res.status(404).json({ message: "Record not found" });
        }

        res.json({
            success: true,
            data,
        });
    } catch (err) {
        console.error("SINGLE MILK ERROR:", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};
