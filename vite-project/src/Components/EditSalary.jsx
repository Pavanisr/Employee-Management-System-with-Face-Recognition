// src/pages/EditSalary.jsx
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./employeeDetail.css"; // 👈 use same theme file

const EditSalary = () => {
  const { id } = useParams();
  const [salaryData, setSalaryData] = useState({
    emp_id: "",
    name: "",
    position: "",
    salary: "",
    category_name: "",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:3000/auth/salary/${id}`)
      .then((result) => {
        if (result.data.Status && result.data.Result.length > 0) {
          const data = result.data.Result[0];
          setSalaryData({
            emp_id: data.emp_id,
            name: data.name,
            position: data.position,
            salary: data.salary || "",
            category_name: data.category_name,
          });
        } else {
          alert(result.data.Error || "Salary record not found");
          navigate("/employee");
        }
      })
      .catch((err) => {
        console.error("❌ Salary Fetch Error:", err);
        alert("Error fetching salary details");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`http://localhost:3000/auth/edit_salary/${id}`, {
        salary: salaryData.salary,
      })
      .then((result) => {
        if (result.data.Status) {
          alert("✅ Salary updated successfully!");
          navigate("/employee");
        } else {
          alert(result.data.Error || "Failed to update salary");
        }
      })
      .catch((err) => {
        console.error("❌ Salary Update Error:", err);
        alert("Error updating salary");
      });
  };

  if (loading)
    return (
      <h4 className="text-center mt-5 text-light">Loading salary details...</h4>
    );

  return (
    <div className="modal-overlay">
      <div className="salary-modal">
        <div className="modal-header">
          <h3>Edit Salary</h3>
          <button
            className="close-btn"
            onClick={() => navigate("/employee")}
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="salary-form">
          <div className="form-group">
            <label>Employee ID</label>
            <input type="text" value={salaryData.emp_id} disabled />
          </div>

          <div className="form-group">
            <label>Name</label>
            <input type="text" value={salaryData.name} disabled />
          </div>

          <div className="form-group">
            <label>Position</label>
            <input type="text" value={salaryData.position} disabled />
          </div>

          <div className="form-group">
            <label>Category</label>
            <input type="text" value={salaryData.category_name} disabled />
          </div>

          <div className="form-group">
            <label>Salary</label>
            <input
              type="number"
              value={salaryData.salary}
              onChange={(e) =>
                setSalaryData({ ...salaryData, salary: e.target.value })
              }
              required
            />
          </div>

          <button type="submit" className="btn update-btn">
            💾 Update Salary
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditSalary;
