import express from "express";

import {
  getSuperadmins,
  addSuperadmin,
  removeSuperadmin,
} from "../controllers/superadminController.js";

import {
  requireSuperadmin,
  requireSuperSuperAdmin,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

/*
 * Every Superadmin can view the
 * Superadmin list.
 */
router.use(
  requireSuperadmin
);

router.get(
  "/",
  getSuperadmins
);

/*
 * ONLY the Super Superadmin
 * can add someone.
 */
router.post(
  "/",
  requireSuperSuperAdmin,
  addSuperadmin
);

/*
 * ONLY the Super Superadmin
 * can remove someone.
 */
router.delete(
  "/:id",
  requireSuperSuperAdmin,
  removeSuperadmin
);

export default router;