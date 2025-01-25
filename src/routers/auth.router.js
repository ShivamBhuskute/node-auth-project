import { Router } from "express";
import { signup, signin, signout } from "../controllers/auth.controllers.js";

const router = Router();

router.route("/signup").post(signup);
router.route("/signin").post(signin);
router.route("/signout").post(signout);

export default router;
