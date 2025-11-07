import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Employee.css";

const AddEmployee = () => {
  const [employee, setEmployee] = useState({
    name: "",
    email: "",
    password: "",
    position: "",
    address: "",
    category_id: "",
    image: null,
  });
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [tempEmployeeId, setTempEmployeeId] = useState(null);
  const [count, setCount] = useState(0);
  const [streamStarted, setStreamStarted] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [preview, setPreview] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/category")
      .then((res) => {
        if (res.data.Status) setCategories(res.data.Result);
        else setError(res.data.Error);
      })
      .catch(() => setError("Failed to fetch categories"));
  }, []);

  const startCamera = async () => {
    setError("");
    setSuccessMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            setStreamStarted(true);
          } catch (playErr) {
            console.error("Play error:", playErr);
            setError("❌ Unable to play camera feed.");
          }
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("❌ Unable to access camera. Please allow permission and retry.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    setStreamStarted(false);
  };

  const captureFace = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    if (!streamStarted) {
      setError("Camera not started. Please allow permissions and retry.");
      return;
    }

    let currentId = tempEmployeeId;
    if (!currentId) {
      const tempForm = new FormData();
      Object.entries(employee).forEach(([key, value]) => {
        if (value) tempForm.append(key, value);
      });

      try {
        const res = await axios.post(
          "http://localhost:3000/employee/employee_register_temp",
          tempForm,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (res.data.Status && res.data.id) {
          setTempEmployeeId(res.data.id);
          currentId = res.data.id;
        } else {
          setError(res.data.Error || "Failed to start face capture.");
          return;
        }
      } catch (err) {
        console.error(err);
        setError("Server error while creating temp employee.");
        return;
      }
    }

    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");

    try {
      const res = await axios.post("http://localhost:3000/employee/capture_face", {
        employee_id: currentId,
        image: dataUrl,
      });

      if (res.data.Status) {
        setCount((prev) => {
          const newCount = prev + 1;
          setSuccessMsg(`✅ Saved Capture ${newCount}`);
          if (newCount === 5) {
            setSuccessMsg("✅ 5 Captures Completed! Click Done to Finish.");
          }
          return newCount;
        });
      } else {
        setError(res.data.Error || "❌ Capture failed.");
      }
    } catch (err) {
      console.error("Capture error:", err);
      setError("❌ Error saving face capture. Try again.");
    }
  };

  const doneCapture = () => {
    if (count < 5) {
      setError(`⚠️ Please capture at least 5 images (currently ${count}).`);
      return;
    }
    stopCamera();
    setCaptured(true);
    setSuccessMsg("✅ Face capture completed successfully!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!captured) {
      setError("⚠️ Please complete face capture before registration.");
      return;
    }
    if (!tempEmployeeId) {
      setError("⚠️ Missing temporary employee ID. Please re-capture face.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `http://localhost:3000/employee/employee_register_final/${tempEmployeeId}`
      );
      if (res.data.Status) {
        setSuccessMsg("🎉 Employee registered successfully!");

        // ✅ Refresh the page after showing success message
        setTimeout(() => {
          window.location.reload(); // refresh page
        }, 2000);
      } else {
        setError(res.data.Error || "Failed to register employee");
      }
    } catch (err) {
      console.error(err);
      setError("Server error during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setEmployee({ ...employee, image: file });
      setPreview(URL.createObjectURL(file));
    } else setEmployee({ ...employee, [name]: value });
  };

  return (
    <div className="ae-wrapper">
      {/* LEFT ORANGE PANEL */}
      <aside className="ae-left">
  <div className="ae-left-content">
    {/* Welcome text above the image */}
    <div className="ae-welcome-text">
      <h1>Welcome to Our Company</h1>
      <p>We’re happy to have you on board</p>
    </div>

    <div className="ae-sample-image">
      <img
        src="/src/assets/reg.jpg"
        alt="Registration Illustration"
        className="ae-reg-image"
      />
    </div>
  </div>

  <div className="ae-left-footer">
    <p>© {new Date().getFullYear()} Company Inc.</p>
  </div>
</aside>


      {/* RIGHT FORM + CAMERA PANEL */}
      <main className="ae-right">
        <h2 className="ae-title">Create Employee Account</h2>

        {error && <div className="ae-error">{error}</div>}
        {successMsg && <div className="ae-success">{successMsg}</div>}

        <div className="ae-content-grid">
          {/* Form Column */}
          <form className="ae-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={employee.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-field">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  value={employee.position}
                  onChange={handleChange}
                  placeholder="Enter position"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={employee.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>

              <div className="form-field">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={employee.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={employee.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                />
              </div>

              <div className="form-field">
                <label>Category</label>
                <select
                  name="category_id"
                  value={employee.category_id}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row single">
              <div className="form-field">
                <label>Profile Image</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleChange}
                />
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="preview-img"
                  />
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register Employee"}
              </button>
            </div>
          </form>

          {/* Camera Column */}
          <div className="ae-camera-column">
            <div className="camera-card">
              <div className="camera-header">
                <div className="camera-title">Face Camera</div>
                <div className="camera-sub">Use your phone or webcam</div>
              </div>

              <div className="camera-body">
                <div className="camera-frame">
                  {/* Video feed (rounded) */}
                  <video
                    ref={videoRef}
                    id="videoFeed"
                    width={480}
                    height={360}
                    autoPlay
                    playsInline
                    muted
                  />
                  {/* Canvas hidden for capture */}
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    style={{ display: "none" }}
                  />
                </div>

                <div className="camera-controls">
                  {!streamStarted && !captured && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="btn-orange-outline"
                    >
                      Start Camera
                    </button>
                  )}

                  <div className="camera-btns">
                    <button
                      type="button"
                      onClick={captureFace}
                      className="btn-capture"
                      disabled={!streamStarted}
                    >
                      Capture Image
                    </button>
                    <button
                      type="button"
                      onClick={doneCapture}
                      className="btn-done"
                    >
                      Done Capture
                    </button>
                  </div>

                  <div className="capture-info">
                    <p>
                      {count > 0
                        ? `✅ Saved Capture ${count} ${count === 5 ? "(All done!)" : ""}`
                        : "No captures yet"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="camera-footer">
                <small className="hint">Tip: Allow camera access when prompted.</small>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddEmployee;
