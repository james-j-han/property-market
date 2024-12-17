import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "./UserContext";
import Header from "./Header";
import Footer from "./Footer";
import Modal from "./Modal";
import axios from "axios";

import plus from '../components/images/plus.png';

import BuyerDashboardPage from "./BuyerDashboardPage";
import AdminDashboardPage from "./AdminDashboardPage";

function DashboardPage() {
  const { user } = useUser();
  const BASE_URL = "https://loving-friendship-production.up.railway.app";

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.type === "buyer") {
    return <BuyerDashboardPage />;
  }

  if (user.type === "admin") {
    return <AdminDashboardPage />;
  }

  const [cards, setCards] = useState([]); // State to hold cards
  const [isModalOpen, setIsModalOpen] = useState(false); // State to toggle modal
  const [newCardData, setNewCardData] = useState({
    location: "",
    age: "1",
    floor_plan: "",
    bedrooms: "1",
    additional_facilities: "",
    garden: false,
    parking: false,
    proximity_facilities: "1",
    proximity_main_roads: "1",
    tax_records: "1050.00",
    photo: null, // Initial value for the file input
  });
  const [editingCard, setEditingCard] = useState(null); // For editing
  const [loading, setLoading] = useState(true); // For fetching data from db

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // const fetchProperties = async () => {
  //   try {
  //     const response = await axios.get(`${BASE_URL}/api/properties/${user.id}`);
  //     console.log("Fetched properties:", response.data);
  //     setCards(response.data); // Update state with the fetched properties
  //   } catch (error) {
  //     console.error(
  //       "Error fetching properties:",
  //       error.response?.data || error.message
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/properties`, {
          params: { user_id: user.id },
        });
        console.log(`Fetched properties: ${response.data}`);
        setCards(response.data);
      } catch (error) {
        console.error(
          `Error fetching properties: ${error.response?.data || error.message}`
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProperties();
    }
  }, [loading, user]);

  // if (loading) {
  //   return <div>Loading properties...</div>;
  // }

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("location", newCardData.location);
    formData.append("age", newCardData.age);
    formData.append("floor_plan", newCardData.floor_plan);
    formData.append("bedrooms", parseInt(newCardData.bedrooms, 10) || 0);
    formData.append(
      "additional_facilities",
      newCardData.additional_facilities || ""
    );
    formData.append("garden", newCardData.garden ? 1 : 0);
    formData.append("parking", newCardData.parking ? 1 : 0);
    formData.append(
      "proximity_facilities",
      parseInt(newCardData.proximity_facilities, 10) || 0
    );
    formData.append(
      "proximity_main_roads",
      parseInt(newCardData.proximity_main_roads, 10) || 0
    );
    formData.append("tax_records", parseFloat(newCardData.tax_records) || 0.0);
    if (newCardData.photo) {
      formData.append("photo", newCardData.photo);
    }

    try {
      if (editingCard) {
        // Edit property
        const response = await axios.put(
          `${BASE_URL}/api/properties/${editingCard.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        if (response.status === 200) {
          console.log("Property updated successfully.");
        }
      } else {
        // Add new property
        const response = await axios.post(`${BASE_URL}/api/properties`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.status === 201) {
          console.log("Property added successfully.");
        }
      }
      setLoading(true); // Trigger re-fetch of properties
    } catch (error) {
      console.error("Error saving property:", error.response?.data || error.message);
    } finally {
      setNewCardData({
        location: "",
        age: "",
        floor_plan: "",
        bedrooms: "",
        additional_facilities: "",
        garden: false,
        parking: false,
        proximity_facilities: "",
        proximity_main_roads: "",
        tax_records: "",
        photo: null,
      });
      setIsModalOpen(false); // Close modal
      setEditingCard(null); // Clear editing state
    }
  };

  const handleEdit = (cardId) => {
    const cardToEdit = cards.find((card) => card.id === cardId); // Find the card to edit
    setEditingCard(cardToEdit); // Set the card being edited
    setNewCardData({ ...cardToEdit }); // Prefill modal fields
    setIsModalOpen(true); // Open the modal
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        const response = await axios.delete(`${BASE_URL}/api/properties/${id}`);
        if (response.status === 200) {
          console.log("Property deleted successfully");
          setCards(cards.filter((card) => card.id !== id)); // Remove the card from the UI
        }
      } catch (error) {
        console.error(
          "Error deleting property:",
          error.response?.data || error.message
        );
      }
    }
  };

  console.log(`Current user: ${user}`);

  return (
    <>
      <Header />
      <div className="dashboard">
        <h1>
          {user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1)}'s Seller Dashboard
        </h1>
        {loading ? (
          <div className="loading">Loading properties...</div>
        ) : (
          <div className="grid">
            {/* Button card to add new information */}
            <div className="card add-card" onClick={toggleModal}>
              <h2>Add Property</h2>
              <img src={plus} alt="plus icon" />
            </div>

            {/* Render cards */}
            {cards.length > 0 ? (
              cards.map((card, index) => (
                <div key={card.id || `card-${index}`} className="card">
                  {/* Edit Button */}
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(card.id)}
                  >
                    ✏️
                  </button>

                  {/* Delete Button */}
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(card.id)}
                  >
                    ❌
                  </button>
                  {card.photo_url && (
                    <img
                      src={card.photo_url}
                      alt="Property"
                      className="property-image"
                      crossOrigin="anonymous"
                    />
                  )}
                  <div className="card-details">
                    <p>
                      <strong>Location:</strong> {card.location}
                    </p>
                    <p>
                      <strong>Bedrooms:</strong> {card.bedrooms}
                    </p>
                    <p>
                      <strong>Age:</strong> {card.age}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div>No properties found.</div>
            )}
          </div>
        )}

        {/* Modal for adding new card */}
        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={toggleModal}>
            <h2>Add Property Information</h2>
            <div className="form-container">
              <div className="label-input-col">
                {/* Location */}
                <div className="label-input-row">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    placeholder="123 Brown St."
                    value={newCardData.location || ""}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        location: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Age */}
                <div className="label-input-row">
                  <label htmlFor="age">Age</label>
                  <select
                    id="age"
                    value={newCardData.age || "1"}
                    onChange={(e) =>
                      setNewCardData({ ...newCardData, age: e.target.value })
                    }
                    required
                  >
                    <option value="1">1 year</option>
                    <option value="1-5">1-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10-15">10-15 years</option>
                    <option value="15-20">15-20 years</option>
                    <option value="20-30">20-30 years</option>
                    <option value="30-40">30-40 years</option>
                    <option value="40-50">40-50 years</option>
                    <option value="50+">50+ years</option>
                  </select>
                </div>

                {/* Floor Plan */}
                <div className="label-input-row">
                  <label htmlFor="floor_plan">Floor Plan</label>
                  <input
                    type="text"
                    id="floor_plan"
                    placeholder="Enter floor plan"
                    value={newCardData.floor_plan || ""}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        floor_plan: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Number of Bedrooms */}
                <div className="label-input-row">
                  <label htmlFor="bedrooms"># of Bedrooms</label>
                  <select
                    id="bedrooms"
                    value={newCardData.bedrooms || "1"}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        bedrooms: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                {/* Additional Facilities */}
                <div className="label-input-row">
                  <label htmlFor="additional_facilities">
                    Additional Facilities
                  </label>
                  <input
                    type="text"
                    id="additional_facilities"
                    placeholder="e.g., Pool, Gym"
                    value={newCardData.additional_facilities || ""}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        additional_facilities: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Garden */}
                <div className="label-input-row">
                  <label htmlFor="garden">Garden</label>
                  <input
                    type="checkbox"
                    id="garden"
                    checked={newCardData.garden || false}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        garden: e.target.checked,
                      })
                    }
                  />
                </div>

                {/* Parking */}
                <div className="label-input-row">
                  <label htmlFor="parking">Parking</label>
                  <input
                    type="checkbox"
                    id="parking"
                    checked={newCardData.parking || false}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        parking: e.target.checked,
                      })
                    }
                  />
                </div>

                {/* Proximity to Nearby Facilities */}
                <div className="label-input-row">
                  <label htmlFor="proximity_facilities">
                    Proximity to Nearby Facilities
                  </label>
                  <select
                    id="proximity_facilities"
                    value={newCardData.proximity_facilities || "1"}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        proximity_facilities: e.target.value,
                      })
                    }
                  >
                    <option value="1">1 mile</option>
                    <option value="2">2 miles</option>
                    <option value="3">3 miles</option>
                    <option value="4">4 miles</option>
                    <option value="5">5 miles</option>
                  </select>
                </div>

                {/* Proximity to Main Roads */}
                <div className="label-input-row">
                  <label htmlFor="proximity_main_roads">
                    Proximity to Main Roads
                  </label>
                  <select
                    id="proximity_main_roads"
                    value={newCardData.proximity_main_roads || "1"}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        proximity_main_roads: e.target.value,
                      })
                    }
                  >
                    <option value="1">1 mile</option>
                    <option value="2">2 miles</option>
                    <option value="3">3 miles</option>
                    <option value="4">4 miles</option>
                    <option value="5">5 miles</option>
                  </select>
                </div>

                {/* Property Tax Records */}
                <div className="label-input-row">
                  <label htmlFor="tax_records">Property Tax Records (7%)</label>
                  <input
                    type="text"
                    id="tax_records"
                    placeholder="e.g., 1000.50"
                    value={newCardData.tax_records || "1000.50"}
                    onChange={(e) =>
                      setNewCardData({
                        ...newCardData,
                        tax_records: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="image-col">
                <div className="card addImage">
                  <label htmlFor="photo">Add Photo</label>
                  <div className="imgInput">
                    <input
                      type="file"
                      id="photo"
                      accept="image/*"
                      onChange={(e) =>
                        setNewCardData({
                          ...newCardData,
                          photo: e.target.files[0],
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleSave}>
              {editingCard ? "Save Changes" : "Add Property"}
            </button>
            <button onClick={toggleModal}>Cancel</button>
          </Modal>
        )}
      </div>
      <Footer />
    </>
  );
}

export default DashboardPage;
