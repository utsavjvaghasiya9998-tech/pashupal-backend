import MilkSale from "../models/MilkSale.js";
import { paginate } from "../utils/paginate.js";
import MilkStock from "../models/MilkStock.js";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import mongoose from "mongoose";

/* =========================================================
   HELPER: RESOLVE REAL ADMIN ID
========================================================= */
const resolveAdmin = async (req) => {
    if (req.role === "admin") {
        return req.id;
    }
    if (req.role === "worker") {
        const worker = await Worker.findById(req.id);
        if (!worker) throw new Error("Worker not found");
        return worker.createdBy;
    }
    throw new Error("Unauthorized");
};

/* =========================================================
   GET ALL MILK SALES (ADMIN + WORKER)
========================================================= */
export const allMilkSell = async (req, res) => {
    try {
        const { limit, page } = req.query;

        const adminId = await resolveAdmin(req);
        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        const data = await paginate(
            MilkSale,
            { createdBy: adminObjectId },
            {
                page,
                limit,
                sort: { createdAt: -1 },
                populate: [
                    {
                        path: "user",
                        select: "name phone address",
                    },
                    {
                        path: "givenBy",
                        select: "name role",
                    },
                ],
            }
        );

        res.json({
            success: true,
            message: "MilkSell Data fetched successfully",
            ...data,
        });

    } catch (error) {
        console.error("ALL MILK SELL ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

/* =========================================================
   ADD MILK SALE (ADMIN + WORKER)
========================================================= */
export const addMilkSell = async (req, res) => {
    try {
        const {
            user,
            date,
            morningYield,
            eveningYield,
            quantity,
            pricePerLiter,
            totalPrice,
            paymentStatus,
        } = req.body;

        if (!user || !quantity || !pricePerLiter) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        let adminId;
        let givenBy;

        if (req.role === "admin") {
            adminId = req.id;
            givenBy = req.id;
        } else if (req.role === "worker") {
            const worker = await Worker.findById(req.id);
            if (!worker) {
                return res.status(404).json({ success: false, message: "Worker not found" });
            }
            adminId = worker.createdBy;
            givenBy = worker._id;
        } else {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const adminObjectId = new mongoose.Types.ObjectId(adminId);
        const givenByObjectId = new mongoose.Types.ObjectId(givenBy);

        // Check customer belongs to this admin
        const customer = await User.findOne({
            _id: user,
            createdBy: adminObjectId
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Get stock
        let stock = await MilkStock.findOne({ createdBy: adminObjectId });

        if (!stock) {
            stock = await MilkStock.create({
                createdBy: adminObjectId,
                totalMilk: 0,
            });
        }

        if (stock.totalMilk < quantity) {
            return res.status(400).json({
                success: false,
                message: "Not enough milk in stock",
            });
        }

        // Create sale
        const sale = await MilkSale.create({
            user,
            date,
            morningYield,
            eveningYield,
            quantity,
            pricePerLiter,
            totalPrice,
            paymentStatus,
            givenBy: givenByObjectId,
            createdBy: adminObjectId,
        });

        // Decrease stock
        await MilkStock.updateOne(
            { createdBy: adminObjectId },
            { $inc: { totalMilk: -quantity } }
        );

        // Update customer
        await User.updateOne(
            { _id: user, createdBy: adminObjectId },
            {
                $inc: {
                    totalMilkTaken: quantity,
                    totalAmount: totalPrice,
                },
            }
        );

        res.status(201).json({
            success: true,
            message: "Milk sold successfully",
            data: sale,
        });

    } catch (error) {
        console.error("ADD MILK SELL ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

/* =========================================================
   GET SINGLE MILK SALE (ADMIN + WORKER)
========================================================= */
export const single = async (req, res) => {
    try {
        const { id } = req.params;

        const adminId = await resolveAdmin(req);
        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        const data = await MilkSale.findOne({
            _id: id,
            createdBy: adminObjectId,
        }).populate("user", "name phone address");

        if (!data) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        res.json({
            success: true,
            message: "Record fetched",
            data,
        });

    } catch (error) {
        console.error("GET SINGLE MILK SELL ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

/* =========================================================
   EDIT MILK SALE (ADMIN + WORKER)
========================================================= */
export const editMilkSell = async (req, res) => {
    try {
        const { id } = req.params;

        const adminId = await resolveAdmin(req);
        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        const data = await MilkSale.findOne({
            _id: id,
            createdBy: adminObjectId,
        });

        if (!data) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        const newData = await MilkSale.findOneAndUpdate(
            { _id: id, createdBy: adminObjectId },
            req.body,
            { new: true }
        );

        res.json({
            success: true,
            message: "Data updated",
            data: newData,
        });

    } catch (error) {
        console.error("EDIT MILK SELL ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

/* =========================================================
   DELETE MILK SALE (ADMIN + WORKER) + STOCK ROLLBACK
========================================================= */
export const deleteMilkSell = async (req, res) => {
    try {
        const { id } = req.params;

        const adminId = await resolveAdmin(req);
        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        const data = await MilkSale.findOne({
            _id: id,
            createdBy: adminObjectId,
        });

        if (!data) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }

        // Rollback stock
        await MilkStock.updateOne(
            { createdBy: adminObjectId },
            { $inc: { totalMilk: data.quantity } }
        );

        await MilkSale.deleteOne({
            _id: id,
            createdBy: adminObjectId,
        });

        res.json({
            success: true,
            message: "Data deleted",
        });

    } catch (error) {
        console.error("DELETE MILK SELL ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

/* =========================================================
   USER MILK HISTORY (ADMIN + WORKER)
========================================================= */
export const getUserMilkHistory = async (req, res) => {
    try {
        const { id } = req.params; // 👈 THIS IS USER ID
        const { page, limit } = req.query;

        // ================= RESOLVE REAL ADMIN =================
        let adminId;

        if (req.role === "admin") {
            adminId = req.id;
        }
        else if (req.role === "customer") {
            const customer = await User.findById(req.id);
            if (!customer) {
                return res.status(404).json({ success: false, message: "Worker not found" });
            }
            adminId = customer.createdBy;
        }
        else {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        // ================= CHECK CUSTOMER BELONGS TO ADMIN =================
        const customer = await User.findOne({
            _id: id,
            createdBy: adminObjectId,
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        // ================= FETCH HISTORY =================
        const data = await paginate(
            MilkSale,
            { user: id, createdBy: adminObjectId },
            {
                page,
                limit,
                sort: { date: -1, createdAt: -1 },
                populate: {
                    path: "user",
                    select: "name phone",
                },
            }
        );

        res.json({
            success: true,
            ...data,
        });

    } catch (error) {
        console.error("USER MILK HISTORY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
};

