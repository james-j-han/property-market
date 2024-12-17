import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import '../register.css'

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState("seller");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const BASE_URL = "https://loving-friendship-production.up.railway.app";

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await axios.post(`${BASE_URL}/register`, {
        firstName,
        lastName,
        email,
        password,
        type,
      });

      if (response.status === 201) {
        alert("Registration successful! Please login.");
        navigate("/"); // Redirect to the login page
      }
    } catch (err) {
      if (err.response) {
        // If the server responded with a specific error
        setError(err.response.data.message || "Registration failed.");
      } else {
        // General errors like network issues
        setError("An error occurred. Please try again.");
      }
    }
  };

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="center">
          <h2>Register</h2>
          <div className="form">
            <form onSubmit={handleRegister}>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <div>
                <div className="form-group">
                  <label>First Name:</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name:</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label>Type:</label>
                <label>
                  <input
                    type="radio"
                    value="buyer"
                    checked={type === "buyer"}
                    onChange={(e) => setType(e.target.value)}
                  />
                  Buyer
                </label>

                <label>
                  <input
                    type="radio"
                    value="seller"
                    checked={type === "seller"}
                    onChange={(e) => setType(e.target.value)}
                  />
                  Seller
                </label>
              </div>
              <button type="submit">Register</button>
            </form>
            <p>
              Already have an account? <Link to="/">Login here</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Register;
