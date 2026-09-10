const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const db = new Database("velora.db");

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


app.use(express.static(__dirname));


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
app.get("/api/inquiries", (req, res) => {
    const inquiries = db.prepare("SELECT * FROM inquiries ORDER BY id DESC").all();

    res.json(inquiries);
});

app.listen(PORT, () => {
    console.log(`VELORA server is running on http://localhost:${PORT}`);
});