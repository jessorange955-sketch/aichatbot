# Prank Chat App

A clever web application that masquerades as an AI chat bot while secretly connecting users to a default human user. This prank app creates a convincing AI interface that regular users can interact with immediately, while the default user can log in to respond to conversations in real-time.

## Features

### For Regular Users
- **Instant Access**: No registration or login required
- **Convincing AI Interface**: Modern, professional chat bot design
- **Real-time Messaging**: Smooth message delivery with typing indicators
- **Mobile-Optimized**: Responsive design for all devices
- **Visual Effects**: Animated neural network background and smooth transitions

### For Default User (Admin)
- **Secret Login**: Hidden admin access at `/login.html`
- **Multi-Session Management**: View and manage all active chat sessions
- **Real-time Dashboard**: Monitor conversations and respond instantly
- **Session Control**: End sessions and view system statistics

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Tailwind CSS)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: Session-based auth
- **Animations**: Anime.js, Typed.js, p5.js
- **Styling**: Tailwind CSS with custom glass-morphism effects

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## Installation

1. **Clone or download the project files**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Main chat interface: `http://localhost:3000`
   - Admin login: `http://localhost:3000/login.html`

## Default Credentials

- **Username**: `defaultuser`
- **Password**: `user1default`

## File Structure

```
prank-chat-app/
├── index.html          # Main chat interface
├── login.html          # Admin login page
├── dashboard.html      # Admin dashboard
├── server.js           # Express server
├── package.json        # Dependencies
├── chat.db             # SQLite database (created on startup)
├── resources/          # Images and assets
│   ├── hero-ai.jpg
│   ├── bot-avatar.jpg
│   ├── user-avatar.jpg
│   └── neural-bg.jpg
└── README.md
```

## How It Works

1. **Regular User Experience**:
   - User lands on the main chat interface
   - Sees a convincing AI bot welcome message
   - Can start chatting immediately
   - Receives responses that appear to be from AI
   - Unaware they're actually chatting with a human

2. **Admin User Experience**:
   - Logs in with credentials at `/login.html`
   - Accesses dashboard showing all active sessions
   - Can select any session to view and respond
   - Real-time chat management across multiple conversations
   - Can end sessions and monitor system stats

## Visual Design

- **Modern Glass Morphism**: Semi-transparent elements with backdrop blur
- **Neural Network Background**: Animated particles suggesting AI processing
- **Smooth Animations**: Message transitions, typing indicators, hover effects
- **Mobile-First**: Optimized for touch interactions and small screens
- **Professional Aesthetic**: Clean, trustworthy design that builds confidence

## Security Considerations

- Session-based authentication for admin access
- Input validation and sanitization
- Rate limiting for message sending
- Protection against common web vulnerabilities
- Secure session management

## Customization

The application can be easily customized by:
- Modifying the AI response templates in `server.js`
- Changing color schemes in the CSS
- Adding new visual effects using the included animation libraries
- Customizing the neural network background animation
- Adjusting the glass-morphism styling

## Development

For development with auto-restart:
```bash
npm run dev
```

## Production Deployment

1. Set environment variables for security
2. Use HTTPS for secure connections
3. Update session configuration for production
4. Implement proper error logging
5. Set up monitoring and backup systems

## License

MIT License - Feel free to use and modify as needed.

## Disclaimer

This application is intended for entertainment and educational purposes. Use responsibly and ensure users understand they're interacting with a human if required by your use case.