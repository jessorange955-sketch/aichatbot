const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Database setup
const dbPath = path.join(__dirname, 'chat.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
function initDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Sessions table
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            is_active BOOLEAN DEFAULT true,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )`);

        // Insert default user if not exists
        db.get("SELECT * FROM users WHERE username = ?", ['defaultuser'], (err, row) => {
            if (!row) {
                db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                    ['defaultuser', 'user1default', 'admin']);
            }
        });
    });
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
}

// API Routes

// Authentication routes
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    if (username.length < 3) {
        return res.json({ success: false, message: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 6) {
        return res.json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error' });
        }
        
        if (row) {
            return res.json({ success: false, message: 'Username already exists' });
        }
        
        db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
            [username, password, 'user'], function(err) {
            if (err) {
                console.error('Error creating user:', err);
                return res.json({ success: false, message: 'Failed to create account' });
            }
            
            req.session.userId = this.lastID;
            req.session.username = username;
            req.session.role = 'user';
            
            res.cookie('userId', this.lastID, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            res.cookie('username', username, { maxAge: 30 * 24 * 60 * 60 * 1000 });
            
            res.json({ 
                success: true, 
                message: 'Account created successfully',
                user: {
                    id: this.lastID,
                    username: username,
                    role: 'user'
                }
            });
        });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", 
        [username, password], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error' });
        }
        
        if (row) {
            req.session.userId = row.id;
            req.session.username = row.username;
            req.session.role = row.role;
            
            res.cookie('userId', row.id, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            res.cookie('username', row.username, { maxAge: 30 * 24 * 60 * 60 * 1000 });
            
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: {
                    id: row.id,
                    username: row.username,
                    role: row.role
                }
            });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('userId');
        res.clearCookie('username');
        res.json({ success: true, message: 'Logout successful' });
    });
});

app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ 
            success: true, 
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                role: req.session.role
            }
        });
    } else {
        res.json({ success: true, authenticated: false });
    }
});

// Chat routes for regular users
app.post('/api/chat/send', (req, res) => {
    const { message, sessionId } = req.body;
    
    if (!message || !sessionId) {
        return res.json({ success: false, message: 'Message and session ID required' });
    }
    
    // Ensure session exists first
    db.get("SELECT id FROM sessions WHERE id = ?", [sessionId], (err, row) => {
        if (err) {
            console.error('Error checking session:', err);
            return res.json({ success: false, message: 'Database error' });
        }
        
        // If session doesn't exist, create it
        if (!row) {
            db.run("INSERT INTO sessions (id, is_active) VALUES (?, true)", [sessionId], (err) => {
                if (err) {
                    console.error('Error creating session:', err);
                    return res.json({ success: false, message: 'Failed to create session' });
                }
                storeMessage();
            });
        } else {
            storeMessage();
        }
    });
    
    function storeMessage() {
        // Store user message
        db.run("INSERT INTO messages (session_id, sender, text) VALUES (?, ?, ?)",
            [sessionId, 'user', message], function(err) {
            if (err) {
                console.error('Error storing message:', err);
                return res.json({ success: false, message: 'Failed to store message' });
            }
            
            // Update session last active time
            db.run("UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = ?", [sessionId]);
            
            // Simulate AI response (in a real app, this would be handled by the admin)
            setTimeout(() => {
                const aiResponses = [
                    "That's an interesting question. Let me think about that...",
                    "I understand what you're asking. Here's my perspective...",
                    "Based on my analysis, I would say...",
                    "That's a great point! Let me elaborate...",
                    "I can help you with that. Here's what I recommend...",
                    "From my understanding, the answer would be...",
                    "That's fascinating! Here's what I think...",
                    "Let me process that information for you...",
                    "I see what you mean. Here's my take...",
                    "That's a complex question. Allow me to explain..."
                ];
                
                const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
                
                db.run("INSERT INTO messages (session_id, sender, text) VALUES (?, ?, ?)",
                    [sessionId, 'ai', randomResponse], function(err) {
                    if (err) {
                        console.error('Error storing AI response:', err);
                    }
                });
            }, 1000 + Math.random() * 3000);
            
            res.json({ 
                success: true, 
                response: "I'm processing your message and will respond shortly...",
                messageId: this.lastID 
            });
        });
    }
});

app.get('/api/chat/history', (req, res) => {
    const { sessionId } = req.query;
    
    if (!sessionId) {
        return res.json({ success: false, message: 'Session ID required' });
    }
    
    db.all("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
        [sessionId], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error' });
        }
        
        res.json({ 
            success: true, 
            messages: rows.map(row => ({
                id: row.id,
                text: row.text,
                sender: row.sender,
                timestamp: row.timestamp
            }))
        });
    });
});

// Get new messages since last check (for real-time updates)
app.get('/api/chat/new-messages', (req, res) => {
    const { sessionId, lastMessageId } = req.query;
    
    if (!sessionId) {
        return res.json({ success: false, message: 'Session ID required' });
    }
    
    const query = lastMessageId 
        ? "SELECT * FROM messages WHERE session_id = ? AND id > ? ORDER BY timestamp ASC"
        : "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC";
    
    const params = lastMessageId ? [sessionId, lastMessageId] : [sessionId];
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error' });
        }
        
        res.json({ 
            success: true, 
            messages: rows.map(row => ({
                id: row.id,
                text: row.text,
                sender: row.sender,
                timestamp: row.timestamp
            }))
        });
    });
});

// Session management
app.post('/api/session/create', (req, res) => {
    const { sessionId } = req.body;
    const finalSessionId = sessionId || 'session_' + Math.random().toString(36).substr(2, 9);
    
    db.run("INSERT INTO sessions (id, is_active) VALUES (?, true)", [finalSessionId], function(err) {
        if (err) {
            console.error('Error creating session:', err);
            return res.json({ success: false, message: 'Failed to create session' });
        }
        
        res.json({ 
            success: true, 
            sessionId: finalSessionId 
        });
    });
});

// Admin routes
app.get('/api/admin/sessions', requireAuth, (req, res) => {
    // Get all active sessions with message count and last message
    const query = `
        SELECT 
            s.id,
            s.created_at,
            s.last_active,
            COUNT(m.id) as message_count,
            (SELECT text FROM messages WHERE session_id = s.id ORDER BY timestamp DESC LIMIT 1) as last_message
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        WHERE s.is_active = true
        GROUP BY s.id
        ORDER BY s.last_active DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error' });
        }
        
        // Get stats
        db.get("SELECT COUNT(*) as totalSessions FROM sessions", (err, totalRow) => {
            db.get("SELECT COUNT(*) as messagesToday FROM messages WHERE DATE(timestamp) = DATE('now')", (err, messagesRow) => {
                res.json({ 
                    success: true, 
                    sessions: rows.map(row => ({
                        id: row.id,
                        createdAt: row.created_at,
                        lastActive: row.last_active,
                        messageCount: row.message_count,
                        lastMessage: row.last_message
                    })),
                    stats: {
                        totalSessions: totalRow.totalSessions,
                        messagesToday: messagesRow.messagesToday
                    }
                });
            });
        });
    });
});

app.get('/api/admin/chat-history', requireAuth, (req, res) => {
    const { sessionId } = req.query;
    
    if (!sessionId) {
        return res.json({ success: false, message: 'Session ID required' });
    }
    
    db.all("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
        [sessionId], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error' });
        }
        
        res.json({ 
            success: true, 
            messages: rows.map(row => ({
                id: row.id,
                text: row.text,
                sender: row.sender,
                timestamp: row.timestamp
            }))
        });
    });
});

app.post('/api/admin/send-message', requireAuth, (req, res) => {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
        return res.json({ success: false, message: 'Session ID and message required' });
    }
    
    db.run("INSERT INTO messages (session_id, sender, text) VALUES (?, ?, ?)",
        [sessionId, 'admin', message], function(err) {
        if (err) {
            console.error('Error storing admin message:', err);
            return res.json({ success: false, message: 'Failed to send message' });
        }
        
        // Update session last active time
        db.run("UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = ?", [sessionId]);
        
        res.json({ 
            success: true, 
            messageId: this.lastID 
        });
    });
});

app.post('/api/admin/end-session', requireAuth, (req, res) => {
    const { sessionId } = req.body;
    
    if (!sessionId) {
        return res.json({ success: false, message: 'Session ID required' });
    }
    
    db.run("UPDATE sessions SET is_active = false WHERE id = ?", [sessionId], function(err) {
        if (err) {
            console.error('Error ending session:', err);
            return res.json({ success: false, message: 'Failed to end session' });
        }
        
        res.json({ 
            success: true, 
            message: 'Session ended successfully' 
        });
    });
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/dashboard.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDatabase();
    console.log('Database initialized');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});