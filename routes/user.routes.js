import { Router } from "express";
import { addUser, allUser, deleteUser, editUser, singleUser, userDashboard } from "../controller/UserController.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { isLogin } from "../middleware/auth.js";

const router = Router();

// 🔥 Admin only

router.get("/dashboard", isLogin, userDashboard);
router.get("/all",isLogin, allUser);
router.post("/add",isLogin, isAdmin, addUser);
router.get("/:id",isLogin, isAdmin, singleUser);
router.put("/edit/:id", isLogin, isAdmin,editUser);
router.delete("/delete/:id",isLogin, isAdmin, deleteUser);

// 👤 Customer dashboard (customer token)

export default router;
