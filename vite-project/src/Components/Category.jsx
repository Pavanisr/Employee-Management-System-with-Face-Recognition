import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Category.css"; // <-- Add this line

const Category = () => {
  const [category, setCategory] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/auth/category")
      .then((result) => {
        if (result.data.Status) {
          setCategory(result.data.Result);
        } else {
          alert(result.data.Error);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="category-container px-5 mt-4">
      <div className="text-center mb-4">
        <h3 className="category-title">Category List</h3>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/dashboard/add_category" className="btn add-btn">
          + Add Category
        </Link>
      </div>

      <div className="table-responsive">
        <table className="table category-table table-bordered table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category Name</th>
            </tr>
          </thead>
          <tbody>
            {category.length > 0 ? (
              category.map((c, index) => (
                <tr key={c.id || index}>
                  <td>{c.id}</td>
                  <td className="text-break">{c.name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="text-center">
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Category;
