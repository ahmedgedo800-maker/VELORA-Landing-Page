const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = 3000;


app.use(
    session({
        secret: "velora-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 1000 * 60 * 60
        }
    })
);


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


db.prepare(`
    CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();


db.prepare(`
    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();


const serviceCount = db
    .prepare("SELECT COUNT(*) AS count FROM services")
    .get().count;

if (serviceCount === 0) {
    const insertService = db.prepare(`
        INSERT INTO services (title, description)
        VALUES (?, ?)
    `);

    const seedServices = db.transaction(() => {
        insertService.run(
            "Web Development",
            "We build modern and responsive websites that deliver great user experiences."
        );

        insertService.run(
            "UI/UX Design",
            "We design simple and engaging interfaces focused on users and their needs."
        );

        insertService.run(
            "Digital Solutions",
            "We create smart digital solutions that help businesses grow and work more efficiently."
        );
    });

    seedServices();
}




db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();



try {
    db.prepare(`
        ALTER TABLE users
        ADD COLUMN secondary_email TEXT
    `).run();

    console.log("Secondary email column added.");
} catch (error) {
    
}


function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: "You must be logged in."
        });
    }

    next();
}

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty."
            });
        }

        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

       
        const existingUser = db
            .prepare("SELECT id FROM users WHERE email = ?")
            .get(cleanEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

        const statement = db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `);

        const result = statement.run(
            cleanName,
            cleanEmail,
            hashedPassword
        );

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            userId: result.lastInsertRowid
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong during registration."
        });
    }
});


app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const user = db
    .prepare(`
        SELECT *
        FROM users
        WHERE email = ?
           OR secondary_email = ?
        LIMIT 1
    `)
    .get(cleanEmail, cleanEmail);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        
        req.session.userId = user.id;
        req.session.userName = user.name;

        res.json({
            success: true,
            message: "Login successful.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong during login."
        });
    }
});



app.get("/api/me", requireLogin, (req, res) => {
    try {
        const user = db
            .prepare(`
                SELECT id, name, email, secondary_email
                FROM users
                WHERE id = ?
            `)
            .get(req.session.userId);

        if (!user) {
            req.session.destroy(() => {});

            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        res.json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error("Get user error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load user data."
        });
    }
});


app.put("/api/me", requireLogin, (req, res) => {
    try {
        const { name, secondaryEmail } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required."
            });
        }

        const cleanName = name.trim();

        let cleanSecondaryEmail = null;

        
        if (secondaryEmail && secondaryEmail.trim()) {

            cleanSecondaryEmail =
                secondaryEmail.trim().toLowerCase();

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(cleanSecondaryEmail)) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid secondary email."
                });
            }

            
            const currentUser = db
                .prepare(`
                    SELECT email
                    FROM users
                    WHERE id = ?
                `)
                .get(req.session.userId);

            
            if (
                currentUser &&
                cleanSecondaryEmail === currentUser.email
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Secondary email cannot be the same as main email."
                });
            }

            
            const existingMainEmail = db
                .prepare(`
                    SELECT id
                    FROM users
                    WHERE email = ?
                    AND id != ?
                `)
                .get(
                    cleanSecondaryEmail,
                    req.session.userId
                );

            if (existingMainEmail) {
                return res.status(409).json({
                    success: false,
                    message: "This email is already registered."
                });
            }
        }

        
        const statement = db.prepare(`
            UPDATE users
            SET name = ?, secondary_email = ?
            WHERE id = ?
        `);

        const result = statement.run(
            cleanName,
            cleanSecondaryEmail,
            req.session.userId
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        req.session.userName = cleanName;

        res.json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: req.session.userId,
                name: cleanName,
                secondaryEmail: cleanSecondaryEmail
            }
        });

    } catch (error) {
        console.error("Update profile error:", error);

        res.status(500).json({
            success: false,
            message: "Could not update profile."
        });
    }
});

app.put("/api/change-password", requireLogin, async (req, res) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters."
            });
        }

        const user = db
            .prepare(`
                SELECT id, password
                FROM users
                WHERE id = ?
            `)
            .get(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        
        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        
        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        db.prepare(`
            UPDATE users
            SET password = ?
            WHERE id = ?
        `).run(
            hashedPassword,
            req.session.userId
        );

        res.json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Change password error:", error);

        res.status(500).json({
            success: false,
            message: "Could not change password."
        });
    }
});


app.post("/api/logout", (req, res) => {
    req.session.destroy((error) => {

        if (error) {
            console.error("Logout error:", error);

            return res.status(500).json({
                success: false,
                message: "Logout failed."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
});

app.get("/customer.html", (req, res) => {

    if (!req.session.userId) {
        return res.redirect("/login.html");
    }

    res.sendFile(__dirname + "/customer.html");
});



app.get("/admin.html", (req, res) => {

    if (!req.session.userId) {
        return res.redirect("/login.html");
    }

    res.sendFile(__dirname + "/admin.html");
});


app.post("/api/contact", (req, res) => {
    try {

        const {
            name,
            email,
            subject,
            message
        } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all fields."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanSubject = subject.trim();
        const cleanMessage = message.trim();

        if (
            !cleanName ||
            !cleanSubject ||
            !cleanMessage
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all fields."
            });
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        const statement = db.prepare(`
            INSERT INTO inquiries
            (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `);

        statement.run(
            cleanName,
            cleanEmail,
            cleanSubject,
            cleanMessage
        );

        res.status(201).json({
            success: true,
            message: "Your message has been sent successfully."
        });

    } catch (error) {

        console.error("Contact error:", error);

        res.status(500).json({
            success: false,
            message: "Something went wrong."
        });
    }
});


app.get("/api/inquiries", requireLogin, (req, res) => {
    try {

        const inquiries = db
            .prepare(`
                SELECT *
                FROM inquiries
                ORDER BY id DESC
            `)
            .all();

        res.json(inquiries);

    } catch (error) {

        console.error("Get inquiries error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load inquiries."
        });
    }
});


app.get("/api/content", requireLogin, (req, res) => {
    try {

        const content = db
            .prepare(`
                SELECT *
                FROM content
                ORDER BY id DESC
            `)
            .all();

        res.json(content);

    } catch (error) {

        console.error("Get content error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load content."
        });
    }
});


app.post("/api/content", requireLogin, (req, res) => {
    try {

        const {
            title,
            description
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required."
            });
        }

        const cleanTitle = title.trim();
        const cleanDescription = description.trim();

        if (!cleanTitle || !cleanDescription) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required."
            });
        }

        const statement = db.prepare(`
            INSERT INTO content
            (title, description)
            VALUES (?, ?)
        `);

        const result = statement.run(
            cleanTitle,
            cleanDescription
        );

        res.status(201).json({
            success: true,
            message: "Content added successfully.",
            id: result.lastInsertRowid
        });

    } catch (error) {

        console.error("Add content error:", error);

        res.status(500).json({
            success: false,
            message: "Could not add content."
        });
    }
});



app.put("/api/content/:id", requireLogin, (req, res) => {
    try {

        console.log(
            "PUT REQUEST RECEIVED:",
            req.params.id
        );

        const id = req.params.id;

        const {
            title,
            description
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required."
            });
        }

        const cleanTitle = title.trim();
        const cleanDescription = description.trim();

        if (!cleanTitle || !cleanDescription) {
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

        const result = statement.run(
            cleanTitle,
            cleanDescription,
            id
        );

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

    } catch (error) {

        console.error(
            "Update content error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not update content."
        });
    }
});



app.delete("/api/content/:id", requireLogin, (req, res) => {
    try {

        console.log(
            "DELETE REQUEST RECEIVED:",
            req.params.id
        );

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

    } catch (error) {

        console.error(
            "Delete content error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Could not delete content."
        });
    }
});



// Public: the website can read services without logging in
app.get("/api/services", (req, res) => {
    try {
        const services = db
            .prepare(`
                SELECT id, title, description, created_at
                FROM services
                ORDER BY id ASC
            `)
            .all();

        res.json({
            success: true,
            services: services
        });
    } catch (error) {
        console.error("Get services error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load services."
        });
    }
});

// Protected: create service
app.post("/api/services", requireLogin, (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required."
            });
        }

        const cleanTitle = title.trim();
        const cleanDescription = description.trim();

        if (!cleanTitle || !cleanDescription) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required."
            });
        }

        const result = db.prepare(`
            INSERT INTO services (title, description)
            VALUES (?, ?)
        `).run(cleanTitle, cleanDescription);

        const service = db.prepare(`
            SELECT id, title, description, created_at
            FROM services
            WHERE id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            message: "Service created successfully.",
            service: service
        });
    } catch (error) {
        console.error("Create service error:", error);

        res.status(500).json({
            success: false,
            message: "Could not create service."
        });
    }
});

// Protected: update service
app.put("/api/services/:id", requireLogin, (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title, description } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID."
            });
        }

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required."
            });
        }

        const cleanTitle = title.trim();
        const cleanDescription = description.trim();

        if (!cleanTitle || !cleanDescription) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required."
            });
        }

        const result = db.prepare(`
            UPDATE services
            SET title = ?, description = ?
            WHERE id = ?
        `).run(cleanTitle, cleanDescription, id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found."
            });
        }

        const service = db.prepare(`
            SELECT id, title, description, created_at
            FROM services
            WHERE id = ?
        `).get(id);

        res.json({
            success: true,
            message: "Service updated successfully.",
            service: service
        });
    } catch (error) {
        console.error("Update service error:", error);

        res.status(500).json({
            success: false,
            message: "Could not update service."
        });
    }
});


app.delete("/api/services/:id", requireLogin, (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID."
            });
        }

        const result = db.prepare(`
            DELETE FROM services
            WHERE id = ?
        `).run(id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found."
            });
        }

        res.json({
            success: true,
            message: "Service deleted successfully."
        });
    } catch (error) {
        console.error("Delete service error:", error);

        res.status(500).json({
            success: false,
            message: "Could not delete service."
        });
    }
});

app.use(
    express.static(__dirname, {
        index: "index.html"
    })
);



console.log(
    "All VELORA routes loaded successfully."
);

app.listen(PORT, () => {

    console.log(
        `VELORA server is running on http://localhost:${PORT}`
    );

});