import { Router } from "express";
import { registerUser } from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", registerUser)

export default router;