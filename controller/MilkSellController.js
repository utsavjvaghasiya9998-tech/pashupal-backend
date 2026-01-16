import MilkSale from "../models/MilkSale.js";
import { paginate } from "../utils/paginate.js";
import MilkStock from "../models/MilkStock.js";
import User from "../models/User.js";

// ==========================
// GET ALL MILK SALES (ADMIN ONLY)
// ==========================
export const allMilkSell = async (req, res) => {
    try {
        const { limit, page } = req.query;

        const data = await paginate(
            MilkSale,
            { createdBy: req.id }, // 🔥 ONLY OWN DATA
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
            message: "Server error",
        });
    }
};

// ==========================
// ADD MILK SALE
// ==========================
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

        // 🔥 Make sure user belongs to this admin
        const customer = await User.findOne({
            _id: user,
            createdBy: req.id,
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        // 🔥 Get this admin's stock
        let stock = await MilkStock.findOne({ createdBy: req.id });

        if (!stock) {
            stock = await MilkStock.create({
                createdBy: req.id,
                totalMilk: 0,
            });
        }

        if (stock.totalMilk < quantity) {
            return res.status(400).json({
                success: false,
                message: "Not enough milk in stock",
            });
        }

        const sale = await MilkSale.create({
            user,
            date,
            morningYield,
            eveningYield,
            quantity,
            pricePerLiter,
            totalPrice,
            paymentStatus,

            givenBy: req.worker?.id || req.id || null,

            createdBy: req.id, // 🔥 VERY IMPORTANT
        });

        // 🔥 Decrease only THIS admin's stock
        await MilkStock.updateOne(
            { createdBy: req.id },
            { $inc: { totalMilk: -quantity } }
        );

        // 🔥 Update only THIS admin's user
        await User.updateOne(
            { _id: user, createdBy: req.id },
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
            message: "Server error",
        });
    }
};

// ==========================
// GET SINGLE MILK SALE (ADMIN ONLY)
// ==========================
export const single = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await MilkSale.findOne({
            _id: id,
            createdBy: req.id, // 🔥 SECURITY
        });

        if (!data)
            return res.status(404).json({ message: "Record not found" });

        res.json({
            success: true,
            message: "Record fetched",
            data,
        });
    } catch (error) {
        console.error("GET SINGLE MILK SELL ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ==========================
// EDIT MILK SALE (ADMIN ONLY)
// ==========================
export const editMilkSell = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await MilkSale.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!data)
            return res.status(404).json({ message: "Record not found" });

        const newData = await MilkSale.findOneAndUpdate(
            { _id: id, createdBy: req.id },
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
            message: "Server error",
        });
    }
};

// ==========================
// DELETE MILK SALE (ADMIN ONLY)
// ==========================
export const deleteMilkSell = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await MilkSale.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!data)
            return res.status(404).json({ message: "Record not found" });

        await MilkSale.deleteOne({
            _id: id,
            createdBy: req.id,
        });

        res.json({
            success: true,
            message: "Data deleted",
        });
    } catch (error) {
        console.error("DELETE MILK SELL ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ==========================
// USER MILK HISTORY (ADMIN ONLY)
// ==========================
export const getUserMilkHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;

        // 🔥 Make sure user belongs to this admin
        const customer = await User.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        const data = await paginate(
            MilkSale,
            { user: id, createdBy: req.id }, // 🔥 DOUBLE FILTER
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
            message: "Server error",
        });
    }
};
