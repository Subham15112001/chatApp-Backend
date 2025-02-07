import { Router } from "express";
import { registerUser,loginUser } from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", registerUser)
router.post("/login", loginUser)

export default router;