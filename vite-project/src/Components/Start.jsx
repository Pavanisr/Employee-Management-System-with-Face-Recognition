import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Start.css";
import salaryImage from "../assets/image.png";

const Start = () => {
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:3000/verify")
      .then((result) => {
        if (result.data.Status) {
          if (result.data.role === "admin") {
            navigate("/dashboard");
          } else {
            navigate("/employee_detail/" + result.data.id);
          }
        }
      })
      .catch((err) => console.log(err));
  }, [navigate]);

  return (
    <>
      {/* 🧭 Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <h2 className="logo" onClick={() => navigate("/")}>
            Employee<span>Portal</span>
          </h2>

          <div className={`nav-links ${menuOpen ? "open" : ""}`}>
            <button onClick={() => navigate("/")} className="nav-btn">
              Home
            </button>
            <a href="#about" className="nav-btn">
              About
            </a>
            <a href="#contact" className="nav-btn">
              Contact
            </a>
            <button onClick={() => navigate("/attendance")} className="nav-btn">
              Attendance
            </button>

            <div className="login-dropdown">
              <button
                className="nav-btn"
                onClick={() => setLoginOpen(!loginOpen)}
              >
                Login {loginOpen ? "▲" : "▼"}
              </button>

              {loginOpen && (
                <div className="dropdown-content show">
                  <button onClick={() => navigate("/adminlogin")}>
                    As Admin
                  </button>
                  <button onClick={() => navigate("/employee_login")}>
                    As Employee
                  </button>
                </div>
              )}
            </div>

            <button
              className="get-started"
              onClick={() => navigate("/add_employee")}
            >
              New Employee
            </button>
          </div>

          <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✖" : "☰"}
          </div>
        </div>
      </nav>

      {/* 🖼️ Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1>All-in-One Employee Hub</h1>
          <p>
            Your centralized platform for managing employees, departments, and
            performance — built for speed, accuracy, and control.
          </p>
        </div>
      </header>

      {/* 💼 Info Cards Section */}
      <section className="card-container">
        <div className="card">
          <img
            src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80"
            alt="Employee Management"
          />
          <h4>Employee Management</h4>
          <p>
            Manage all employee data and records efficiently in one secure
            place, reducing manual effort and errors.
          </p>
        </div>

        <div className="card">
          <img src={salaryImage} alt="Salary Analytics" />
          <h4>Salary Management</h4>
          <p>
            Track and manage employee salaries, bonuses, and deductions with
            accuracy and ease.
          </p>
        </div>

        <div className="card">
          <img
            src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80"
            alt="Leave Management"
          />
          <h4>Leave Management</h4>
          <p>
            Simplify leave tracking and approvals, ensuring transparency and
            better workforce planning.
          </p>
        </div>
      </section>

      {/* 🧠 About Us Section */}
      <section id="about" className="about-section">
        <div className="about-content">
          <div className="about-text">
            <h2>About Us</h2>
            <p>
              We combine innovation with human-centric design to create
              intelligent employee management systems. Our platform simplifies
              complex HR tasks while improving collaboration, efficiency, and
              data-driven decision-making.
            </p>
            <div className="about-stats">
              <div>
                <h3>20,123+</h3>
                <p>Employees Managed</p>
              </div>
              <div>
                <h3>1,400+</h3>
                <p>Active Users</p>
              </div>
              <div>
                <h3>13,560+</h3>
                <p>Projects Tracked</p>
              </div>
            </div>
          </div>
          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80"
              alt="Team Collaboration"
            />
          </div>
        </div>
      </section>

      {/* 📬 Contact Section */}
      <section id="contact" className="contact-section">
        <h2>Contact Us</h2>
        <div className="contact-container">
          <form className="contact-form">
            <input type="text" placeholder="Full Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" required></textarea>
            <button type="submit">Submit</button>
          </form>

          <div className="contact-info">
            <div>
              <h4>📍 Location</h4>
              <p>123 Innovation Street, Colombo</p>
            </div>
            <div>
              <h4>✉️ Email</h4>
              <p>support@employeeportal.com</p>
            </div>
            <div>
              <h4>📞 Phone</h4>
              <p>+94 70 234 56998</p>
            </div>
          </div>
        </div>
      </section>

      {/* ⚫ Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} EmployeePortal | All rights reserved</p>
      </footer>
    </>
  );
};

export default Start;
