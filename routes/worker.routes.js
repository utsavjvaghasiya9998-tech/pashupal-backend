import { Router } from "express";
import {
    addWorker,
    allWorker,
    deleteWorker,
    singleData,
    updateWorker,
} from "../controller/WorkerController.js";
import { addMilk, deleteMilk, singleMilk, totalMilk, updateMilk } from "../controller/MilkController.js";
import { isLogin } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

/* ================= MILK ROUTES (FIRST!) ================= */

router.get("/totalmilk", isLogin, totalMilk);
// Admin OR Worker
router.get("/milk/:id", isLogin, singleMilk);
router.post("/milk/add", isLogin, addMilk);
router.put("/milk/edit/:id", isLogin, updateMilk);
router.delete("/milk/delete/:id", isLogin, deleteMilk);

// Milk list

/* ================= WORKER ROUTES ================= */

router.get("/all", isLogin, isAdmin, allWorker);
router.post("/add", isLogin, isAdmin, addWorker);
router.put("/edit/:id", isLogin, isAdmin, updateWorker);
router.delete("/delete/:id", isLogin, isAdmin, deleteWorker);

/* ================= ⚠️ SINGLE WORKER (LAST!) ================= */

router.get("/:id", isLogin, isAdmin, singleData);  // ⚠️ ALWAYS LAST

export default router;
