import { Router } from "express";
import {
    addMilk,
    addWorker,
    allWorker,
    deleteMilk,
    deleteWorker,
    single,
    singleData,
    totalMilk,
    updateMilk,
    updateWorker,
} from "../controller/WorkerController.js";
import { isLogin } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

/* ================= WORKER ================= */

// Create worker
router.post("/add", isLogin, isAdmin,addWorker);

// Get all workers
router.get("/all", isLogin, isAdmin,allWorker);

// Get worker stats / totals
router.get("/totalmilk", isLogin, totalMilk);

// Get single worker (⚠️ MUST BE LAST)
router.get("/:id", isLogin, singleData);

// Update worker
router.put("/edit/:id", isLogin, updateWorker);

// Delete worker
router.delete("/delete/:id", isLogin, deleteWorker);

/* ================= MILK ================= */

router.post("/milk/add", addMilk);
router.get('/milk/edit/:id', single)
router.put("/milk/edit/:id", updateMilk);
router.delete("/milk/delete/:id", deleteMilk);

export default router;
