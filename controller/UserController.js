import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from "../models/Admin.js";
import Animal from '../models/Animal.js';
import MilkRecord from '../models/MilkRecord.js';
import Worker from '../models/Worker.js';
import User from '../models/User.js';
import { paginate } from '../utils/paginate.js';
import MilkStock from '../models/MilkStock.js';
import MilkSale from '../models/MilkSale.js';
import Expense from '../models/Expense.js';


// admin Register
export const adminRegister = async (req, res) => {
    try {
        const RegisterData = await Admin.create(req.body);
        res.json({ RegisterData })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error })
    }
}
// admin Register
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const data = await Admin.findOne({ email });
        if (!data) return res.status(400).json({ success: false, message: "User Not Found" });

        const isMatch = await bcrypt.compare(password, data.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid Password!" });

        const token = jwt.sign(
            { id: data._id, role: data.role, name: data.name },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        res.json({
            success: true, message: "Login Successfull",
            data: { id: data._id, name: data.name, role: data.role, token }
        })
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error })
    }
}
// admin Dashboard
export const adminDashboard = async (req, res) => {
    try {

        const totalAnimals = await Animal.countDocuments();
        const totalWorkers = await Worker.countDocuments();
        const milkQtyAgg = await MilkRecord.aggregate([
            {
                $group: {
                    _id: null,
                    totalMilk: { $sum: "$totalYield" }
                }
            }
        ]);

        const totalMilk = milkQtyAgg[0]?.totalMilk || 0;
        const totalIncomeAgg = await MilkSale.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" }
                }
            }
        ]);
        const expenseAgg = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        
        const totalExpense = expenseAgg[0]?.total || 0;
        const totalIncome = totalIncomeAgg[0]?.total || 0;

        const stock = await MilkStock.findOne();
        const totalStockMilk = stock?.totalMilk || 0;

        res.json({
            success: true,
            totalAnimals,
            totalWorkers,
            totalExpense,
            totalMilk,
            totalStockMilk,
            totalIncome
        });

    } catch (error) {
        console.error("ADMIN DASHBOARD ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};




// User
export const addUser = async (req, res) => {
    try {
        const data = await User.create(req.body);
        res.json({
            message: "User Added Successfull..!",
            success: true,
            data
        })
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}
export const allUser = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const data = await paginate(User, {}, {
            page,
            limit,
            sort: { createdAt: -1 },
        });
        if (!data) return res.status(400).json({ message: 'Data Not Found..!' });
        res.json({
            message: "Data Fetch Successfully...!",
            success: true,
            ...data
        })
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}
export const editUser = async (req, res) => {
    try {
        const { id } = req.params
        const data = await User.findById(id);
        if (!data) return res.status(400).json({ message: 'Customer Not Found..!' });
        const Data = await User.findByIdAndUpdate(id, req.body, { new: true });
        res.json({
            message: "Record Updated Successfull",
            success: true,
            Data
        })
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await User.findById(id);
        if (!data) return res.status(400).json({ message: 'Customer Not Found..!' });
        await User.findByIdAndDelete(id);
        res.json({
            message: "Record Delete Successfull",
            success: true,
        })
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}
export const singleUser = async (req, res) => {
    try {
        const data = await User.findById(req.params.id);
        if (!data) return res.status(400).json({ message: 'Data Not Found..!' });
        res.json({
            message: "Data Fetch Successfully...!",
            success: true,
            data
        })
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}
export const userDashboard = async (req, res) => {
    try {
        const userId = req.id; // from JWT middleware

        // Get all sales of this user
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