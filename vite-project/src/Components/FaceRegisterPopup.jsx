import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const FaceRegisterPopup = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [streamStarted, setStreamStarted] = useState(false);

  const employeeId = new URLSearchParams(window.location.search).get("id");

  // 🟢 Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreamStarted(true);
          setError("");
        }
      } catch (err) {
        console.error("Camera access error:", err);
        if (err.name === "NotAllowedError") {
          setError("❌ Camera permission denied. Please allow camera access.");
        } else if (err.name === "NotFoundError") {
          setError("❌ No webcam found on this device.");
        } else {
          setError("⚠️ Unable to access camera. Please check your browser.");
        }
      }
    };

    startCamera();

    // 🧹 Cleanup on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 🟣 Capture face frame
  const captureFace = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    if (!streamStarted) {
      setError("Camera not started. Please allow permissions and retry.");
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");

    try {
      await axios.post("http://localhost:3000/employee/capture_face", {
        employee_id: employeeId,
        image: dataUrl,
      });

      const nextCount = count + 1;
      setCount(nextCount);

      if (nextCount >= 5) {
        alert("✅ Captured 5 face images successfully!");
        window.opener.postMessage("CAPTURE_DONE", "*");
        window.close();
      }
    } catch (err) {
      console.error("Capture error:", err);
      setError("❌ Error saving face capture. Try again.");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>📸 Capture 5 Face Images</h2>

      {error && (
        <div style={{ color: "red", fontWeight: "bold", marginBottom: "10px" }}>
          {error}
        </div>
      )}

      <video
        ref={videoRef}
        width={640}
        height={480}
        autoPlay
        playsInline
        muted
        style={{
          border: "2px solid black",
          borderRadius: "10px",
          backgroundColor: "#000",
          marginBottom: "10px",
        }}
        onClick={() => {
          if (!streamStarted) {
            navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
              videoRef.current.srcObject = s;
              videoRef.current.play();
              setStreamStarted(true);
            });
          }
        }}
      />

      <canvas ref={canvasRef} width={640} height={480} style={{ display: "none" }} />

      <div>
        <button
          onClick={captureFace}
          disabled={!streamStarted}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: streamStarted ? "pointer" : "not-allowed",
          }}
        >
          Capture
        </button>
        <p>{count}/5 Captures</p>
      </div>
    </div>
  );
};

export default FaceRegisterPopup;
