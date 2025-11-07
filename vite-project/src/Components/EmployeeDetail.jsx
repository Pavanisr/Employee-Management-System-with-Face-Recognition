import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./employeeDetail.css";

const EmployeeDetail = () => {
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:3000/employee/detail/${id}`)
      .then((result) => {
        if (result.data.Status && result.data.Result) {
          setEmployee(result.data.Result);
        } else {
          setError(result.data.Error || "Employee not found");
        }
      })
      .catch(() => {
        setError("Failed to fetch employee details.");
      });
  }, [id]);

  const handleLogout = () => {
    axios
      .get("http://localhost:3000/employee/logout")
      .then((result) => {
        if (result.data.Status) {
          localStorage.removeItem("valid");
          navigate("/");
        }
      })
      .catch((err) => console.error("Logout error:", err));
  };

  if (error) {
    return (
      <div className="error-message">
        <h4>{error}</h4>
      </div>
    );
  }

  if (!employee) {
    return (
      <h4 className="loading-message">Loading employee details...</h4>
    );
  }

  return (
    <div className="employee-detail-container">
      <div className="detail-card">
        {/* Left side (profile) */}
        <div className="profile-section">
          <img
            src={
  employee.image
    ? `http://localhost:3000/uploads/employee_images/${employee.image}`
    : "https://via.placeholder.com/150"
}

            alt={employee.name}
            className="profile-img"
          />
          <h3 className="employee-name">{employee.name}</h3>
          <p className="employee-role">
            {employee.category_name || "Employee"}
          </p>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Right side (info) */}
        <div className="info-section">
          <h4>Information</h4>
          <div className="info-row">
            <p><strong>Email:</strong> {employee.email}</p>
            <p><strong>Address:</strong> {employee.address}</p>
          </div>

          <hr className="divider" />

          <h4>Job Details</h4>
          <div className="info-row">
            <p>
              <strong>Salary:</strong>{" "}
              {employee.salary ? `$${employee.salary}` : "Not assigned yet"}
            </p>
            <p>
              <strong>Category:</strong> {employee.category_name || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;
