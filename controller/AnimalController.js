import Animal from '../models/Animal.js';
import { paginate } from '../utils/paginate.js';
// Animal

export const allAnimal = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const data = await paginate(Animal, {}, {
            page,
            limit,
            sort: { createdAt: -1 },
        });

        res.json({
            success: true,
            message: "Animals fetched successfully",
            ...data,
        });
    } catch (error) {
        console.error("ALL ANIMAL ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }

}
export const single = async (req, res) => {
    try {
        const animal = await Animal.findById(req.params.id);

        if (!animal) {
            return res.status(404).json({ message: "animal not found" });
        }

        res.json({
            success: true,
            data: animal,
        });
    } catch (error) {
        console.error("GET animal ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
}
export const addAnimal = async (req, res) => {
    try {
        const {
            tagId,
            breed,
            species,
            age,
            purchaseDate,
            isPregnant,
            healthStatus,
            currentStatus,
            profileImageUrl,
            notes,
        } = req.body;
        const exists = await Animal.findOne({ tagId });
        if (exists) {
            return res.status(400).json({
                message: "Animal with this tagId already exists",
            });
        }
        const animal = await Animal.create({
            admin: req.id, // coming from auth middleware
            tagId,
            breed,
            species,
            age,
            purchaseDate,
            isPregnant,
            healthStatus,
            currentStatus,
            profileImageUrl,
            notes,
        });
        res.status(201).json({
            success: true,
            message: "Animal added successfully",
            animal,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
    }
}
export const updateAnimal = async (req, res) => {
    try {
        // Check animal exists
        const { id } = req.params
        const animal = await Animal.findById(id);
        if (!animal) {
            return res.status(404).json({ message: "Animal not found" });
        }

        // If tagId changed, check duplicate
        if (req.body.tagId && req.body.tagId !== animal.tagId) {
            const tagExists = await Animal.findOne({ tagId: req.body.tagId });
            if (tagExists) {
                return res.status(400).json({
                    message: "Another animal already uses this tagId",
                });
            }
        }
        const updateAnimal = await Animal.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        res.status(201).json({
            success: true,
            message: "Animal Updated successfully",
            updateAnimal,
        });

    } catch (error) {
        console.error("UPDATE ANIMAL ERROR:", error);

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

export const deleteAnimal = async (req, res) => {
    try {
        const { id } = req.params
        const animal = await Animal.findById(id);
        if (!animal) {
            return res.status(404).json({ message: "Animal not found" });
        }
        await Animal.findByIdAndDelete(id)
        res.json({ success: true, messsage: "Animal Delete Successfully!" })
    } catch (error) {
        console.error("UPDATE ANIMAL ERROR:", error);

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