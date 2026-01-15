import Expense from "../models/Expense.js";
import { paginate } from "../utils/paginate.js";

export const addExpense = async (req, res) => {
    try {
        const expense = await Expense.create(req.body);

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

export const allExpenses = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const result = await paginate(Expense, {}, {
            page,
            limit,
            sort: { date: -1 },
        });

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

export const deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted" });
    } catch (error) {
        console.error("deleteExpense ERROR:", err);
        res.status(500).json({ message: "Server error" });
    }
};
