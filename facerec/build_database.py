import psycopg2, pickle, numpy as np, mediapipe as mp, cv2
from io import BytesIO
from PIL import Image
import base64

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname="emp ms",
    user="postgres",
    password="12345",
    host="localhost",
    port="5432"
)
cur = conn.cursor()

mp_face_mesh = mp.solutions.face_mesh

def get_embedding(landmarks):
    emb = np.array([(pt.x, pt.y, pt.z) for pt in landmarks.landmark]).flatten()
    emb = emb / np.linalg.norm(emb)
    return emb

# Get all employee captures
cur.execute("SELECT employee_id, image FROM employee_captures")
rows = cur.fetchall()

db = {}
with mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1,
                           refine_landmarks=True, min_detection_confidence=0.5) as face_mesh:
    for emp_id, img_bytes in rows:
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            continue
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        result = face_mesh.process(rgb)
        if not result.multi_face_landmarks:
            continue
        emb = get_embedding(result.multi_face_landmarks[0])
        if emp_id not in db:
            db[emp_id] = []
        db[emp_id].append(emb)

# Average embeddings per employee
final_db = {}
for emp_id, embs in db.items():
    mean_emb = np.mean(embs, axis=0)
    normalized_emb = mean_emb / np.linalg.norm(mean_emb)
    # Get employee name
    cur.execute("SELECT name FROM employee WHERE id = %s", (emp_id,))
    name = cur.fetchone()[0]
    final_db[str(emp_id)] = {"name": name, "embedding": normalized_emb}

# Save database
with open("mediapipe_db.pkl", "wb") as f:
    pickle.dump(final_db, f)

print(f"✅ Built mediapipe_db.pkl with {len(final_db)} employees.")

cur.close()
conn.close()
