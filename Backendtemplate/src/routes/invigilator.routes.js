import express from "express";
import { addInvigilator, getInvigilators, deleteInvigilator } from "../controllers/examcontrollers/invigilator.controller.js";

const router = express.Router();

router.post("/add", addInvigilator);
router.get("/get", getInvigilators);
router.delete("/:id", deleteInvigilator);

export default router;
