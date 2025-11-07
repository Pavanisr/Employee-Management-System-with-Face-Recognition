import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./employeeDetail.css"; // add CSS for theme

const Employee = () => {
  const [employee, setEmployee] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/employee")
      .then((result) => {
        if (result.data.Status) {
          setEmployee(result.data.Result);
        } else {
          alert(result.data.Error);
        }
      })
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      axios
        .delete(`http://localhost:3000/auth/delete_employee/${id}`)
        .then((result) => {
          if (result.data.Status) {
            alert("Employee deleted successfully");
            setEmployee((prev) => prev.filter((emp) => emp.id !== id));
          } else {
            alert(result.data.Error);
          }
        })
        .catch((err) => console.error("Error deleting employee:", err));
    }
  };

  const handleAddSalary = (emp_id) => {
    navigate(`/employee/edit_salary/${emp_id}`);
  };

  return (
    <div className="employee-container">
      {/* 🔙 Back Button */}
      <div className="employee-header">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          ← Back to Dashboard
        </button>
        <h2 className="employee-title">Employee List</h2>
      </div>

      {/* Employee Table */}
      <div className="table-wrapper">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Category</th>
              <th>Salary</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employee.length > 0 ? (
              employee.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.email}</td>
                  <td>{e.address}</td>
                  <td>{e.category_name || "-"}</td>
                  <td>{e.salary !== null ? e.salary : "N/A"}</td>
                  <td>
                    {e.salary_emp_id ? (
                      <Link
                        to={`/employee/edit_salary/${e.id}`}
                        className="btn edit-btn"
                      >
                        Edit Salary
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleAddSalary(e.id)}
                        className="btn add-btn"
                      >
                        Add Salary
                      </button>
                    )}
                    <button
                      className="btn delete-btn"
                      onClick={() => handleDelete(e.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employee;
