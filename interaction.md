# Prank Chat App - User Interaction Design

## Core Concept
A prank web application that appears to be an AI chat bot but actually connects users to a default human user who can respond in real-time.

## User Interaction Flow

### 1. Main Chat Interface (Public Access)
- **Landing Experience**: Users see a sleek AI chat bot interface with modern design
- **Chat Window**: Clean message bubbles with typing indicators
- **AI Persona**: The interface presents itself as an advanced AI assistant
- **Message Input**: Simple text input with send button
- **Response Simulation**: Users receive responses that appear to be from AI
- **No Registration Required**: Users can start chatting immediately

### 2. Default User Login (Hidden Access)
- **Secret Login Page**: `/login.html` - not linked from main interface
- **Credentials**: Username: `defaultuser`, Password: `user1default`
- **Admin Dashboard**: Default user can see all active chat sessions
- **Real-time Messaging**: Default user can respond to any chat session
- **Session Management**: View and manage multiple user conversations

### 3. Chat Functionality
- **Message Storage**: All messages stored in SQLite database
- **Real-time Updates**: Messages appear instantly for both parties
- **Typing Indicators**: Show when someone is typing
- **Message History**: Persistent chat history for default user
- **Multiple Sessions**: Support for multiple concurrent users

### 4. Interactive Features
- **AI Personality**: Pre-programmed responses that seem intelligent
- **Context Awareness**: Remember conversation context
- **Response Delay**: Simulate AI thinking time
- **Error Handling**: Graceful handling of connection issues

## User Journey

### Regular User Path:
1. Land on chat interface
2. See welcome message from "AI"
3. Start conversation
4. Receive convincing AI-like responses
5. Continue chatting unaware it's a human

### Default User Path:
1. Navigate to login page
2. Enter credentials
3. Access dashboard with all active chats
4. Select conversation to join
5. Respond to users in real-time
6. Monitor multiple conversations simultaneously

## Technical Implementation
- **Frontend**: Mobile-first responsive design
- **Backend**: SQLite for message persistence
- **Real-time**: WebSocket-like simulation using polling
- **Authentication**: Simple session management
- **Database**: Store users, messages, and sessions