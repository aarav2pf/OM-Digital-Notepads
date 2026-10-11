import pool from "../config/database.js";

export async function getNotepads(req, res) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM notepads
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      notepads: result.rows,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notepads.",
    });
  }
}

export async function getTrash(req, res) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM notepads
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `);

    res.json({
      success: true,
      notepads: result.rows,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trash.",
    });
  }
}

export async function createNotepad(req, res) {
  try {
    const {
      college_name,
      event_name,
      team_name,
      team_leader_name,
      team_leader_contact,
      boys,
      girls,
      total_members,
      mentor_name,
      mentor_contact,
      mentor_room,
      accommodation,
      transaction_id,
      amount_paid,
      oc_poc,
      oc_poc_contact,
      notepad_filled_by,
      duration,
      arrival_date,
      expected_departure_date,
      additional_remarks,
    } = req.body;

    const result = await pool.query(
      `
        INSERT INTO notepads (
          college_name,
          event_name,
          team_name,
          team_leader_name,
          team_leader_contact,
          boys,
          girls,
          total_members,
          mentor_name,
          mentor_contact,
          mentor_room,
          accommodation,
          transaction_id,
          amount_paid,
          oc_poc,
          oc_poc_contact,
          notepad_filled_by,
          duration,
          arrival_date,
          expected_departure_date,
          additional_remarks
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21
        )
        RETURNING *
      `,
      [
        college_name || "",
        event_name || "",
        team_name || "",
        team_leader_name || null,
        team_leader_contact || null,
        boys == null || boys === "" ? 0 : Number(boys),
        girls == null || girls === "" ? 0 : Number(girls),
        total_members == null || total_members === ""
          ? 0
          : Number(total_members),
        mentor_name || null,
        mentor_contact || null,
        mentor_room || null,
        accommodation || null,
        transaction_id || null,
        amount_paid == null || amount_paid === ""
          ? null
          : Number(amount_paid),
        oc_poc || null,
        oc_poc_contact || null,
        notepad_filled_by || null,
        duration || null,
        arrival_date || null,
        expected_departure_date || null,
        additional_remarks || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Notepad created successfully.",
      notepad: result.rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notepad.",
    });
  }
}


export async function updateNotepad(req, res) {
  try {
    const { id } = req.params;

    const {
      college_name,
      event_name,
      team_name,
      team_leader_name,
      team_leader_contact,
      boys,
      girls,
      total_members,
      mentor_name,
      mentor_contact,
      mentor_room,
      accommodation,
      transaction_id,
      amount_paid,
      oc_poc,
      oc_poc_contact,
      notepad_filled_by,
      duration,
      arrival_date,
      expected_departure_date,
      additional_remarks,
    } = req.body;

    const result = await pool.query(
      `
        UPDATE notepads
        SET
          college_name = $1,
          event_name = $2,
          team_name = $3,
          team_leader_name = $4,
          team_leader_contact = $5,
          boys = $6,
          girls = $7,
          total_members = $8,
          mentor_name = $9,
          mentor_contact = $10,
          mentor_room = $11,
          accommodation = $12,
          transaction_id = $13,
          amount_paid = $14,
          oc_poc = $15,
          oc_poc_contact = $16,
          notepad_filled_by = $17,
          duration = $18,
          arrival_date = $19,
          expected_departure_date = $20,
          additional_remarks = $21,

          updated_at = CASE
            WHEN
              college_name IS DISTINCT FROM $1 OR
              event_name IS DISTINCT FROM $2 OR
              team_name IS DISTINCT FROM $3 OR
              team_leader_name IS DISTINCT FROM $4 OR
              team_leader_contact IS DISTINCT FROM $5 OR
              boys IS DISTINCT FROM $6 OR
              girls IS DISTINCT FROM $7 OR
              total_members IS DISTINCT FROM $8 OR
              mentor_name IS DISTINCT FROM $9 OR
              mentor_contact IS DISTINCT FROM $10 OR
              mentor_room IS DISTINCT FROM $11 OR
              accommodation IS DISTINCT FROM $12 OR
              transaction_id IS DISTINCT FROM $13 OR
              amount_paid IS DISTINCT FROM $14 OR
              oc_poc IS DISTINCT FROM $15 OR
              oc_poc_contact IS DISTINCT FROM $16 OR
              notepad_filled_by IS DISTINCT FROM $17 OR
              duration IS DISTINCT FROM $18 OR
              arrival_date IS DISTINCT FROM $19 OR
              expected_departure_date IS DISTINCT FROM $20 OR
              additional_remarks IS DISTINCT FROM $21
            THEN NOW()
            ELSE updated_at
          END

        WHERE id = $22
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        college_name || "",
        event_name || "",
        team_name || "",
        team_leader_name || null,
        team_leader_contact || null,
        boys == null || boys === "" ? 0 : Number(boys),
        girls == null || girls === "" ? 0 : Number(girls),
        total_members == null || total_members === ""
          ? 0
          : Number(total_members),
        mentor_name || null,
        mentor_contact || null,
        mentor_room || null,
        accommodation || null,
        transaction_id || null,
        amount_paid == null || amount_paid === ""
          ? null
          : Number(amount_paid),
        oc_poc || null,
        oc_poc_contact || null,
        notepad_filled_by || null,
        duration || null,
        arrival_date || null,
        expected_departure_date || null,
        additional_remarks || null,
        id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Notepad not found.",
      });
    }

    res.json({
      success: true,
      message: "Notepad updated successfully.",
      notepad: result.rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notepad.",
    });
  }
}


export async function deleteNotepad(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        UPDATE notepads
        SET deleted_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Notepad not found.",
      });
    }

    res.json({
      success: true,
      message: "Notepad moved to trash.",
      notepad: result.rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to move notepad to trash.",
    });
  }
}

export async function restoreNotepad(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        UPDATE notepads
        SET
          deleted_at = NULL,
          updated_at = NOW()
        WHERE id = $1
          AND deleted_at IS NOT NULL
        RETURNING *
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        message: "Notepad not found in trash.",
      });
    }

    res.json({
      success: true,
      message: "Notepad restored successfully.",
      notepad: result.rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore notepad.",
    });
  }
}