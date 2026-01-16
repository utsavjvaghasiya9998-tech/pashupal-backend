import Animal from "../models/Animal.js";
import { paginate } from "../utils/paginate.js";

// ==========================
// GET ALL ANIMALS (ADMIN ONLY)
// ==========================
export const allAnimal = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const data = await paginate(
            Animal,
            { createdBy: req.id }, // 🔥 ONLY OWN DATA
            {
                page,
                limit,
                sort: { createdAt: -1 },
            }
        );

        res.json({
            success: true,
            message: "Animals fetched successfully",
            ...data,
        });
    } catch (error) {
        console.error("ALL ANIMAL ERROR:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ==========================
// GET SINGLE ANIMAL (ADMIN ONLY)
// ==========================
export const single = async (req, res) => {
    try {
        const animal = await Animal.findOne({
            _id: req.params.id,
            createdBy: req.id, // 🔥 SECURITY CHECK
        });

        if (!animal) {
            return res.status(404).json({ message: "Animal not found" });
        }

        res.json({
            success: true,
            data: animal,
        });
    } catch (error) {
        console.error("GET ANIMAL ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================
// ADD ANIMAL
// ==========================
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

        // 🔥 Check duplicate tag ONLY for same admin
        const exists = await Animal.findOne({
            tagId,
            createdBy: req.id,
        });

        if (exists) {
            return res.status(400).json({
                message: "Animal with this tagId already exists",
            });
        }

        const animal = await Animal.create({
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

            createdBy: req.id, // 🔥 VERY IMPORTANT
        });

        res.status(201).json({
            success: true,
            message: "Animal added successfully",
            animal,
        });
    } catch (error) {
        console.error("ADD ANIMAL ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

// ==========================
// UPDATE ANIMAL (ADMIN ONLY)
// ==========================
export const updateAnimal = async (req, res) => {
    try {
        const { id } = req.params;

        // 🔥 Find only own animal
        const animal = await Animal.findOne({
            _id: id,
            createdBy: req.id,
        });

        if (!animal) {
            return res.status(404).json({ message: "Animal not found" });
        }

        // 🔥 If tagId changed, check duplicate inside same admin
        if (req.body.tagId && req.body.tagId !== animal.tagId) {
            const tagExists = await Animal.findOne({
                tagId: req.body.tagId,
                createdBy: req.id,
            });

            if (tagExists) {
                return res.status(400).json({
                    message: "Another animal already uses this tagId",
                });
            }
        }

        const updatedAnimal = await Animal.findOneAndUpdate(
            { _id: id, createdBy: req.id }, // 🔥 SECURITY
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            message: "Animal updated successfully",
            data: updatedAnimal,
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

// ==========================
// DELETE ANIMAL (ADMIN ONLY)
// ==========================
export const deleteAnimal = async (req, res) => {
    try {
        const { id } = req.params;

        const animal = await Animal.findOne({
            _id: id,
            createdBy: req.id, // 🔥 SECURITY
        });

        if (!animal) {
            return res.status(404).json({ message: "Animal not found" });
        }

        await Animal.deleteOne({ _id: id, createdBy: req.id });

        res.json({
            success: true,
            message: "Animal deleted successfully",
        });
    } catch (error) {
        console.error("DELETE ANIMAL ERROR:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
