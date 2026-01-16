import Expense from "../models/Expense.js";
import { paginate } from "../utils/paginate.js";

// ==========================
// ADD EXPENSE (ADMIN ONLY)
// ==========================
export const addExpense = async (req, res) => {
    try {
        const expense = await Expense.create({
            ...req.body,
            createdBy: req.id, // 🔥 FORCE ADMIN ID FROM TOKEN
        });

        res.json({
            success: true,
            message: "Expense added",
            data: expense,
        });
    } catch (err) {
        console.error("ADD EXPENSE ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================
// GET ALL EXPENSES (ADMIN ONLY)
// ==========================
export const allExpenses = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const result = await paginate(
            Expense,
            { createdBy: req.id }, // 🔥 ONLY OWN DATA
            {
                page,
                limit,
                sort: { date: -1 },
            }
        );

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (err) {
        console.error("ALL EXPENSE ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================
// DELETE EXPENSE (ADMIN ONLY)
// ==========================
export const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findOne({
            _id: req.params.id,
            createdBy: req.id, // 🔥 SECURITY CHECK
        });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        await Expense.deleteOne({
            _id: req.params.id,
            createdBy: req.id,
        });

        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        console.error("DELETE EXPENSE ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};
