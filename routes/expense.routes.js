import { Router } from "express";
import { addExpense, allExpenses, deleteExpense } from "../controller/expenseController.js";
import { isLogin } from "../middleware/auth.js";

const router=Router();
router.post('/add',isLogin,addExpense);
router.get('/all',allExpenses);
router.delete('/delete/:id',deleteExpense);

export default router;