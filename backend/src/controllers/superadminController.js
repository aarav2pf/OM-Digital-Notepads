import pool from "../config/database.js";
import {
  SUPER_SUPER_ADMIN_EMAIL,
} from "../middleware/authMiddleware.js";

export async function getSuperadmins(
  req,
  res
) {
  try {
    const result =
      await pool.query(`
        SELECT
          id,
          email,
          created_at,
          created_by,
          is_active
        FROM superadmins
        ORDER BY created_at ASC
      `);

    res.json({
      success: true,
      superadmins:
        result.rows,
    });
  } catch (error) {
    console.error(
      "Database error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch Superadmins.",
    });
  }
}

export async function addSuperadmin(
  req,
  res
) {
  try {
    const { email } =
      req.body;

    if (
      !email ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email address is required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
     * The Super Superadmin already
     * exists and cannot be duplicated
     * through this operation.
     */
    if (
      normalizedEmail ===
      SUPER_SUPER_ADMIN_EMAIL
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This email is already the Super Superadmin.",
      });
    }

    const result =
      await pool.query(
        `
          INSERT INTO superadmins (
            email,
            created_by,
            is_active
          )
          VALUES ($1, $2, TRUE)
          ON CONFLICT (LOWER(email))
          DO UPDATE SET
            is_active = TRUE
          RETURNING *
        `,
        [
          normalizedEmail,
          req.user.email,
        ]
      );

    res.status(201).json({
      success: true,
      message:
        "Superadmin added successfully.",
      superadmin:
        result.rows[0],
    });
  } catch (error) {
    console.error(
      "Database error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to add Superadmin.",
    });
  }
}

export async function removeSuperadmin(
  req,
  res
) {
  try {
    const { id } =
      req.params;

    /*
     * Extra safety:
     * never deactivate the Super Superadmin.
     */
    const target =
      await pool.query(
        `
          SELECT *
          FROM superadmins
          WHERE id = $1
        `,
        [id]
      );

    if (!target.rows.length) {
      return res.status(404).json({
        success: false,
        message:
          "Superadmin not found.",
      });
    }

    if (
      target.rows[0].email?.toLowerCase() ===
      SUPER_SUPER_ADMIN_EMAIL
    ) {
      return res.status(403).json({
        success: false,
        message:
          "The Super Superadmin cannot be removed.",
      });
    }

    const result =
      await pool.query(
        `
          UPDATE superadmins
          SET is_active = FALSE
          WHERE id = $1
          RETURNING *
        `,
        [id]
      );

    res.json({
      success: true,
      message:
        "Superadmin access removed.",
      superadmin:
        result.rows[0],
    });
  } catch (error) {
    console.error(
      "Database error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to remove Superadmin.",
    });
  }
}