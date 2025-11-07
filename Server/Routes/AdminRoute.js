import express from "express";
import pool from "../utils/db.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";

const router = express.Router();

/* ============================
   🔑 ADMIN LOGIN (TEMPORARY: allows plain text)
============================ */
router.post("/adminlogin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const query = "SELECT * FROM admin WHERE email = $1";
    const { rows } = await pool.query(query, [email]);

    if (rows.length === 0)
      return res.json({ loginStatus: false, Error: "Invalid email or password" });

    const admin = rows[0];

    // ✅ Temporarily allow plain-text OR bcrypt password
    let passwordMatch = false;
    try {
      // Try bcrypt compare first
      passwordMatch = await bcrypt.compare(password, admin.password);
    } catch (err) {
      passwordMatch = false;
    }

    // ✅ Fallback to plain text match (temporary)
    if (!passwordMatch && admin.password === password) {
      passwordMatch = true;
      console.warn("⚠️ Admin logged in using plain-text password (TEMPORARY MODE)");
    }

    if (!passwordMatch)
      return res.json({ loginStatus: false, Error: "Invalid email or password" });

    const token = jwt.sign(
      { role: "admin", email: admin.email, id: admin.id },
      process.env.JWT_SECRET || "jwt_secret_key",
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ loginStatus: true });
  } catch (err) {
    console.error("Admin Login Error:", err);
    return res.json({ loginStatus: false, Error: "Query error: " + err.message });
  }
});

/* ============================
   📂 CATEGORY ROUTES
============================ */
router.get("/category", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM category ORDER BY id ASC");
    return res.json({ Status: true, Result: rows });
  } catch (err) {
    return res.json({ Status: false, Error: "Query Error: " + err.message });
  }
});

router.post("/add_category", async (req, res) => {
  try {
    const { category } = req.body;
    if (!category?.trim())
      return res.json({ Status: false, Error: "Category name is required" });

    await pool.query("INSERT INTO category (name) VALUES ($1)", [category]);
    return res.json({ Status: true, Message: "Category added successfully" });
  } catch (err) {
    return res.json({ Status: false, Error: "Query Error: " + err.message });
  }
});

/* ============================
   🖼️ IMAGE UPLOAD CONFIG
============================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "Public/Images"),
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* ============================
   👩‍💼 ADD EMPLOYEE
============================ */
router.post("/add_employee", upload.single("image"), async (req, res) => {
  try {
    const { name, email, password, address, salary, category_id } = req.body;
    if (!name || !email || !password)
      return res.json({ Status: false, Error: "Name, email, and password are required" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO employee (name, email, password, address, salary, image, category_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const { rows } = await pool.query(sql, [
      name,
      email,
      hashedPassword,
      address || "",
      salary || 0,
      req.file ? req.file.filename : null,
      category_id || null,
    ]);

    const empId = rows[0].id;

    await pool.query(`INSERT INTO salary (emp_id, salary) VALUES ($1, $2)`, [
      empId,
      salary || 0,
    ]);

    return res.json({ Status: true, Message: "Employee added successfully" });
  } catch (err) {
    return res.json({ Status: false, Error: "Query Error: " + err.message });
  }
});

/* ============================
   👀 EMPLOYEE ROUTES
============================ */
router.get("/employee", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        e.id,
        e.name,
        e.email,
        e.address,
        e.category_id,
        c.name AS category_name,
        s.emp_id AS salary_emp_id,
        s.salary
      FROM employee e
      LEFT JOIN category c ON e.category_id = c.id
      LEFT JOIN salary s ON s.emp_id = e.id
      ORDER BY e.id ASC
    `);
    return res.json({ Status: true, Result: rows });
  } catch (err) {
    return res.json({ Status: false, Error: "Query Error: " + err.message });
  }
});

router.get("/employee/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM employee WHERE id = $1", [
      req.params.id,
    ]);
    return res.json({ Status: true, Result: rows });
  } catch (err) {
    return res.json({ Status: false, Error: "Query Error: " + err.message });
  }
});

/* ============================
   💰 SALARY ROUTES
============================ */
router.get("/salary/:id", async (req, res) => {
  try {
    const salaryId = req.params.id;
    let { rows } = await pool.query(`
      SELECT 
        s.emp_id, 
        s.salary, 
        e.name, 
        c.name AS category_name
      FROM salary s
      JOIN employee e ON s.emp_id = e.id
      LEFT JOIN category c ON e.category_id = c.id
      WHERE s.emp_id = $1
    `, [salaryId]);

    if (rows.length === 0) {
      const empRes = await pool.query(`
        SELECT 
          e.id AS emp_id, 
          e.name, 
          c.name AS category_name
        FROM employee e
        LEFT JOIN category c ON e.category_id = c.id
        WHERE e.id = $1
      `, [salaryId]);

      if (empRes.rows.length === 0)
        return res.json({ Status: false, Error: "Employee or salary record not found" });

      rows = empRes.rows.map(e => ({
        ...e,
        salary: 0
      }));
    }

    return res.json({ Status: true, Result: rows });
  } catch (err) {
    return res.json({ Status: false, Error: "Query Error: " + err.message });
  }
});

router.put("/edit_salary/:id", async (req, res) => {
  try {
    const { salary } = req.body;
    if (salary === undefined || salary === null)
      return res.json({ Status: false, Error: "Salary value is required" });

    const empId = req.params.id;
    const updateResult = await pool.query(
      `UPDATE salary SET salary = $1 WHERE emp_id = $2 RETURNING *`,
      [salary, empId]
    );

    if (updateResult.rowCount > 0)
      return res.json({ Status: true, Message: "✅ Salary updated successfully" });

    const empCheck = await pool.query(`SELECT id FROM employee WHERE id = $1`, [empId]);
    if (empCheck.rowCount === 0)
      return res.json({ Status: false, Error: "Employee not found" });

    await pool.query(`INSERT INTO salary (emp_id, salary) VALUES ($1, $2)`, [
      empId,
      salary,
    ]);

    return res.json({ Status: true, Message: "✅ Salary added successfully" });
  } catch (err) {
    return res.json({ Status: false, Error: "Query Error: " + err.message });
  }
});

/* ============================
   📊 DASHBOARD DETAILS
============================ */
router.get("/dashboard", async (req, res) => {
  try {
    const adminCountQuery = pool.query("SELECT COUNT(id) AS admin_count FROM admin");
    const employeeCountQuery = pool.query("SELECT COUNT(id) AS employee_count FROM employee");
    const salarySumQuery = pool.query("SELECT COALESCE(SUM(salary), 0) AS total_salary FROM salary");
    const adminListQuery = pool.query("SELECT id, email FROM admin ORDER BY id ASC");

    const [adminCountRes, employeeCountRes, salarySumRes, adminListRes] = await Promise.all([
      adminCountQuery,
      employeeCountQuery,
      salarySumQuery,
      adminListQuery,
    ]);

    return res.json({
      Status: true,
      Result: {
        adminCount: adminCountRes.rows[0].admin_count,
        employeeCount: employeeCountRes.rows[0].employee_count,
        totalSalary: salarySumRes.rows[0].total_salary,
        admins: adminListRes.rows,
      },
    });
  } catch (err) {
    return res.json({ Status: false, Error: "Query Error: " + err.message });
  }
});

/* ============================
   🗓️ ATTENDANCE DASHBOARD ROUTE
============================ */
router.get("/attendance", async (req, res) => {
  try {
    // 1️⃣ Fetch all attendance records (recent 30 days)
   const query = `
  SELECT e.id, e.name, a.date, a.time, a.status
  FROM attendance a
  JOIN employee e ON a.employee_id = e.id
  WHERE a.date >= CURRENT_DATE - INTERVAL '2 years'
  ORDER BY a.date DESC, e.id;
`;

    const { rows } = await pool.query(query);

    // 2️⃣ Group attendance data by weekday
    const attendanceByDay = {};
    const weekdayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    rows.forEach((row) => {
      const day = weekdayNames[new Date(row.date).getDay()];
      if (!attendanceByDay[day]) attendanceByDay[day] = [];
      attendanceByDay[day].push({
        id: row.id,
        name: row.name,
        date: row.date,
        time: row.time,
        status: row.status,
      });
    });

    // 3️⃣ Return formatted data
    return res.json({
      Status: true,
      Result: attendanceByDay,
    });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    return res.json({ Status: false, Error: "Query Error: " + err.message });
  }
});


/* ============================
   🚪 LOGOUT
============================ */
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: true, Message: "Logged out successfully" });
});

export { router as adminRouter };
