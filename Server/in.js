import express from "express";
import cors from "cors";
import { adminRouter } from "./Routes/AdminRoute.js";
import { EmployeeRouter } from "./Routes/EmployeeRoute.js";
import Jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import './utils/db.js';

const app = express();

app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ['GET', 'POST', 'PUT', "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" })); // for base64 images
app.use(cookieParser());
app.use(express.static('Public'));

app.use('/auth', adminRouter);
app.use('/employee', EmployeeRouter);

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    Jwt.verify(token, "jwt_secret_key", (err, decoded) => {
      if (err) return res.json({ Status: false, Error: "Wrong Token" });
      req.id = decoded.id;
      req.role = decoded.role;
      next();
    });
  } else {
    return res.json({ Status: false, Error: "Not authenticated" });
  }
};

app.get('/verify', verifyUser, (req, res) => {
  return res.json({ Status: true, role: req.role, id: req.id });
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
