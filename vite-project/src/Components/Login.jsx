import React, { useState } from 'react'
import './Login.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  axios.defaults.withCredentials = true;

  const handleSubmit = (event) => {
    event.preventDefault()
    axios.post('http://localhost:3000/auth/adminlogin', values)
      .then(result => {
        if (result.data.loginStatus) {
          localStorage.setItem("valid", true)
          navigate('/dashboard')
        } else {
          setError(result.data.Error)
        }
      })
      .catch(err => console.log(err))
  }

  return (
    <div className="login-page">
      <div className="left-side">
        <div className="overlay">
          <h1>Welcome to <span>My Dashboard</span></h1>
          <p>Login to access your account</p>
        </div>
      </div>
      <div className="right-side">
        <div className="login-form-container">
          <h2>Login</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter Email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter Password"
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="login-btn">Log In</button>
            <div className="checkbox">
              <input type="checkbox" id="agree" />
              <label htmlFor="agree">You agree with terms & conditions</label>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
