const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new Database("velora.db");

// ===============================
// Create Tables
// ===============================

db.prepare(`
    CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();


// ===============================
// Serve Website
// ===============================

app.use(express.static(__dirname));


// ===============================
// CONTACT SYSTEM
// ===============================

app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all fields."
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    const statement = db.prepare(`
        INSERT INTO inquiries (name, email, subject, message)
        VALUES (?, ?, ?, ?)
    `);

    statement.run(name, email, subject, message);

    res.status(201).json({
        success: true,
        message: "Your message has been sent successfully."
    });
});


// ===============================
// GET INQUIRIES
// ===============================

app.get("/api/inquiries", (req, res) => {
    const inquiries = db
        .prepare("SELECT * FROM inquiries ORDER BY id DESC")
        .all();

    res.json(inquiries);
});


// ===============================
// CONTENT SYSTEM
// ===============================

// GET ALL CONTENT

app.get("/api/content", (req, res) => {
    const content = db
        .prepare("SELECT * FROM content ORDER BY id DESC")
        .all();

    res.json(content);
});


// ===============================
// CREATE CONTENT
// ===============================

app.post("/api/content", (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({
            success: false,
            message: "Title and description are required."
        });
    }

    const statement = db.prepare(`
        INSERT INTO content (title, description)
        VALUES (?, ?)
    `);

    const result = statement.run(title, description);

    res.status(201).json({
        success: true,
        message: "Content added successfully.",
        id: result.lastInsertRowid
    });
});

// ===============================
// UPDATE CONTENT
// ===============================

app.put("/api/content/:id", (req, res) => {
    console.log("PUT REQUEST RECEIVED:", req.params.id);
    const id = req.params.id;
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({
            success: false,
            message: "Title and description are required."
        });
    }

    const statement = db.prepare(`
        UPDATE content
        SET title = ?, description = ?
        WHERE id = ?
    `);

    const result = statement.run(title, description, id);

    if (result.changes === 0) {
        return res.status(404).json({
            success: false,
            message: "Content not found."
        });
    }

    res.json({
        success: true,
        message: "Content updated successfully."
    });
});


// ===============================
// DELETE CONTENT
// ===============================

app.delete("/api/content/:id", (req, res) => {
    console.log("DELETE REQUEST RECEIVED:", req.params.id);
    const id = req.params.id;

    const statement = db.prepare(`
        DELETE FROM content
        WHERE id = ?
    `);

    const result = statement.run(id);

    if (result.changes === 0) {
        return res.status(404).json({
            success: false,
            message: "Content not found."
        });
    }

    res.json({
        success: true,
        message: "Content deleted successfully."
    });
});
console.log("UPDATE and DELETE routes loaded");

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log(`VELORA server is running on http://localhost:${PORT}`);
});