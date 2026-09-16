import express from "express";

import {
  getNotepads,
  getTrash,
  createNotepad,
  updateNotepad,
  deleteNotepad,
  restoreNotepad,
} from "../controllers/notepadController.js";

import { requireSuperadmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireSuperadmin);

router.get("/", getNotepads);
router.get("/trash", getTrash);
router.post("/", createNotepad);
router.put("/:id", updateNotepad);
router.delete("/:id", deleteNotepad);
router.patch("/:id/restore", restoreNotepad);

export default router;