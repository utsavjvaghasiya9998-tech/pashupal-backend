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

/* ================= WORKER (ADMIN ONLY) ================= */
router.use(isLogin);

router.post("/add", isAdmin, addWorker);
router.get("/all", isAdmin, allWorker);
router.get("/:id", isAdmin, singleData);
router.put("/edit/:id", isAdmin, updateWorker);
router.delete("/delete/:id", isAdmin, deleteWorker);

/* ================= MILK ================= */

// Worker OR Admin can add milk
router.post("/milk/add", addMilk);

// Admin only
router.get("/milk/all", isAdmin, totalMilk);
router.get("/milk/:id", isAdmin, single);
router.put("/milk/edit/:id", isAdmin, updateMilk);
router.delete("/milk/delete/:id", isAdmin, deleteMilk);

export default router;
