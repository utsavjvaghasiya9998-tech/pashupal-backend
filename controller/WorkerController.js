import Worker from '../models/Worker.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import MilkRecord from '../models/MilkRecord.js';
import Animal from '../models/Animal.js';
import { paginate } from '../utils/paginate.js';
import MilkStock from '../models/MilkStock.js';


// Worker Login
export const workerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const worker = await Worker.findOne({ email });
        if (!worker) return res.status(400).json({ success: false, message: "Worker Not Found" });
        console.log("worker", worker);

        const isMatch = await bcrypt.compare(password, worker.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid Password!" });

        const token = jwt.sign(
            { id: worker._id, role: worker.role, name: worker.name },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        res.json({
            success: true, message: "Login Successfull",
            worker: { id: worker._id, name: worker.name, role: worker.role, token }
        })

    } catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
        console.log("error", error);
    }
}

// Worker
export const allWorker = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const data = await paginate(Worker, {}, {
            page,
            limit,
            sort: { createdAt: -1 },
        });
        res.json({
            success: true,
            message: "all data get successfully",
            ...data,
        })
    } catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
    }

}
export const addWorker = async (req, res) => {
    try {
        console.log("req.id", req.id);
        const { name, email, password, phone, address, } = req.body
        const data = await Worker.create({
            name, email, password, phone, address,
            admin: req.id
        });
        // console.log("rcf",data);

        res.json({ message: "Register Successgull", success: true, data });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
        console.log("error", error);

    }
}
export const updateWorker = async (req, res) => {
    try {
        const { id } = req.params
        const worker = await Worker.findById(id);
        if (!worker) return res.status(400).json({ message: "Worker Not Found" });

        const updatedWorker = await Worker.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        res.json({ message: "Worker Updated", success: true, updatedWorker })
    } catch (error) {
        console.error("UPDATE Worker ERROR:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
export const singleData = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);

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
}
export const deleteWorker = async (req, res) => {
    try {
        const { id } = req.params
        const worker = await Worker.findById(id);
        if (!worker) return res.status(400).json({ message: "Worker Not Found" });
        await Worker.findByIdAndDelete(id);
        res.json({
            success: true,
            message: "Worker deleted successfully",
        });

    } catch (error) {
        console.error("UPDATE Worker ERROR:", error);
        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }
        res.status(500).json({
            message: "Internal server error",
        });
    }
}


// Milk
export const single = async (req, res) => {
    try {
        const milk = await MilkRecord.findById(req.params.id);

        if (!milk) {
            return res.status(404).json({ message: "milk not found" });
        }

        res.json({
            success: true,
            data: milk,
        });
    } catch (error) {
        console.error("GET milk ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
}
export const addMilk = async (req, res) => {
    try {
        const {
            animal,
            date,
            morningYield,
            eveningYield,
            remarks,
        } = req.body;

        const animalExists = await Animal.findById(animal);
        if (!animalExists) {
            return res.status(404).json({ message: "Animal not found" });
        }

        const recordDate = date ? new Date(date) : new Date();
        recordDate.setHours(0, 0, 0, 0);

        const existing = await MilkRecord.findOne({
            animal,
            date: recordDate,
        });

        if (existing) {
            return res.status(400).json({
                message: "Milk record for this animal and date already exists",
            });
        }

        const totalYield = Number(morningYield) + Number(eveningYield);

        // 1️⃣ Save animal milk record
        const record = await MilkRecord.create({
            animal,
            date: recordDate,
            morningYield,
            eveningYield,
            totalYield,
            addedBy: req.worker?.id || null,
            remarks,
        });

        // 2️⃣ Add to central stock
        await MilkStock.findOneAndUpdate(
            {},
            { $inc: { totalMilk: totalYield } },
            { new: true, upsert: true }
        );

        res.status(201).json({
            success: true,
            message: "Milk record added & stock updated",
            record,
        });
    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateMilk = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await MilkRecord.findById(id);
        if (!data) return res.status(404).json({ message: "Record Not Found" });

        const { morningYield = data.morningYield, eveningYield = data.eveningYield } = req.body;

        // ✅ Recalculate total
        const totalYield = Number(morningYield || 0) + Number(eveningYield || 0);

        // ✅ Update in one call
        const updatedMilkData = await MilkRecord.findByIdAndUpdate(
            id,
            {
                ...req.body,
                totalYield,
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: "Milk record updated successfully",
            data: updatedMilkData,
        });

    } catch (error) {
        console.error(" ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}
export const deleteMilk = async (req, res) => {
    try {
        const { id } = req.params
        const data = await MilkRecord.findById(id);
        if (!data) return res.status(400).json({ message: "Data Not Found" });
        await MilkRecord.findByIdAndDelete(id);
        res.json({ message: "Record Deleted", success: true })
    } catch (error) {
        console.error(" ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}

export const totalMilk = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const data = await paginate(MilkRecord, {}, {
            page,
            limit,
            sort: { date: -1, createdAt: -1 },
            populate: {
                path: "animal",
                select: "tagId species breed",
            },
        });

        res.json({
            success: true,
            message: "Milk records fetched successfully",
            ...data,
        });
    } catch (error) {
        console.error("TOTAL MILK ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getMilkStock = async (req, res) => {
    const stock = await MilkStock.findOne();
    res.json({
        totalMilk: stock?.totalMilk || 0
    });
};
