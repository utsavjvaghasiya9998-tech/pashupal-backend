import { Router } from "express";
import { addAnimal, allAnimal, deleteAnimal, single, updateAnimal } from "../controller/AnimalController.js";
import { isLogin } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

// Animal Crud
router.get('/all', isLogin, allAnimal);
router.get('/:id',isLogin,isAdmin,single)
router.post('/add', isLogin, isAdmin, addAnimal);
router.put('/edit/:id', isLogin, isAdmin, updateAnimal);
router.delete('/delete/:id', isLogin, isAdmin, deleteAnimal);

export default router;