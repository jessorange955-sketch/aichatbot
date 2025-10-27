const express = require('express');
const { query, initDatabase, validateConnection } = require('./db');
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

// Database health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const startTime = Date.now();

        // Test basic connection
        const timeResult = await query('SELECT NOW() as current_time');
        const responseTime = Date.now() - startTime;

        // Check if tables exist
        const tableCheck = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);

        // Get user count if users table exists
        let userCount = 0;
        const hasUsersTable = tableCheck.rows.some(row => row.table_name === 'users');
        if (hasUsersTable) {
            const userResult = await query('SELECT COUNT(*) as count FROM users');
            userCount = parseInt(userResult.rows[0].count);
        }

        res.json({
            success: true,
            status: 'healthy',
            database: {
                connected: true,
                responseTime: `${responseTime}ms`,
                currentTime: timeResult.rows[0].current_time,
                tables: tableCheck.rows.map(row => row.table_name),
                userCount: userCount
            },
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Database health check error:', error);
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            database: {
                connected: false
            }
        });
    }
});

// Legacy test endpoint (kept for backward compatibility)
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await query('SELECT COUNT(*) as user_count FROM users');
        const tableCheck = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        res.json({
            success: true,
            userCount: result.rows[0].user_count,
            tables: tableCheck.rows.map(row => row.table_name)
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.json({ success: false, error: error.message });
    }
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    console.log('Registration attempt:', { username: req.body.username, hasPassword: !!req.body.password });

    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Missing username or password');
        return res.json({ success: false, message: 'Username and password required' });
    }

    if (username.length < 3) {
        console.log('Username too short:', username.length);
        return res.json({ success: false, message: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
        console.log('Password too short:', password.length);
        return res.json({ success: false, message: 'Password must be at least 6 characters' });
    }

    try {
        console.log('Checking for existing user:', username);
        const existingUser = await query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            console.log('Username already exists:', username);
            return res.json({ success: false, message: 'Username already exists' });
        }

        console.log('Creating new user:', username);
        const result = await query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
            [username, password, 'user']
        );

        const userId = result.rows[0].id;
        console.log('User created successfully with ID:', userId);

        // Verify the user was actually saved
        const verifyUser = await query(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );
        console.log('Verification - User found in database:', verifyUser.rows.length > 0, verifyUser.rows[0]);

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
    console.log('Login attempt:', { username: req.body.username, hasPassword: !!req.body.password });

    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Missing username or password');
        return res.json({ success: false, message: 'Username and password required' });
    }

    try {
        console.log('Searching for user:', username);

        // First, let's see all users in the database
        const allUsers = await query('SELECT username, password FROM users');
        console.log('All users in database:', allUsers.rows);

        const result = await query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        console.log('Login query result:', result.rows.length, 'users found');

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('Login successful for user:', user.username);

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
            console.log('No matching user found for:', username);
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
        const sessionCheck = await query(
            'SELECT id FROM sessions WHERE id = $1',
            [sessionId]
        );

        // Create session if it doesn't exist
        if (sessionCheck.rows.length === 0) {
            await query(
                'INSERT INTO sessions (id, is_active) VALUES ($1, true)',
                [sessionId]
            );
        }

        // Store user message
        const result = await query(
            'INSERT INTO messages (session_id, sender, text) VALUES ($1, $2, $3) RETURNING id',
            [sessionId, 'user', message]
        );

        // Update session last active time
        await query(
            'UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
            [sessionId]
        );

        // Notify default user about new message (this is the prank - messages go to default user)
        console.log(`📨 New message from session ${sessionId}: "${message}"`);

        // Optional: Send a quick acknowledgment that the "AI" is processing
        setTimeout(async () => {
            try {
                await query(
                    'INSERT INTO messages (session_id, sender, text) VALUES ($1, $2, $3)',
                    [sessionId, 'ai', 'I received your message and I\'m thinking about it... 🤔']
                );
            } catch (error) {
                console.error('Error storing acknowledgment:', error);
            }
        }, 1000 + Math.random() * 2000);

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
        const result = await query(
            'SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC',
            [sessionId]
        );

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
            result = await query(
                'SELECT * FROM messages WHERE session_id = $1 AND id > $2 ORDER BY timestamp ASC',
                [sessionId, lastMessageId]
            );
        } else {
            result = await query(
                'SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC',
                [sessionId]
            );
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
    const finalSessionId = sessionId || 'session_' + Math.random().toString(36).substring(2, 11);

    try {
        await query(
            'INSERT INTO sessions (id, is_active) VALUES ($1, true)',
            [finalSessionId]
        );

        res.json({
            success: true,
            sessionId: finalSessionId
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.json({ success: false, message: 'Failed to create session' });
    }
});

// Default user (prank) routes - for the person receiving all messages
app.get('/api/default/pending-messages', async (req, res) => {
    try {
        // Get all recent messages from users (not from 'ai' or 'admin' or 'defaultuser')
        const result = await query(`
            SELECT 
                m.id,
                m.session_id,
                m.text,
                m.timestamp,
                m.sender,
                s.created_at as session_created,
                (SELECT COUNT(*) FROM messages WHERE session_id = m.session_id AND sender = 'user') as user_message_count,
                (SELECT COUNT(*) FROM messages WHERE session_id = m.session_id AND sender IN ('ai', 'admin', 'defaultuser')) as response_count
            FROM messages m
            JOIN sessions s ON m.session_id = s.id
            WHERE m.sender = 'user' 
            AND s.is_active = true
            ORDER BY m.timestamp DESC
            LIMIT 50
        `);

        res.json({
            success: true,
            messages: result.rows.map(row => ({
                id: row.id,
                sessionId: row.session_id,
                text: row.text,
                timestamp: row.timestamp,
                sender: row.sender,
                sessionCreated: row.session_created,
                userMessageCount: parseInt(row.user_message_count),
                responseCount: parseInt(row.response_count),
                needsResponse: parseInt(row.response_count) < parseInt(row.user_message_count)
            }))
        });
    } catch (error) {
        console.error('Error loading pending messages:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

app.post('/api/default/respond', async (req, res) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
        return res.json({ success: false, message: 'Session ID and message required' });
    }

    try {
        // Store the response as an 'ai' message so it appears as AI to the user
        const result = await query(
            'INSERT INTO messages (session_id, sender, text) VALUES ($1, $2, $3) RETURNING id',
            [sessionId, 'ai', message]
        );

        // Update session last active time
        await query(
            'UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
            [sessionId]
        );

        console.log(`🤖 Default user responded to session ${sessionId}: "${message}"`);

        res.json({
            success: true,
            messageId: result.rows[0].id,
            message: 'Response sent successfully'
        });
    } catch (error) {
        console.error('Error sending default user response:', error);
        res.json({ success: false, message: 'Failed to send response' });
    }
});

app.get('/api/default/session-history/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    try {
        const result = await query(
            'SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC',
            [sessionId]
        );

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
        console.error('Error loading session history:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

// Admin routes
app.get('/api/admin/sessions', requireAuth, async (req, res) => {
    try {
        const sessions = await query(`
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
        `);

        const totalSessions = await query('SELECT COUNT(*) as count FROM sessions');
        const messagesToday = await query(
            'SELECT COUNT(*) as count FROM messages WHERE DATE(timestamp) = CURRENT_DATE'
        );

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
        const result = await query(
            'SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC',
            [sessionId]
        );

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
        const result = await query(
            'INSERT INTO messages (session_id, sender, text) VALUES ($1, $2, $3) RETURNING id',
            [sessionId, 'admin', message]
        );

        await query(
            'UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
            [sessionId]
        );

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
        await query(
            'UPDATE sessions SET is_active = false WHERE id = $1',
            [sessionId]
        );

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

app.get('/default-user.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'default-user.html'));
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
async function startServer() {
    try {
        console.log('🚀 Starting server...');

        // Validate database connection first
        const isConnected = await validateConnection();
        if (!isConnected) {
            throw new Error('Database connection validation failed');
        }

        // Initialize database tables
        await initDatabase();
        console.log('✅ Database initialized successfully');

        // Start the server
        app.listen(PORT, () => {
            console.log(`🌐 Server running on port ${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('🎉 Application ready to serve requests!');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.error('🔧 Please check your database configuration and try again');
        process.exit(1);
    }
}

startServer();

// Export for Vercel
module.exports = app;
