import os
import io
import cv2
import base64
import csv
import pickle
import numpy as np
import datetime
import mediapipe as mp
from flask import Flask, request, jsonify, render_template, send_file
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
import functools
print = functools.partial(print, flush=True)

# ======================================
# Flask and Database Configuration
# ======================================
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:12345@localhost/emp ms'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ======================================
# Database Models
# ======================================
class Employee(db.Model):
    __tablename__ = 'employee'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    department = db.Column(db.String(100))
    position = db.Column(db.String(100))

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'))
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# ======================================
# MediaPipe Setup
# ======================================
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1)

# ======================================
# Load Stored Face Embeddings
# ======================================
DB_FILE = "mediapipe_db.pkl"
if os.path.exists(DB_FILE):
    with open(DB_FILE, "rb") as f:
        mediapipe_db = pickle.load(f)
    print(f"[INFO] Loaded {len(mediapipe_db)} embeddings from {DB_FILE}")
else:
    print("[INFO] mediapipe_db.pkl not found. Recognition will return Unknown until DB is built.")
    mediapipe_db = {}

# ======================================
# Helper Functions
# ======================================
def get_embedding(image):
    """Extract a flattened face landmark vector using MediaPipe."""
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)
    if not results.multi_face_landmarks:
        return None
    for face_landmarks in results.multi_face_landmarks:
        pts = np.array([[lm.x, lm.y, lm.z] for lm in face_landmarks.landmark])
        return pts.flatten()
    return None

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

threshold = 0.5  # Minimum similarity to consider a match

# ======================================
# Routes
# ======================================
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/recognize', methods=['POST'])
def recognize():
    """Recognize face from uploaded image or base64 webcam frame."""
    print("\n[INFO] 🔹 /api/recognize endpoint called")

    image = None

    # 🧩 Step 1: Check if file upload
    if 'imagefile' in request.files:
        print("[INFO] 🔹 Image received via file upload")
        file = request.files['imagefile']
        npimg = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    # 🧩 Step 2: Check if base64 JSON
    elif request.is_json:
        print("[INFO] 🔹 Image received via base64 JSON")
        data = request.get_json()
        img_b64 = data.get('image_base64')
        if img_b64:
            print("[INFO] 🔹 Decoding base64 image data...")
            img_data = base64.b64decode(img_b64.split(',')[1])
            npimg = np.frombuffer(img_data, np.uint8)
            image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    # 🧩 Step 3: Validate image
    if image is None:
        print("[ERROR] ❌ No image received in the request")
        return jsonify({"error": "No image received"}), 400

    print("[INFO] 🔹 Image successfully decoded, extracting face embedding...")

    # 🧩 Step 4: Extract embedding
    emb = get_embedding(image)
    if emb is None:
        print("[WARN] ⚠️ No face detected in the image")
        return jsonify({"message": "No face detected"}), 200

    print("[INFO] 🔹 Face embedding extracted, comparing with database...")

    # 🧩 Step 5: Compare with database embeddings
    best_match = None
    best_score = -1

    for emp_id, info in mediapipe_db.items():
        db_emb = np.array(info["embedding"])
        score = cosine_similarity(emb, db_emb)
        if score > best_score:
            best_score = score
            best_match = emp_id

    print(f"[INFO] 🔹 Best match: {best_match}, Score: {best_score:.4f}")

    # 🧩 Step 6: Decision and attendance marking
    if best_score > threshold:
        emp = Employee.query.get(int(best_match))
        if emp:
            print(f"[ATTENDANCE] ✅ Marking attendance for {emp.name}")
            entry = Attendance(employee_id=emp.id)
            db.session.add(entry)
            db.session.commit()
            print(f"[INFO] ✅ Attendance recorded for {emp.name}")
            return jsonify({
                "employee_id": emp.id,
                "name": emp.name,
                "message": f"Attendance marked for {emp.name}",
                "score": float(best_score)
            })
        else:
            print("[ERROR] ❌ Employee ID not found in database")
    else:
        print("[INFO] ⚠️ No good match found, below threshold")

    return jsonify({"message": "Unknown face"}), 200


@app.route('/reports')
def reports():
    qtype = request.args.get('type', 'daily')
    if qtype == 'daily':
        date_str = request.args.get('date', datetime.date.today().isoformat())
        d = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        start = datetime.datetime(d.year, d.month, d.day)
        end = start + datetime.timedelta(days=1)
        title = f"Daily Report for {d.isoformat()}"
    else:
        return "Unsupported report type", 400

    rows = db.session.query(Attendance.employee_id, func.count(Attendance.id)) \
        .filter(Attendance.timestamp >= start, Attendance.timestamp < end) \
        .group_by(Attendance.employee_id).all()

    report = []
    for emp_id, cnt in rows:
        emp = Employee.query.get(emp_id)
        report.append({
            'employee_id': emp_id,
            'name': emp.name if emp else '',
            'count': int(cnt)
        })

    return render_template('reports.html', title=title, report=report)

@app.route('/export_csv')
def export_csv():
    rows = Attendance.query.order_by(Attendance.timestamp.desc()).all()
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['employee_id', 'name', 'timestamp'])
    for r in rows:
        emp = Employee.query.get(r.employee_id)
        cw.writerow([r.employee_id, emp.name if emp else '', r.timestamp.isoformat()])
    output = io.BytesIO()
    output.write(si.getvalue().encode('utf-8'))
    output.seek(0)
    return send_file(output, mimetype='text/csv', as_attachment=True, download_name='attendance.csv')

# ======================================
# Run Server
# ======================================
if __name__ == "__main__":
    print("🚀 Starting Flask Attendance System...", flush=True)
    print("🌐 Visit http://127.0.0.1:5000 in your browser", flush=True)
    app.run(host="0.0.0.0", port=5000, debug=True)

