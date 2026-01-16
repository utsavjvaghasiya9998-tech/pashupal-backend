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

// 🔥 Protect all routes
router.use(isLogin);

router.get("/all", allMilkSell);
router.post("/add", addMilkSell);
router.get("/user/:id", getUserMilkHistory);
router.get("/:id", single);
router.put("/edit/:id", editMilkSell);
router.delete("/delete/:id", deleteMilkSell);

export default router;
