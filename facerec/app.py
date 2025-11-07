import os
import cv2
import base64
import pickle
import numpy as np
import datetime
import mediapipe as mp
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func

# ==========================
# Flask and Database Setup
# ==========================
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:12345@localhost/emp_ms'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ==========================
# Database Models
# ==========================
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

# ==========================
# MediaPipe Setup
# ==========================
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1)

# ==========================
# Load Face Embeddings
# ==========================
DB_FILE = "mediapipe_db.pkl"
if os.path.exists(DB_FILE):
    with open(DB_FILE, "rb") as f:
        mediapipe_db = pickle.load(f)
    print(f"[INFO] Loaded {len(mediapipe_db)} embeddings from {DB_FILE}")
else:
    print("[INFO] mediapipe_db.pkl not found. Recognition will return Unknown until DB is built.")
    mediapipe_db = {}

db_ids = list(mediapipe_db.keys())
db_embeddings = np.array([np.array(info["embedding"]) for info in mediapipe_db.values()])
threshold = 0.5  # Cosine similarity threshold

# ==========================
# Helper Functions
# ==========================
def get_embedding(image):
    """Extract flattened face landmarks using MediaPipe."""
    image = cv2.resize(image, (320, 240))  # Reduce processing time
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)
    if not results.multi_face_landmarks:
        return None
    face_landmarks = results.multi_face_landmarks[0]
    pts = np.array([[lm.x, lm.y, lm.z] for lm in face_landmarks.landmark])
    return pts.flatten()

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# ==========================
# Routes
# ==========================
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/recognize', methods=['POST'])
def recognize():
    print("\n[INFO] /api/recognize called")
    image = None

    if request.is_json:
        data = request.get_json()
        img_b64 = data.get('image_base64')
        if img_b64:
            img_data = base64.b64decode(img_b64.split(',')[1])
            npimg = np.frombuffer(img_data, np.uint8)
            image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    if image is None:
        print("[ERROR] No image received")
        return jsonify({"error": "No image received"}), 400

    print("[INFO] Extracting face embedding...")
    emb = get_embedding(image)
    if emb is None:
        print("[WARN] No face detected")
        return jsonify({"message": "No face detected"}), 200

    print("[INFO] Comparing with database embeddings...")
    scores = np.dot(db_embeddings, emb) / (np.linalg.norm(db_embeddings, axis=1) * np.linalg.norm(emb))
    best_idx = np.argmax(scores)
    best_score = scores[best_idx]
    best_match = db_ids[best_idx] if len(db_ids) > 0 else None

    print(f"[INFO] Best match: {best_match}, Score: {best_score:.4f}")

    if best_score > threshold and best_match is not None:
        emp = Employee.query.get(int(best_match))
        if emp:
            print(f"[ATTENDANCE] Marking attendance for {emp.name}")
            entry = Attendance(employee_id=emp.id)
            db.session.add(entry)
            db.session.commit()
            print(f"[INFO] Attendance recorded for {emp.name}")
            return jsonify({
                "employee_id": emp.id,
                "name": emp.name,
                "message": f"Attendance marked for {emp.name}",
                "score": float(best_score)
            })

    print("[INFO] Unknown face")
    return jsonify({"message": "Unknown face"}), 200

@app.route('/reports')
def reports():
    date_str = request.args.get('date', datetime.date.today().isoformat())
    d = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
    start = datetime.datetime(d.year, d.month, d.day)
    end = start + datetime.timedelta(days=1)
    title = f"Daily Report for {d.isoformat()}"

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
    import io, csv
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['employee_id', 'name', 'timestamp'])
    for r in rows:
        emp = Employee.query.get(r.employee_id)
        cw.writerow([r.employee_id, emp.name if emp else '', r.timestamp.isoformat()])
    output = io.BytesIO()
    output.write(si.getvalue().encode('utf-8'))
    output.seek(0)
    from flask import send_file
    return send_file(output, mimetype='text/csv', as_attachment=True, download_name='attendance.csv')

# ==========================
# Run Server
# ==========================
if __name__ == '__main__':
    print("🚀 Starting Flask Attendance System...")
    app.run(host='0.0.0.0', port=5000, debug=True)
