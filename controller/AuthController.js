import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Worker from "../models/Worker.js";
import jwt from "jsonwebtoken";

export const loginBoth = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check Admin
        let user = await Admin.findOne({ email });
        let role = "admin";

        // 2. If not admin, check Worker
        if (!user) {
            user = await Worker.findOne({ email });
            role = "worker";
        }
        if (!user) {
            user = await User.findOne({ email });
            role = "customer";
        }

        // 3. If still not found
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // 4. Check password (both have matchPassword)
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        // ✅ If worker logged in → set status active
        if (role === "worker") {
            user.status = "active";
            await user.save();
        }

        // 5. Generate token
        const token = jwt.sign(
            {
                id: user._id,
                role: role,
                fullname: user.name,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            role,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
export const logoutUser = async (req, res) => {
    try {
        console.log(req.id, "id")
        // If worker → set inactive
        if (req.role === "worker") {
            await Worker.findByIdAndUpdate(req.id, {
                status: "inactive",
            }, { new: true });
        }

        res.json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Logout failed" });
    }
};
