import { Router } from "express";
import { loginBoth,logoutUser } from "../controller/AuthController.js";
import { isLogin } from "../middleware/auth.js";

const router = Router();

router.post("/login", loginBoth);
router.post("/logout",isLogin, logoutUser);

export default router;
