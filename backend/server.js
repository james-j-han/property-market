import express from "express";
import mysql from "mysql2";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const app = express();

const BASE_URL = "https://loving-friendship-production.up.railway.app";
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "https://james-j-han.github.io", // Your GitHub Pages URL
  "https://loving-friendship-production.up.railway.app", // Optional, backend URL for testing
];

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
const upload = multer({ dest: path.join(__dirname, "uploads") });

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Uploads directory created");
} else {
  console.log("Uploads directory already exists");
}

fs.readdir(path.join(__dirname, "uploads"), (err, files) => {
  if (err) {
    console.error("Error reading uploads directory:", err);
  } else {
    console.log("Files in uploads directory:", files);
  }
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    credentials: true, // Allow cookies and authentication headers
  })
);

// Static files middleware for serving images
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=31536000");
    },
  })
);

// JSON parsing middleware
app.use(bodyParser.json());
// app.use(cors());
// app.use(bodyParser.json());
// Serve static files from the Vite build output
// app.use(express.static(path.join(__dirname, "../dist")));

// Load env
dotenv.config();

const pool = mysql
  .createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
  })
  .promise();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Directory to save the uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with original extension
  },
});

// MySQL
const createUsersTable = async () => {
  try {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS Users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          first_name VARCHAR(50) NOT NULL,
          last_name VARCHAR(50) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          type ENUM('seller', 'buyer', 'admin') NOT NULL DEFAULT 'seller',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
    await pool.query(createTableQuery);
    console.log("Users table created or already exists.");
  } catch (error) {
    console.error("Error creating Users table:", error.message);
  }
};

// MySQL
const createPropertiesTable = async () => {
  try {
    const createPropertiesQuery = `
      CREATE TABLE IF NOT EXISTS Properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        location VARCHAR(255),
        age VARCHAR(10),
        floor_plan VARCHAR(255),
        bedrooms INT,
        additional_facilities VARCHAR(255),
        garden BOOLEAN DEFAULT FALSE,
        parking BOOLEAN DEFAULT FALSE,
        proximity_facilities INT,
        proximity_main_roads INT,
        tax_records DECIMAL(10, 2),
        photo_url VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      );
    `;
    await pool.query(createPropertiesQuery);
    console.log("Properties table created or already exists.");
  } catch (error) {
    console.error("Error creating Properties table:", error.message);
  }
};

// MySQL
const createAdminUser = async () => {
  const hashedPassword = await bcrypt.hash("1234", 10);
  try {
    const createAdminQuery = `
      INSERT INTO Users (first_name, last_name, email, password, type)
      VALUES (?, ?, ?, ?, ?);
    `;
    const values = ["admin", "admin", "a@gmail.com", hashedPassword, "admin"];
    await pool.query(createAdminQuery, values);
    console.log("Admin was created or already exists.");
  } catch (error) {
    console.error("Error creating Admin:", error.message);
  }
};

const initTables = async () => {
  await createUsersTable();
  await createPropertiesTable();
  // await createAdminUser();
};

initTables()
  .then(() => console.log("Tables initialized successfully."))
  .catch((error) => console.log("Error initializing tables: ", error));

// app.get("/", (req, res) => {
//   console.log("Getting /");
//   res.sendFile(path.join(__dirname, "../dist", "index.html"));
// });

// Login API
// MySQL
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      console.log("User not found.");

      return res.status(404).json({ message: "User not found." });
    }

    // The matching user object from database
    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Simulate generating a JWT token
    const token = "fake-jwt-token";
    const { id, first_name, last_name, type } = user;
    return res.status(200).json({
      message: "Login successful",
      token,
      userData: { id, first_name, last_name, type },
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// MySQL
app.post("/register", async (req, res) => {
  console.log("Attempting to register...");

  const { email, password, firstName, lastName, type } = req.body;
  console.log(email, password, firstName, lastName, type);

  // Validate inputs
  if (!email || !password || !firstName || !lastName || !type) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (type !== "buyer" && type !== "seller") {
    return res.status(400).json({ message: "Invalid user type." });
  }

  try {
    // Check if the user already exists
    const [existingUser] = await pool.query(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Insert new user into the database
    const [result] = await pool.query(
      "INSERT INTO Users (email, password, first_name, last_name, type) VALUES (?, ?, ?, ?, ?)",
      [email, hashedPassword, firstName, lastName, type]
    );

    console.log("Registered successfully.");

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error during registration:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Endpoint to save property with photo
app.post("/api/properties", upload.single("photo"), async (req, res) => {
  const {
    user_id, // From the current user context
    location,
    age,
    floor_plan,
    bedrooms,
    additional_facilities,
    garden,
    parking,
    proximity_facilities,
    proximity_main_roads,
    tax_records,
  } = req.body;

  const photoPath = req.file
    ? `${BASE_URL}/uploads/${req.file.filename}`
    : null; // Save file path if uploaded
  console.log(`photo path: ${photoPath}`);

  try {
    const query = `
      INSERT INTO Properties 
      (user_id, location, age, floor_plan, bedrooms, additional_facilities, garden, parking, proximity_facilities, proximity_main_roads, tax_records, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      user_id,
      location,
      age,
      floor_plan,
      bedrooms,
      additional_facilities,
      garden,
      parking,
      proximity_facilities,
      proximity_main_roads,
      tax_records,
      photoPath,
    ];

    await pool.query(query, values);
    res.status(201).json({ message: "Property added successfully", photoPath });
  } catch (error) {
    console.error("Error saving property:", error.essage);
    res
      .status(500)
      .json({ message: "Error saving property", error: error.message });
  }
});

// MySQL
app.get("/api/properties", async (req, res) => {
  // const { userId } = req.params; // Get user ID from the URL
  const { user_id } = req.query;
  console.log("Received request to fetch properties for userId:", user_id);
  if (!user_id) return res.status(400).json({ message: "user_id is required" });

  try {
    const query = `
      SELECT id, location, age, floor_plan, bedrooms, additional_facilities, garden, parking, proximity_facilities, proximity_main_roads, tax_records, photo_url
      FROM Properties
      WHERE user_id = ?;
    `;
    console.log("Executing query:", query);
    console.log("Query parameters:", [user_id]);

    const [rows] = await pool.query(query, [user_id]);

    if (rows.length === 0) {
      console.log("No properties found for userId:", user_id);
      return res
        .status(404)
        .json({ message: "No properties found for this user." });
    }

    // Default values
    const processedRows = rows.map((row) => ({
      ...row,
      age: row.age || "1", // Default age to '1' if null or undefined
      bedrooms: row.bedrooms || 1, // Default bedrooms to 1 if null or undefined
    }));

    console.log("Properties fetched successfully:", rows);
    res.status(200).json(processedRows); // Return the list of properties
  } catch (error) {
    console.error("Error fetching properties:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
});

// EDIT API
// MySQL
app.put("/api/properties/:id", upload.single("photo"), async (req, res) => {
  console.log("Saving property edit");
  
  const { id } = req.params;
  const {
    location,
    age,
    floor_plan,
    bedrooms,
    additional_facilities,
    garden,
    parking,
    proximity_facilities,
    proximity_main_roads,
    tax_records,
  } = req.body;

  const parsedBedrooms = parseInt(bedrooms, 10) || 0;
  const parsedGarden =
    garden === "1" || garden === 1 || garden === true ? 1 : 0;
  const parsedParking =
    parking === "1" || parking === 1 || parking === true ? 1 : 0;
  const parsedProximityFacilities = parseInt(proximity_facilities, 10) || 0;
  const parsedProximityMainRoads = parseInt(proximity_main_roads, 10) || 0;
  const parsedTaxRecords = parseFloat(tax_records) || 0.0;

  console.log("Request body data and types:");
  console.log(`location (${typeof location}):`, location);
  console.log(`age (${typeof age}):`, age);
  console.log(`floor_plan (${typeof floor_plan}):`, floor_plan);
  console.log(`bedrooms (${typeof parsedBedrooms}):`, parsedBedrooms);
  console.log(
    `additional_facilities (${typeof additional_facilities}):`,
    additional_facilities
  );
  console.log(`garden (${typeof parsedGarden}):`, parsedGarden);
  console.log(`parking (${typeof parsedParking}):`, parsedParking);
  console.log(
    `proximity_facilities (${typeof parsedProximityFacilities}):`,
    parsedProximityFacilities
  );
  console.log(
    `proximity_main_roads (${typeof parsedProximityMainRoads}):`,
    parsedProximityMainRoads
  );
  console.log(`tax_records (${typeof parsedTaxRecords}):`, parsedTaxRecords);

  const photoPath = req.file ? `${BASE_URL}/uploads/${req.file.filename}` : null;

  try {
    let query, values;

    if (photoPath) {
      // If a new photo is uploaded, update the photo_url
      query = `
        UPDATE Properties 
        SET location = ?, age = ?, floor_plan = ?, bedrooms = ?, 
            additional_facilities = ?, garden = ?, parking = ?, 
            proximity_facilities = ?, proximity_main_roads = ?, 
            tax_records = ?, photo_url = ?
        WHERE id = ?;
      `;
      values = [
        location,
        age,
        floor_plan,
        parsedBedrooms,
        additional_facilities,
        parsedGarden,
        parsedParking,
        parsedProximityFacilities,
        parsedProximityMainRoads,
        parsedTaxRecords,
        photoPath,
        id,
      ];
    } else {
      // If no new photo is uploaded, retain the existing photo_url
      query = `
        UPDATE Properties 
        SET location = ?, age = ?, floor_plan = ?, bedrooms = ?, 
            additional_facilities = ?, garden = ?, parking = ?, 
            proximity_facilities = ?, proximity_main_roads = ?, 
            tax_records = ?
        WHERE id = ?;
      `;
      values = [
        location,
        age,
        floor_plan,
        parsedBedrooms,
        additional_facilities,
        parsedGarden,
        parsedParking,
        parsedProximityFacilities,
        parsedProximityMainRoads,
        parsedTaxRecords,
        id,
      ];
    }

    await pool.query(query, values);

    // Fetch the updated property to return
    const [updatedProperty] = await pool.query(
      "SELECT * FROM Properties WHERE id = ?",
      [id]
    );

    res.status(200).json(updatedProperty[0]);
  } catch (error) {
    console.error("Error updating property:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/api/properties/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = "DELETE FROM Properties WHERE id = ?";
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Property not found." });
    }

    res.status(200).json({ message: "Property deleted successfully." });
  } catch (error) {
    console.error("Error deleting property:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
});

// app.get("*", (req, res) => {
//   console.log("Wildcard route triggered for:", req.path);
//   console.log("Serving file from:", path.join(__dirname, "../dist", "index.html"));
//   res.sendFile(path.join(__dirname, "../dist", "index.html"));
// });

console.log("Initializing server...");
// console.log("Environment Variables", process.env);
console.log(`MYSQLHOST: ${process.env.MYSQLHOST}`);
console.log(`MYSQLUSER: ${process.env.MYSQLUSER}`);
console.log(`MYSQLDATABASE: ${process.env.MYSQLDATABASE}`);
console.log(`MYSQLPASSWORD: ${process.env.MYSQLPASSWORD}`);
console.log(`MYSQLPORT: ${process.env.MYSQLPORT}`);
console.log("Serving static files from:", path.join(__dirname, "../dist"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
