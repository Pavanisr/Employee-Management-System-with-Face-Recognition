import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import axios from "axios";
import "./Dashboard.css"; // <-- Add this line

const Dashboard = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [counts, setCounts] = useState({
    adminCount: 0,
    employeeCount: 0,
    totalSalary: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get("http://localhost:3000/auth/dashboard");
        if (res.data.Status) {
          const { adminCount, employeeCount, totalSalary, admins } = res.data.Result;
          setCounts({ adminCount, employeeCount, totalSalary });
          setAdmins(admins);
        } else {
          setError(res.data.Error || "Error loading dashboard data");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Check server logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = () => {
    axios.get("http://localhost:3000/auth/logout").then((result) => {
      if (result.data.Status) {
        localStorage.removeItem("valid");
        navigate("/");
      }
    });
  };

  return (
    <div className="dashboard-container container-fluid">
      <div className="row flex-nowrap">
        {/* Sidebar */}
        <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 sidebar">
          <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100">
            <Link
              to="/dashboard"
              className="d-flex align-items-center pb-3 mb-md-1 mt-md-3 me-md-auto text-white text-decoration-none"
            >
              <span className="fs-5 fw-bolder d-none d-sm-inline">
                Employee MS
              </span>
            </Link>

            <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start">
              <li className="w-100">
                <Link to="/dashboard" className="nav-link px-0 align-middle">
                  <i className="fs-4 bi-speedometer2 ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Dashboard</span>
                </Link>
              </li>
              <li className="w-100">
                <Link to="/employee" className="nav-link px-0 align-middle">
                  <i className="fs-4 bi-people ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Manage Employees</span>
                </Link>
              </li>
              <li className="w-100">
                <Link to="/dashboard/category" className="nav-link px-0 align-middle">
                  <i className="fs-4 bi-columns ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Category</span>
                </Link>
              </li>
              <li className="w-100">
                <Link to="/attendance" className="nav-link px-0 align-middle">
                  <i className="fs-4 bi-calendar-check ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Attendance</span>
                </Link>
              </li>
              <li className="w-100">
                <button
                  className="nav-link border-0 bg-transparent px-0 align-middle logout-btn"
                  onClick={handleLogout}
                >
                  <i className="fs-4 bi-power ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="col p-0 m-0 main-content">
          <div className="p-3 d-flex justify-content-center shadow header">
            <h4>Employee Management System</h4>
          </div>

          <div className="container mt-5">
            {loading ? (
              <div className="text-center mt-5 text-light">Loading dashboard...</div>
            ) : error ? (
              <div className="alert alert-danger text-center">{error}</div>
            ) : (
              <>
                {/* Counts */}
                <div className="row text-center">
                  <div className="col-md-4 mb-3">
                    <div className="card stat-card bg-orange shadow-lg">
                      <i className="bi bi-person-lock fs-1 mb-2"></i>
                      <h5>Total Admins</h5>
                      <h2>{counts.adminCount}</h2>
                    </div>
                  </div>

                  <div className="col-md-4 mb-3">
                    <div className="card stat-card bg-dark-orange shadow-lg">
                      <i className="bi bi-people-fill fs-1 mb-2"></i>
                      <h5>Total Employees</h5>
                      <h2>{counts.employeeCount}</h2>
                    </div>
                  </div>

                  <div className="col-md-4 mb-3">
                    <div className="card stat-card bg-black-orange shadow-lg">
                      <i className="bi bi-cash-coin fs-1 mb-2"></i>
                      <h5>Total Salary</h5>
                      <h2>${counts.totalSalary}</h2>
                    </div>
                  </div>
                </div>

                {/* Admin Table */}
                <div className="mt-5 admin-table-container">
                  <h5 className="text-center mb-3 text-light">List of Registered Admins</h5>
                  <table className="table table-dark table-bordered table-striped shadow-sm">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.length > 0 ? (
                        admins.map((admin) => (
                          <tr key={admin.id}>
                            <td>{admin.id}</td>
                            <td>{admin.email}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center">
                            No admins found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
