import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./attendance.css"; // optional custom styling

const AttendanceDashboard = () => {
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch attendance data from backend
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
       const res = await axios.get("http://localhost:3000/auth/attendance", { withCredentials: true });



        // 👆 Replace with your actual backend API URL
        if (res.data.Status && res.data.Result) {
  setAttendanceData(res.data.Result || {});

} else {
  setError("No attendance data found.");
}

        setLoading(false);
      } catch (err) {
        console.error("Error fetching attendance data:", err);
        setError("Failed to load attendance data.");
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  if (loading)
    return (
      <h4 className="text-center mt-5 text-secondary">
        Loading attendance data...
      </h4>
    );

  if (error)
    return (
      <h4 className="text-center mt-5 text-danger">{error}</h4>
    );

  return (
    <div className="container mt-4">
      {/* 🔙 Back Button */}
      <div className="mb-4 text-start">
        <button
          onClick={() => navigate("/dashboard")}
          className="btn btn-secondary btn-sm"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Page Title */}
      <h2 className="text-center mb-4 text-success fw-bold">
        Employee Attendance Dashboard
      </h2>

      {/* Attendance Display */}
      {weekdays.map((day) => (
        <div
          key={day}
          className="mb-4 p-3 border rounded-3 shadow-sm bg-light"
        >
          <h4 className="text-primary mb-3">
            {day}{" "}
            <small className="text-muted">
              ({attendanceData[day]?.length || 0} employees)
            </small>
          </h4>

          {attendanceData[day] && attendanceData[day].length > 0 ? (
            <ul className="list-group">
              {attendanceData[day].map((emp, index) => (
                <li
                  key={index}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>{emp.name}</span>
                  <span className="badge bg-secondary">ID: {emp.id}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No employees attended on {day}.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default AttendanceDashboard;
