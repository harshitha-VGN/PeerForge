import {Router} from "express" 
import { healthCheck } from "../controllers/healthController.js"
import authMiddleware from "../middleware/authMiddleware.js";

const router=Router()

router.get('/',authMiddleware,healthCheck)


export default router