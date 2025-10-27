# 🎭 Default User Instructions - Prank Chat App

## How the Prank Works

This app appears to be an AI chatbot to regular users, but **all their messages actually go to you** (the default user). You can then respond as if you're an AI, creating a hilarious prank experience!

## Getting Started

### 1. Access Your Dashboard
Visit: `http://localhost:3000/default-user.html` (or your deployed URL)

### 2. What You'll See
- **Left Panel**: All incoming messages from users who think they're chatting with AI
- **Right Panel**: Chat history and response interface

### 3. How to Respond
1. Click on any message in the left panel to view the full conversation
2. Type your response in the text area (pretend to be an AI!)
3. Click "🤖 Send as AI" to send your response
4. The user will see your message as if it came from an AI

## Tips for a Great Prank

### 🤖 Act Like an AI
- Use phrases like "As an AI, I..." or "Based on my analysis..."
- Be helpful but occasionally give quirky or unexpected responses
- Sometimes ask follow-up questions to keep the conversation going

### 🎯 Response Ideas
- **Helpful AI**: "I understand your question. Let me help you with that..."
- **Quirky AI**: "That's fascinating! As an AI, I find human behavior quite intriguing..."
- **Confused AI**: "I'm processing your request... *beep boop* ...could you clarify what you mean?"
- **Overly Enthusiastic AI**: "WOW! That's an AMAZING question! I'm so excited to help! 🤖✨"

### ⚡ Quick Response Tips
- The dashboard auto-refreshes every 10 seconds
- Messages that need responses are highlighted in red
- Use Shift+Enter to quickly send responses
- Click the refresh button for instant updates

## Dashboard Features

### 📨 Message Panel
- Shows all incoming user messages
- Red highlighting = needs response
- Counter shows how many messages need replies
- Click any message to view full conversation

### 💬 Response Panel
- View complete chat history
- See what the user has said and how you've responded
- Type and send responses that appear as "AI" messages

### 🔄 Auto-Refresh
- Page automatically updates every 10 seconds
- Manual refresh button available
- Real-time conversation flow

## Example Conversation Flow

**User sees**: "Hello AI, can you help me with my homework?"
**You respond as AI**: "Hello! I'd be happy to help with your homework. What subject are you working on?"
**User sees**: AI response and continues chatting, never knowing it's actually you!

## Technical Notes

### Default User Account
- Username: `defaultuser`
- Password: `user1default`
- This account is created automatically when the database initializes

### Multiple Sessions
- You can handle multiple conversations simultaneously
- Each user gets their own session ID
- Switch between conversations by clicking different messages

### Response Status
- Green = Response sent successfully
- Red = Error occurred
- Messages update in real-time

## Deployment

When deployed to production:
1. Share the main app URL with your prank targets
2. Keep the `/default-user.html` URL secret (that's your control panel!)
3. Respond to messages in real-time for the best prank experience

## Have Fun! 🎉

Remember, this is all in good fun. Be creative with your AI responses and enjoy watching people interact with what they think is an AI chatbot!

---

**Quick Access URLs:**
- Main App (for users): `/`
- Your Dashboard: `/default-user.html`
- Health Check: `/api/health`