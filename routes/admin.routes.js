import { Router } from "express";
import { adminDashboard, adminRegister } from "../controller/UserController.js";
import { isLogin } from "../middleware/auth.js";

const router = Router();

// register
router.post('/register',adminRegister);

// Dashboard
router.get('/dashboard',isLogin,adminDashboard);


export default router;