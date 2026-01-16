import { Router } from "express";
import { addExpense, allExpenses, deleteExpense } from "../controller/expenseController.js";
import { isLogin } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.use(isLogin, isAdmin);

router.post("/add", addExpense);
router.get("/all", allExpenses);
router.delete("/delete/:id", deleteExpense);

export default router;
