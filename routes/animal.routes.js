import { Router } from "express";
import { addAnimal, allAnimal, deleteAnimal, single, updateAnimal } from "../controller/AnimalController.js";
import { isLogin } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

router.use(isLogin, isAdmin);

router.get("/all", allAnimal);
router.get("/:id", single);
router.post("/add", addAnimal);
router.put("/edit/:id", updateAnimal);
router.delete("/delete/:id", deleteAnimal);

export default router;
