import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Animal from "../models/Animal.js";
import MilkRecord from "../models/MilkRecord.js";
import Worker from "../models/Worker.js";
import User from "../models/User.js";
import { paginate } from "../utils/paginate.js";
import MilkStock from "../models/MilkStock.js";
import MilkSale from "../models/MilkSale.js";
import Expense from "../models/Expense.js";

// ==========================
// ADMIN REGISTER
// ==========================
export const adminRegister = async (req, res) => {
    try {
        const admin = await Admin.create(req.body);
        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// ==========================
// ADMIN LOGIN
// ==========================
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const data = await Admin.findOne({ email });
        if (!data)
            return res
                .status(400)
                .json({ success: false, message: "User Not Found" });

        const isMatch = await bcrypt.compare(password, data.password);
        if (!isMatch)
            return res
                .status(400)
                .json({ success: false, message: "Invalid Password!" });

        const token = jwt.sign(
            { id: data._id, role: data.role, name: data.name },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            message: "Login Successful",
            data: { id: data._id, name: data.name, role: data.role, token },
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// ==========================
// ADMIN DASHBOARD (ADMIN ONLY)
// ==========================
export const adminDashboard = async (req, res) => {
    try {
        const adminId = req.id;

        const totalAnimals = await Animal.countDocuments({ createdBy: adminId });
        const totalWorkers = await Worker.countDocuments({ createdBy: adminId });

        const milkQtyAgg = await MilkRecord.aggregate([
            { $match: { createdBy: adminId } },
            {
                $group: {
                    _id: null,
                    totalMilk: { $sum: "$totalYield" },
                },
            },
        ]);

        const totalMilk = milkQtyAgg[0]?.totalMilk || 0;

        const totalIncomeAgg = await MilkSale.aggregate([
            { $match: { createdBy: adminId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" },
                },
            },
        ]);

        const expenseAgg = await Expense.aggregate([
            { $match: { createdBy: adminId } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        const totalExpense = expenseAgg[0]?.total || 0;
        const totalIncome = totalIncomeAgg[0]?.total || 0;

        const stock = await MilkStock.findOne({ createdBy: adminId });
        const totalStockMilk = stock?.totalMilk || 0;

        res.json({
            success: true,
            totalAnimals,
            totalWorkers,
            totalExpense,
            totalMilk,
            totalStockMilk,
            totalIncome,
        });
    } catch (error) {
        console.error("ADMIN DASHBOARD ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// ADD USER (ADMIN ONLY)
// ==========================
export const addUser = async (req, res) => {
    try {
        const user = await User.create({
            ...req.body,
            createdBy: req.id, // 🔥 FORCE ADMIN ID
        });

        res.json({
            message: "User Added Successfully!",
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("ADD USER ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// GET ALL USERS (ADMIN ONLY)
// ==========================
export const allUser = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const data = await paginate(
            User,
            { createdBy: req.id }, // 🔥 ONLY OWN USERS
            {
                page,
                limit,
                sort: { createdAt: -1 },
            }
        );

        res.json({
            message: "Data Fetch Successfully!",
            success: true,
            ...data,
        });
    } catch (error) {
        console.error("ALL USER ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// EDIT USER (ADMIN ONLY)
// ==========================
export const editUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!user)
            return res.status(404).json({ message: "Customer Not Found!" });

        const updated = await User.findOneAndUpdate(
            { _id: id, createdBy: req.id },
            req.body,
            { new: true }
        );

        res.json({
            message: "Record Updated Successfully",
            success: true,
            data: updated,
        });
    } catch (error) {
        console.error("EDIT USER ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// DELETE USER (ADMIN ONLY)
// ==========================
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!user)
            return res.status(404).json({ message: "Customer Not Found!" });

        await User.deleteOne({ _id: id, createdBy: req.id });

        res.json({
            message: "Record Deleted Successfully",
            success: true,
        });
    } catch (error) {
        console.error("DELETE USER ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// GET SINGLE USER (ADMIN ONLY)
// ==========================
export const singleUser = async (req, res) => {
    try {
        const data = await User.findOne({
            _id: req.params.id,
            createdBy: req.id,
        });

        if (!data)
            return res.status(404).json({ message: "Data Not Found!" });

        res.json({
            message: "Data Fetch Successfully!",
            success: true,
            data,
        });
    } catch (error) {
        console.error("SINGLE USER ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// USER DASHBOARD (CUSTOMER LOGIN)
// ==========================
export const userDashboard = async (req, res) => {
    try {
        const userId = req.id; // customer id from JWT

        const sales = await MilkSale.find({ user: userId });

        let totalMilk = 0;
        let totalAmount = 0;
        let unpaidAmount = 0;

        sales.forEach((s) => {
            const qty = Number(s.quantity || 0);
            const amount = Number(s.totalPrice || 0);

            totalMilk += qty;
            totalAmount += amount;

            if (s.paymentStatus === "unpaid") {
                unpaidAmount += amount;
            }
        });

        res.json({
            success: true,
            totalMilk,
            totalAmount,
            unpaidAmount,
        });
    } catch (error) {
        console.error("USER DASHBOARD ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
