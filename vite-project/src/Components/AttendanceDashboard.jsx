import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import "./attendance.css";

const COLORS = ["#FF8C00", "#FFB84D", "#333333", "#666666"];

const AttendanceDashboard = () => {
  const [stats, setStats] = useState({
    employees: 0,
    present: 0,
    absent: 0,
    late: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch attendance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:3000/auth/attendance");
        if (res.data.Status && res.data.Result) {
          const result = res.data.Result;
          const allDays = Object.values(result).flat();

          const employees = [...new Set(allDays.map((r) => r.id))].length;
          const present = allDays.filter((r) => r.status === "Present").length;
          const absent = allDays.filter((r) => r.status === "Absent").length;
          const late = allDays.filter((r) => r.status === "Late").length;

          setStats({ employees, present, absent, late });
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
    fetchData();
  }, []);

  if (loading) return <h4 className="loading-msg">Loading attendance data...</h4>;
  if (error) return <h4 className="error-msg">{error}</h4>;

  // Dummy data for 7-day / monthly / late visualization
  const absentee7Days = [
    { name: "Jan 01", value: 2 },
    { name: "Jan 02", value: 1 },
    { name: "Jan 03", value: 3 },
    { name: "Jan 04", value: 2 },
    { name: "Jan 05", value: 1 },
    { name: "Jan 06", value: 0 },
    { name: "Jan 07", value: 2 },
  ];

  const absenteeByMonth = [
    { name: "Jan", value: 5 },
    { name: "Feb", value: 3 },
    { name: "Mar", value: 2 },
  ];

  const late7Days = [
    { name: "Jan 01", value: 1 },
    { name: "Jan 02", value: 2 },
    { name: "Jan 03", value: 3 },
    { name: "Jan 04", value: 1 },
    { name: "Jan 05", value: 2 },
    { name: "Jan 06", value: 0 },
    { name: "Jan 07", value: 1 },
  ];

  return (
    <div className="attendance-dashboard">
      <h2 className="dashboard-title">
        Employee Management System Dashboard with Attendance Calculation
      </h2>

      {/* Summary Cards */}
      <div className="summary-cards">
        <SummaryCard icon="👥" label="Employees" value={stats.employees} />
        <SummaryCard icon="✅" label="Present" value={stats.present} />
        <SummaryCard icon="❌" label="Absent" value={stats.absent} />
        <SummaryCard icon="⏰" label="Late Comers" value={stats.late} />
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <ChartCard title="Absentees – Last 7 Days" data={absentee7Days} />
        <ChartCard title="Absentees – by Month" data={absenteeByMonth} />
        <ChartCard title="Late Comers – Last 7 Days" data={late7Days} />
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, label, value }) => (
  <div className="summary-card">
    <div className="icon">{icon}</div>
    <div className="label">{label}</div>
    <div className="value">{value}</div>
  </div>
);

const ChartCard = ({ title, data }) => (
  <div className="chart-card">
    <h5>{title}</h5>
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={5}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default AttendanceDashboard;
