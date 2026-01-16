import { Router } from "express";
import {
    addMilkSell,
    allMilkSell,
    deleteMilkSell,
    editMilkSell,
    getUserMilkHistory,
    single
} from "../controller/MilkSellController.js";
import { isLogin } from "../middleware/auth.js";

const router = Router();


router.get("/all", isLogin,allMilkSell);
router.post("/add", isLogin,addMilkSell);
router.get("/user/:id",isLogin, getUserMilkHistory);
router.put("/edit/:id",isLogin, editMilkSell);
router.delete("/delete/:id",isLogin, deleteMilkSell);
router.get("/:id",isLogin, single);

export default router;
