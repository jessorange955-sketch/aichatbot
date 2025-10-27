# Prank Chat App - Project Outline

## File Structure

### Core Application Files
- **index.html** - Main chat interface (public access)
- **login.html** - Default user login page
- **dashboard.html** - Admin dashboard for default user
- **main.js** - Core JavaScript functionality
- **database.js** - SQLite database operations
- **styles.css** - Custom styles and animations

### Backend Components
- **server.js** - Node.js server with Express
- **auth.js** - Authentication middleware
- **chat.js** - Real-time chat functionality
- **api.js** - REST API endpoints

### Database
- **chat.db** - SQLite database file (auto-created)
- **schema.sql** - Database schema definition

### Assets
- **images/** - Generated and downloaded images
  - hero-ai.jpg - AI-themed hero image
  - bot-avatar.jpg - AI bot profile image
  - user-avatar.jpg - Default user avatar
  - neural-bg.jpg - Neural network background
- **icons/** - UI icons and graphics

## Page Breakdown

### 1. Index.html - Main Chat Interface
**Purpose**: Public-facing AI chat bot interface
**Features**:
- Convincing AI chat bot UI with modern design
- Message bubbles with smooth animations
- Typing indicators and response simulation
- No login required for regular users
- Glass-morphism design with neural network background
- Real-time message updates

**Sections**:
- Header: App branding and AI status indicator
- Chat Area: Message history with scroll
- Input Area: Text input with send button
- Footer: Minimal copyright info

### 2. Login.html - Default User Access
**Purpose**: Secret login for default user
**Features**:
- Hidden from main navigation
- Simple authentication form
- Mobile-optimized design
- Error handling and validation
- Redirect to dashboard on success

**Sections**:
- Login form with username/password fields
- Authentication status messages
- Link back to main chat (for testing)

### 3. Dashboard.html - Admin Interface
**Purpose**: Default user can manage multiple chats
**Features**:
- View all active chat sessions
- Select and respond to any conversation
- Real-time message updates
- Session management tools
- Mobile-responsive layout

**Sections**:
- Active sessions list
- Selected chat interface
- User management tools
- System status indicators

## Technical Implementation

### Database Schema
- **users**: User accounts and authentication
- **sessions**: Chat session management
- **messages**: Message storage with timestamps
- **conversations**: Conversation threading

### API Endpoints
- `/api/chat/send` - Send message
- `/api/chat/history` - Get message history
- `/api/chat/typing` - Typing indicator
- `/api/admin/sessions` - List active sessions
- `/api/admin/respond` - Admin response

### Real-time Features
- Message polling for real-time updates
- Typing indicators with timeout
- Session status tracking
- Automatic reconnection handling

### Security Considerations
- Session-based authentication
- Input validation and sanitization
- Rate limiting for message sending
- Protection against common attacks

## Visual Effects Integration

### Animation Libraries
- **Anime.js**: Message bubble animations
- **Typed.js**: AI typing simulation
- **Splitting.js**: Text reveal effects
- **p5.js**: Neural network background

### Interactive Elements
- Smooth message transitions
- Hover effects on buttons
- Loading states and spinners
- Error message animations

### Mobile Optimization
- Touch-friendly interface
- Responsive grid system
- Optimized image loading
- Gesture support

## Deployment Strategy
- Single-page application structure
- Static file serving with Node.js
- Database initialization on startup
- Environment configuration
- Error logging and monitoring