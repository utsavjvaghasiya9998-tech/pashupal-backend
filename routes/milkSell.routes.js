import { Router } from "express";
import { addMilkSell, allMilkSell, deleteMilkSell, editMilkSell, getUserMilkHistory, single } from "../controller/MilkSellController.js";
import { isLogin } from "../middleware/auth.js";

const router=Router();

router.get('/all',allMilkSell)
router.post('/add',isLogin,addMilkSell)
router.get('/:id',single)
router.put('/edit/:id',editMilkSell)
router.delete('/delete/:id',deleteMilkSell)
router.get('/user/:id',getUserMilkHistory)
export default router;