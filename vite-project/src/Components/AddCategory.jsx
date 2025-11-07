import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Category.css"; // Use same theme file

const AddCategory = () => {
  const [category, setCategory] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:3000/auth/add_category", { category })
      .then((result) => {
        if (result.data.Status) {
          navigate("/dashboard/category");
        } else {
          alert(result.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <h2 className="popup-title">Add New Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="category" className="popup-label">
              Category Name:
            </label>
            <input
              type="text"
              name="category"
              id="category"
              placeholder="Enter category name"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="popup-input"
              required
            />
          </div>
          <div className="d-flex justify-content-between">
            <button type="submit" className="btn popup-btn">
              Add Category
            </button>
            <button
              type="button"
              className="btn popup-cancel"
              onClick={() => navigate("/dashboard/category")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategory;
