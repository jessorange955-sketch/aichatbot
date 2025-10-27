const express = require('express');
const { sql, initDatabase } = require('./db');
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
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

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
app.post('/api/auth/register', async (req, res) => {
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
    
    try {
        const existingUser = await sql`SELECT * FROM users WHERE username = ${username}`;
        
        if (existingUser.rows.length > 0) {
            return res.json({ success: false, message: 'Username already exists' });
        }
        
        const result = await sql`
            INSERT INTO users (username, password, role) 
            VALUES (${username}, ${password}, 'user')
            RETURNING id
        `;
        
        const userId = result.rows[0].id;
        
        req.session.userId = userId;
        req.session.username = username;
        req.session.role = 'user';
        
        res.cookie('userId', userId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        res.cookie('username', username, { maxAge: 30 * 24 * 60 * 60 * 1000 });
        
        res.json({ 
            success: true, 
            message: 'Account created successfully',
            user: {
                id: userId,
                username: username,
                role: 'user'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, message: 'Failed to create account' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: 'Username and password required' });
    }
    
    try {
        const result = await sql`
            SELECT * FROM users 
            WHERE username = ${username} AND password = ${password}
        `;
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            
            res.cookie('userId', user.id, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            res.cookie('username', user.username, { maxAge: 30 * 24 * 60 * 60 * 1000 });
            
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Database error' });
    }
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

// Chat routes
app.post('/api/chat/send', async (req, res) => {
    const { message, sessionId } = req.body;
    
    if (!message || !sessionId) {
        return res.json({ success: false, message: 'Message and session ID required' });
    }
    
    try {
        // Check if session exists
        const sessionCheck = await sql`SELECT id FROM sessions WHERE id = ${sessionId}`;
        
        // Create session if it doesn't exist
        if (sessionCheck.rows.length === 0) {
            await sql`INSERT INTO sessions (id, is_active) VALUES (${sessionId}, true)`;
        }
        
        // Store user message
        const result = await sql`
            INSERT INTO messages (session_id, sender, text) 
            VALUES (${sessionId}, 'user', ${message})
            RETURNING id
        `;
        
        // Update session last active time
        await sql`UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = ${sessionId}`;
        
        // Simulate AI response
        setTimeout(async () => {
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
            
            try {
                await sql`
                    INSERT INTO messages (session_id, sender, text) 
                    VALUES (${sessionId}, 'ai', ${randomResponse})
                `;
            } catch (error) {
                console.error('Error storing AI response:', error);
            }
        }, 1000 + Math.random() * 3000);
        
        res.json({ 
            success: true, 
            response: "I'm processing your message and will respond shortly...",
            messageId: result.rows[0].id
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.json({ success: false, message: 'Failed to send message' });
    }
});

app.get('/api/chat/history', async (req, res) => {
    const { sessionId } = req.query;
    
    if (!sessionId) {
        return res.json({ success: false, message: 'Session ID required' });
    }
    
    try {
        const result = await sql`
            SELECT * FROM messages 
            WHERE session_id = ${sessionId} 
            ORDER BY timestamp ASC
        `;
        
        res.json({ 
            success: true, 
            messages: result.rows.map(row => ({
                id: row.id,
                text: row.text,
                sender: row.sender,
                timestamp: row.timestamp
            }))
        });
    } catch (error) {
        console.error('Error loading chat history:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

app.get('/api/chat/new-messages', async (req, res) => {
    const { sessionId, lastMessageId } = req.query;
    
    if (!sessionId) {
        return res.json({ success: false, message: 'Session ID required' });
    }
    
    try {
        let result;
        if (lastMessageId) {
            result = await sql`
                SELECT * FROM messages 
                WHERE session_id = ${sessionId} AND id > ${lastMessageId}
                ORDER BY timestamp ASC
            `;
        } else {
            result = await sql`
                SELECT * FROM messages 
                WHERE session_id = ${sessionId}
                ORDER BY timestamp ASC
            `;
        }
        
        res.json({ 
            success: true, 
            messages: result.rows.map(row => ({
                id: row.id,
                text: row.text,
                sender: row.sender,
                timestamp: row.timestamp
            }))
        });
    } catch (error) {
        console.error('Error checking new messages:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

// Session management
app.post('/api/session/create', async (req, res) => {
    const { sessionId } = req.body;
    const finalSessionId = sessionId || 'session_' + Math.random().toString(36).substr(2, 9);
    
    try {
        await sql`INSERT INTO sessions (id, is_active) VALUES (${finalSessionId}, true)`;
        
        res.json({ 
            success: true, 
            sessionId: finalSessionId 
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.json({ success: false, message: 'Failed to create session' });
    }
});

// Admin routes
app.get('/api/admin/sessions', requireAuth, async (req, res) => {
    try {
        const sessions = await sql`
            SELECT 
                s.id,
                s.created_at,
                s.last_active,
                COUNT(m.id) as message_count,
                (SELECT text FROM messages WHERE session_id = s.id ORDER BY timestamp DESC LIMIT 1) as last_message
            FROM sessions s
            LEFT JOIN messages m ON s.id = m.session_id
            WHERE s.is_active = true
            GROUP BY s.id, s.created_at, s.last_active
            ORDER BY s.last_active DESC
        `;
        
        const totalSessions = await sql`SELECT COUNT(*) as count FROM sessions`;
        const messagesToday = await sql`
            SELECT COUNT(*) as count FROM messages 
            WHERE DATE(timestamp) = CURRENT_DATE
        `;
        
        res.json({ 
            success: true, 
            sessions: sessions.rows.map(row => ({
                id: row.id,
                createdAt: row.created_at,
                lastActive: row.last_active,
                messageCount: row.message_count,
                lastMessage: row.last_message
            })),
            stats: {
                totalSessions: totalSessions.rows[0].count,
                messagesToday: messagesToday.rows[0].count
            }
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

app.get('/api/admin/chat-history', requireAuth, async (req, res) => {
    const { sessionId } = req.query;
    
    if (!sessionId) {
        return res.json({ success: false, message: 'Session ID required' });
    }
    
    try {
        const result = await sql`
            SELECT * FROM messages 
            WHERE session_id = ${sessionId} 
            ORDER BY timestamp ASC
        `;
        
        res.json({ 
            success: true, 
            messages: result.rows.map(row => ({
                id: row.id,
                text: row.text,
                sender: row.sender,
                timestamp: row.timestamp
            }))
        });
    } catch (error) {
        console.error('Error loading chat history:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

app.post('/api/admin/send-message', requireAuth, async (req, res) => {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
        return res.json({ success: false, message: 'Session ID and message required' });
    }
    
    try {
        const result = await sql`
            INSERT INTO messages (session_id, sender, text) 
            VALUES (${sessionId}, 'admin', ${message})
            RETURNING id
        `;
        
        await sql`UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = ${sessionId}`;
        
        res.json({ 
            success: true, 
            messageId: result.rows[0].id
        });
    } catch (error) {
        console.error('Error sending admin message:', error);
        res.json({ success: false, message: 'Failed to send message' });
    }
});

app.post('/api/admin/end-session', requireAuth, async (req, res) => {
    const { sessionId } = req.body;
    
    if (!sessionId) {
        return res.json({ success: false, message: 'Session ID required' });
    }
    
    try {
        await sql`UPDATE sessions SET is_active = false WHERE id = ${sessionId}`;
        
        res.json({ 
            success: true, 
            message: 'Session ended successfully' 
        });
    } catch (error) {
        console.error('Error ending session:', error);
        res.json({ success: false, message: 'Failed to end session' });
    }
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

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Database initialized');
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
});

// Export for Vercel
module.exports = app;
