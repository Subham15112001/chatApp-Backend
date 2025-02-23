import { Router } from "express";
import { getAllMessages } from "../controllers/message.controller";

const router = Router()

router.get("/all-message/:roomId",getAllMessages)

export default router