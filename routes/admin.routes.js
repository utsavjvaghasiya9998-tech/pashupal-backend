import { Router } from "express";
import { adminDashboard, adminRegister } from "../controller/UserController.js";

const router = Router();

// register
router.post('/register',adminRegister);

// Dashboard
router.get('/dashboard',adminDashboard);


export default router;