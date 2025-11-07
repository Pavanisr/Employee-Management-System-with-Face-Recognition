import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages & Components
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import Home from './Components/Home';
import Employee from './Components/Employee';
import Category from './Components/Category';
import AttendanceDashboard from './Components/AttendanceDashboard';
import AddCategory from './Components/AddCategory';
import AddEmployee from './Components/AddEmployee';
import EditSalary from './Components/EditSalary';
import Start from './Components/Start';
import EmployeeLogin from './Components/EmployeeLogin';
import EmployeeDetail from './Components/EmployeeDetail';
import PrivateRoute from './Components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🌐 Public Pages */}
        <Route path='/' element={<Start />} />
        <Route path='/adminlogin' element={<Login />} />
        <Route path='/employee_login' element={<EmployeeLogin />} />
        <Route path='/employee_detail/:id' element={<EmployeeDetail />} />
        <Route path='/add_employee' element={<AddEmployee />} />

        {/* 👩‍💼 Employee Section (Outside Dashboard) */}
        <Route path='/employee' element={<Employee />} />
        <Route path='/employee/edit_salary/:id' element={<EditSalary />} />

        {/* 🗓️ Attendance Page (Separate) */}
        <Route path='/attendance' element={<AttendanceDashboard />} />

        {/* 🧭 Admin Dashboard */}
        <Route path='/dashboard' element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }>
          <Route path='' element={<Home />} />
          <Route path='category' element={<Category />} />
          <Route path='add_category' element={<AddCategory />} />
          {/* <Route path='edit_employee/:id' element={<EditEmployee />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
