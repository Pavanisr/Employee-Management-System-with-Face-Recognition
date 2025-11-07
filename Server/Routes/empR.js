import express from "express";
import con from "../utils/db.js"; // PostgreSQL connection
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* ================================ 📸 Multer Setup for Image Uploads ================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/employee_images";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ================================ 🧾 Employee Registration ================================ */
router.post("/employee_register", upload.single("image"), async (req, res) => {
  const { name, email, password, position, address, category_id } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name || !email || !password || !position || !address || !category_id || !image) {
    return res.json({ Status: false, Error: "All fields are required" });
  }

  try {
    const checkSql = "SELECT * FROM employee WHERE email = $1";
    const { rows: existing } = await con.query(checkSql, [email]);
    if (existing.length > 0) {
      return res.json({ Status: false, Error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO employee 
      (name, email, password, position, address, category_id, image) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;

    const { rows } = await con.query(sql, [
      name,
      email,
      hashedPassword,
      position,
      address,
      category_id,
      image,
    ]);

    return res.json({
      Status: true,
      Message: "Employee registered successfully",
      id: rows[0].id,
    });
  } catch (err) {
    console.error("❌ Error registering employee:", err);
    return res.json({ Status: false, Error: "Database error: " + err.message });
  }
});

/* ================================ 🧩 TEMPORARY Registration (for face capture) ================================ */
router.post("/employee_register_temp", upload.single("image"), async (req, res) => {
  const { name, email, password, position, address, category_id } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!name || !email || !password || !position || !address || !category_id) {
    return res.json({ Status: false, Error: "All fields are required" });
  }

  try {
    // ✅ Check if email exists
    const checkSql = "SELECT * FROM employee WHERE email = $1";
    const { rows: existing } = await con.query(checkSql, [email]);
    if (existing.length > 0) {
      return res.json({ Status: false, Error: "Email already registered" });
    }

    // ✅ Insert temporary record
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO employee 
      (name, email, password, position, address, category_id, image, face_captured) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, false) RETURNING id`;

    const { rows } = await con.query(sql, [
      name,
      email,
      hashedPassword,
      position,
      address,
      category_id,
      image,
    ]);

    return res.json({
      Status: true,
      Message: "Temporary employee created for face capture",
      id: rows[0].id,
    });
  } catch (err) {
    console.error("❌ Error creating temp employee:", err);
    return res.json({ Status: false, Error: "Database error: " + err.message });
  }
});

/* ================================ ✅ FINALIZE Registration (after face capture) ================================ */
router.post("/employee_register_final/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 🔍 Check if employee exists
    const checkSql = "SELECT * FROM employee WHERE id = $1";
    const { rows } = await con.query(checkSql, [id]);

    if (rows.length === 0) {
      return res.json({ Status: false, Error: "Employee not found" });
    }

    const employee = rows[0];
    if (employee.face_captured) {
      return res.json({
        Status: false,
        Error: "Employee already finalized. Duplicate registration not allowed.",
      });
    }

    // ✅ Update record to mark face captured
    const updateSql = "UPDATE employee SET face_captured = true WHERE id = $1";
    await con.query(updateSql, [id]);

    return res.json({
      Status: true,
      Message: "Employee registration finalized successfully!",
    });
  } catch (err) {
    console.error("❌ Error finalizing employee:", err);
    return res.json({ Status: false, Error: "Database error: " + err.message });
  }
});

/* ================================ 🔐 Employee Login ================================ */
router.post("/employee_login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ loginStatus: false, Error: "Email and password required" });
  }

  try {
    const sql = "SELECT * FROM employee WHERE email = $1";
    const { rows } = await con.query(sql, [email]);

    if (rows.length === 0) {
      return res.json({ loginStatus: false, Error: "Invalid email or password" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ loginStatus: false, Error: "Incorrect password" });
    }

    const token = jwt.sign(
      { role: "employee", email: user.email, id: user.id },
      "jwt_secret_key",
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });

    return res.json({ loginStatus: true, id: user.id });
  } catch (err) {
    console.error("❌ Employee Login Error:", err);
    return res.json({ loginStatus: false, Error: "Server error: " + err.message });
  }
});

/* ================================ 👤 Get Employee Detail (with Salary + Category) ================================ */
router.get("/detail/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.json({ Status: false, Error: "Employee ID required" });

  try {
    const sql = `
      SELECT e.id, e.name, e.email, e.position, e.address, e.image, 
             c.name AS category_name, 
             COALESCE(s.salary, 0) AS salary
      FROM employee e
      LEFT JOIN category c ON e.category_id = c.id
      LEFT JOIN salary s ON e.id = s.emp_id
      WHERE e.id = $1
    `;
    const { rows } = await con.query(sql, [id]);

    if (rows.length === 0) {
      return res.json({ Status: false, Error: "Employee not found" });
    }

    return res.json({ Status: true, Result: rows[0] });
  } catch (err) {
    console.error("❌ Error fetching employee details:", err);
    return res.json({ Status: false, Error: "Query error: " + err.message });
  }
});

/* ================================ 🚪 Logout Employee ================================ */
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: true, Message: "Logged out successfully" });
});

/* ================================ 📷 Capture Face ================================ */
router.post("/capture_face", async (req, res) => {
  const { employee_id, image } = req.body;

  if (!employee_id || !image) return res.json({ Status: false, Error: "Missing data" });

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    await con.query(
      "INSERT INTO employee_captures (employee_id, image, captured_at) VALUES ($1, $2, NOW())",
      [employee_id, buffer]
    );

    const { rows } = await con.query(
      "SELECT COUNT(*) FROM employee_captures WHERE employee_id = $1",
      [employee_id]
    );

    if (parseInt(rows[0].count) >= 5) {
      await con.query("UPDATE employee SET face_captured = true WHERE id = $1", [employee_id]);
    }

    return res.json({ Status: true });
  } catch (err) {
    console.error("❌ Error in capture_face:", err);
    return res.json({ Status: false, Error: err.message });
  }
});

export { router as EmployeeRouter };

