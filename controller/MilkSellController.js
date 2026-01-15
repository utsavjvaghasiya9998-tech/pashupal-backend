import MilkSale from "../models/MilkSale.js";
import { paginate } from "../utils/paginate.js";
import MilkStock from "../models/MilkStock.js";
import User from "../models/User.js";

export const allMilkSell = async (req, res) => {
    try {
        const { limit, page } = req.query;
        const data = await paginate(MilkSale, {}, {
            page, limit, sort: { createdAt: -1 }, populate: [
                {
                    path: "user",
                    select: "name phone address",
                },
                {
                    path: "givenBy",
                    select: "name role",
                },
            ],
        });
        if (!data) return res.status(400).json({ message: "Data Not Found" })
        res.json({
            success: true,
            message: "MilkSell Data fetched successfully",
            ...data,
        });
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}
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

        const stock = await MilkStock.findOne();

        if (!stock || stock.totalMilk < quantity) {
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
            givenBy: req.worker?.id || req.admin?.id || null,
        });

        await MilkStock.updateOne({}, { $inc: { totalMilk: -quantity } });

        await User.findByIdAndUpdate(user, {
            $inc: {
                totalMilkTaken: quantity,
                totalAmount: totalPrice,
            },
        });

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
export const single = async (req, res) => {
    try {
        const { id } = req.params
        const data = await MilkSale.findById(id);
        if (!data) return res.status(400).json({ message: 'Customer Not Found..!' });
        res.json({
            message: "Record get", data
        })
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}
export const editMilkSell = async (req, res) => {
    try {
        const { id } = req.params
        const data = await MilkSale.findById(id);
        if (!data) return res.status(400).json({ message: 'Customer Not Found..!' });
        const NewData = await MilkSale.findByIdAndUpdate(id, req.body, { new: true });
        res.json({
            message: "Data Updated", NewData
        })
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}
export const deleteMilkSell = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await MilkSale.findById(id);
        if (!data) return res.status(400).json({ message: 'Customer Not Found..!' });
        await MilkSale.findByIdAndDelete(id);
        res.json({
            message: "Data Delete"
        })
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}


export const getUserMilkHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;

        const data = await paginate(
            MilkSale,
            { user: id },
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
            ...data, // contains: data + pagination
        });
    } catch (error) {
        console.error("USER MILK HISTORY ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
