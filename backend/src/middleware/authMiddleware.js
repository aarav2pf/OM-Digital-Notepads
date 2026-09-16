import { createClient } from "@supabase/supabase-js";
import pool from "../config/database.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

/*
 * This is the one and only Super Superadmin.
 *
 * This check happens on the backend,
 * so changing/hiding frontend buttons
 * cannot bypass it.
 */
export const SUPER_SUPER_ADMIN_EMAIL =
  "aaravsadhu7@gmail.com";

export async function requireSuperadmin(
  req,
  res,
  next
) {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const token =
      authHeader.replace(
        "Bearer ",
        ""
      );

    const {
      data: { user },
      error,
    } =
      await supabase.auth.getUser(
        token
      );

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired authentication token.",
      });
    }

    const result =
      await pool.query(
        `
          SELECT *
          FROM superadmins
          WHERE LOWER(email) = LOWER($1)
            AND is_active = TRUE
        `,
        [user.email]
      );

    if (!result.rows.length) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You are not a Superadmin.",
      });
    }

    req.user = user;
    req.superadmin =
      result.rows[0];

    req.isSuperSuperAdmin =
      user.email?.toLowerCase() ===
      SUPER_SUPER_ADMIN_EMAIL;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Authentication service error.",
    });
  }
}

/*
 * Only aaravsadhu7@gmail.com can
 * manage the Superadmin list.
 */
export function requireSuperSuperAdmin(
  req,
  res,
  next
) {
  if (
    !req.isSuperSuperAdmin
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Only the Super Superadmin can add or remove Superadmins.",
    });
  }

  next();
}