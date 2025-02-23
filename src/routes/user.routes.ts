import { Router } from "express";
import {registerUser, loginUser, logoutUser,refreshAccessToken, getCurrentUser,getAllUsers} from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/logout", verifyJWT, logoutUser)
router.get("/refresh-token", refreshAccessToken)
router.get("/current-user", verifyJWT, getCurrentUser)
router.get("/all-users", verifyJWT, getAllUsers)

export default router;