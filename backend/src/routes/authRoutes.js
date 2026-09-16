import express from "express";

import { requireSuperadmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", requireSuperadmin, (req, res) => {
  res.json({
    success: true,
    authorized: true,
    user: {
      id: req.user.id,
      email: req.user.email,
    },
    superadmin: req.superadmin,
  });
});

export default router;