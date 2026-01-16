import { Router } from "express";
import { addUser, allUser, deleteUser, editUser, singleUser, userDashboard } from "../controller/UserController.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { isLogin } from "../middleware/auth.js";

const router = Router();

// 🔥 Admin only
router.use(isLogin, isAdmin);

router.get("/all", allUser);
router.post("/add", addUser);
router.get("/:id", singleUser);
router.put("/edit/:id", editUser);
router.delete("/delete/:id", deleteUser);

// 👤 Customer dashboard (customer token)
router.get("/dashboard", isLogin, userDashboard);

export default router;
