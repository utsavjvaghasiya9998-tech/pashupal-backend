import mongoose from "mongoose";
import MilkSale from "../models/MilkSale.js";
import MilkStock from "../models/MilkStock.js";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import { paginate } from "../utils/paginate.js";

/* =========================================================
   HELPER: RESOLVE REAL ADMIN
========================================================= */
const resolveAdmin = async (req) => {
    if (req.role === "admin") return req.id;

    if (req.role === "worker") {
        const worker = await Worker.findById(req.id);
        if (!worker) throw new Error("Worker not found");
        return worker.createdBy;
    }

    throw new Error("Unauthorized");
};

/* =========================================================
   GET ALL MILK SALES
========================================================= */
export const allMilkSell = async (req, res) => {
    try {
        const { limit, page } = req.query;

        const adminId = await resolveAdmin(req);

        const data = await paginate(
            MilkSale,
            { createdBy: adminId },
            {
                page,
                limit,
                sort: { createdAt: -1 },
                populate: [
                    { path: "user", select: "name phone address" },
                    { path: "givenBy", select: "name role" },
                ],
            }
        );

        res.json({ success: true, ...data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =========================================================
   ADD MILK SELL (TX SAFE)
========================================================= */
export const addMilkSell = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { user, quantity, pricePerLiter, totalPrice, paymentStatus, date } = req.body;

        const adminId = await resolveAdmin(req);

        // Check customer
        const customer = await User.findOne({ _id: user, createdBy: adminId }).session(session);
        if (!customer) throw new Error("Customer not found");

        // Check stock
        const stock = await MilkStock.findOne({ createdBy: adminId }).session(session);
        if (!stock || stock.totalMilk < quantity) throw new Error("Not enough stock");

        // Create sale
        const sale = await MilkSale.create([{
            user,
            quantity,
            pricePerLiter,
            totalPrice,
            paymentStatus,
            date,
            givenBy: req.id,
            createdBy: adminId,
        }], { session });

        // Decrease stock
        await MilkStock.findOneAndUpdate(
            { createdBy: adminId },
            { $inc: { totalMilk: -quantity } },
            { session }
        );

        // Update customer
        await User.findOneAndUpdate(
            { _id: user, createdBy: adminId },
            {
                $inc: {
                    totalMilkTaken: quantity,
                    totalAmount: totalPrice,
                },
            },
            { session }
        );

        await session.commitTransaction();

        res.status(201).json({ success: true, data: sale[0] });

    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

/* =========================================================
   EDIT MILK SELL (DIFF LOGIC)
========================================================= */
export const editMilkSell = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const adminId = await resolveAdmin(req);
        const adminObjectId = new mongoose.Types.ObjectId(adminId);

        // ================= FIND OLD RECORD =================
        const oldRecord = await MilkSale.findOne({
            _id: id,
            createdBy: adminObjectId,
        }).session(session);

        if (!oldRecord) {
            throw new Error("Record not found");
        }

        const oldQty = Number(oldRecord.quantity || 0);
        const oldPrice = Number(oldRecord.totalPrice || 0);

        // ================= NEW VALUES =================
        const newQty = Number(req.body.quantity ?? oldRecord.quantity);
        const newPrice = Number(req.body.totalPrice ?? oldRecord.totalPrice);

        if (isNaN(newQty) || newQty <= 0) {
            throw new Error("Invalid quantity");
        }

        // ================= DIFF =================
        const diff = newQty - oldQty; // + = more sale, - = less sale

        // ================= CHECK STOCK IF INCREASING SALE =================
        if (diff > 0) {
            const stock = await MilkStock.findOne({ createdBy: adminObjectId }).session(session);

            if (!stock || stock.totalMilk < diff) {
                throw new Error("Not enough stock");
            }
        }

        // ================= UPDATE SALE =================
        const updatedSale = await MilkSale.findOneAndUpdate(
            { _id: id, createdBy: adminObjectId },
            {
                ...req.body,
                quantity: newQty,
                totalPrice: newPrice,
            },
            { new: true, runValidators: true, session }
        );

        // ================= UPDATE STOCK (100% GUARANTEED) =================
        if (diff !== 0) {
            const stockDoc = await MilkStock.findOne({ createdBy: adminObjectId }).session(session);

            // console.log("FOUND STOCK DOC:", stockDoc);

            if (!stockDoc) {
                throw new Error("❌ Stock document not found for this admin");
            }

            const before = stockDoc.totalMilk;

            stockDoc.totalMilk = Number(stockDoc.totalMilk) - Number(diff);

            await stockDoc.save({ session });

            // console.log(`✅ STOCK UPDATED: ${before} → ${stockDoc.totalMilk}`);
        }


        // ================= UPDATE CUSTOMER TOTAL =================
        const priceDiff = newPrice - oldPrice;

        await User.findOneAndUpdate(
            { _id: oldRecord.user, createdBy: adminObjectId },
            {
                $inc: {
                    totalMilkTaken: diff,
                    totalAmount: priceDiff,
                },
            },
            { session }
        );

        await session.commitTransaction();

        res.json({
            success: true,
            message: "Milk sell updated successfully",
            data: updatedSale,
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("❌ UPDATE MILK SELL ERROR:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Update failed",
        });
    } finally {
        session.endSession();
    }
};


/* =========================================================
   DELETE MILK SELL (ONLY WITHIN 12 HOURS)
========================================================= */
export const deleteMilkSell = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const adminId = await resolveAdmin(req);

        const sale = await MilkSale.findOne({
            _id: id,
            createdBy: adminId,
        }).session(session);

        if (!sale) throw new Error("Record not found");

        // ⏱️ 12 hours rule
        const now = new Date();
        const created = new Date(sale.createdAt);
        const diffHours = (now - created) / (1000 * 60 * 60);

        if (diffHours > 12) {
            throw new Error("Cannot delete after 12 hours");
        }

        const qty = Number(sale.quantity);
        const price = Number(sale.totalPrice);

        // Rollback stock
        await MilkStock.findOneAndUpdate(
            { createdBy: adminId },
            { $inc: { totalMilk: qty } },
            { session }
        );

        // Rollback customer
        await User.findOneAndUpdate(
            { _id: sale.user, createdBy: adminId },
            {
                $inc: {
                    totalMilkTaken: -qty,
                    totalAmount: -price,
                },
            },
            { session }
        );

        // Delete sale
        await MilkSale.deleteOne({ _id: id }).session(session);

        await session.commitTransaction();

        res.json({ success: true, message: "Deleted successfully" });

    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

/* =========================================================
   GET SINGLE SALE
========================================================= */
export const singleMilkSell = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = await resolveAdmin(req);

        const data = await MilkSale.findOne({
            _id: id,
            createdBy: adminId,
        }).populate("user", "name phone address");

        if (!data) return res.status(404).json({ success: false, message: "Not found" });

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
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