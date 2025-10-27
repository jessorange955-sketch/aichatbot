// Main JavaScript functionality for the prank chat app
// This file handles the core chat functionality and API interactions

class ChatApp {
    constructor() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatContainer = document.getElementById('chat-container');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.sessionId = this.generateSessionId();
        this.lastMessageId = 0;
        this.pollingInterval = null;
        
        this.initializeEventListeners();
        this.loadChatHistory();
        this.createSession();
        this.startPolling();
    }
    
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Auto-resize input
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });
    }
    
    async createSession() {
        try {
            const response = await fetch('/api/session/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: this.sessionId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.sessionId = data.sessionId;
                console.log('Session created:', data.sessionId);
            }
        } catch (error) {
            console.error('Error creating session:', error);
        }
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Send message to server
        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.messageId) {
                this.lastMessageId = data.messageId;
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage("I'm having trouble connecting right now. Please try again.", 'ai');
        }
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble flex items-start space-x-3';
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="flex-1"></div>
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-3 max-w-xs ml-3">
                    <p class="text-sm">${text}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="ai-avatar w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div class="glass-morphism rounded-lg p-3 max-w-xs">
                    <p class="text-sm">${text}</p>
                </div>
            `;
        }
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Animate message appearance
        anime({
            targets: messageDiv,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            easing: 'easeOutQuart'
        });
    }
    
    showTypingIndicator() {
        this.typingIndicator.classList.remove('hidden');
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.classList.add('hidden');
    }
    
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    async loadChatHistory() {
        try {
            const response = await fetch(`/api/chat/history?sessionId=${this.sessionId}`);
            const data = await response.json();
            
            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(msg => {
                    this.addMessage(msg.text, msg.sender);
                    this.lastMessageId = Math.max(this.lastMessageId, msg.id);
                });
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    startPolling() {
        this.pollingInterval = setInterval(() => {
            this.checkNewMessages();
        }, 2000);
    }
    
    async checkNewMessages() {
        try {
            const response = await fetch(`/api/chat/new-messages?sessionId=${this.sessionId}&lastMessageId=${this.lastMessageId}`);
            const data = await response.json();
            
            if (data.success && data.messages && data.messages.length > 0) {
                data.messages.forEach(msg => {
                    if (msg.id > this.lastMessageId) {
                        this.hideTypingIndicator();
                        this.addMessage(msg.text, msg.sender);
                        this.lastMessageId = msg.id;
                    }
                });
            }
        } catch (error) {
            console.error('Error checking new messages:', error);
        }
    }
    
    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }
}

// Login Manager for admin access
class LoginManager {
    constructor() {
        this.form = document.getElementById('login-form');
        this.button = document.getElementById('login-button');
        this.buttonText = document.getElementById('button-text');
        this.buttonLoading = document.getElementById('button-loading');
        this.messageArea = document.getElementById('message-area');
        
        if (this.form) {
            this.initializeEventListeners();
        }
    }
    
    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Add input animations
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                anime({
                    targets: input,
                    scale: [1, 1.02],
                    duration: 200,
                    easing: 'easeOutQuart'
                });
            });
            
            input.addEventListener('blur', () => {
                anime({
                    targets: input,
                    scale: [1.02, 1],
                    duration: 200,
                    easing: 'easeOutQuart'
                });
            });
        });
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const username = formData.get('username');
        const password = formData.get('password');
        
        // Validate input
        if (!username || !password) {
            this.showMessage('Please enter both username and password', 'error');
            return;
        }
        
        // Show loading state
        this.setLoadingState(true);
        this.hideMessage();
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Show success message
                this.showMessage('Login successful! Redirecting to dashboard...', 'success');
                
                // Animate success
                anime({
                    targets: this.button,
                    scale: [1, 1.1, 1],
                    backgroundColor: ['#06b6d4', '#10b981'],
                    duration: 600,
                    easing: 'easeOutQuart'
                });
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
                
            } else {
                // Show error message
                this.showMessage(data.message || 'Invalid username or password', 'error');
                this.setLoadingState(false);
                
                // Animate error
                anime({
                    targets: this.form,
                    translateX: [-10, 10, -10, 10, 0],
                    duration: 400,
                    easing: 'easeOutQuart'
                });
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('An error occurred. Please try again.', 'error');
            this.setLoadingState(false);
        }
    }
    
    setLoadingState(loading) {
        if (loading) {
            this.button.disabled = true;
            this.buttonText.classList.add('hidden');
            this.buttonLoading.classList.remove('hidden');
        } else {
            this.button.disabled = false;
            this.buttonText.classList.remove('hidden');
            this.buttonLoading.classList.add('hidden');
        }
    }
    
    showMessage(text, type) {
        this.messageArea.innerHTML = `
            <div class="${type}-message rounded-lg p-3 text-sm">
                ${text}
            </div>
        `;
        this.messageArea.classList.remove('hidden');
        
        // Animate message appearance
        anime({
            targets: this.messageArea,
            opacity: [0, 1],
            translateY: [-10, 0],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }
    
    hideMessage() {
        this.messageArea.classList.add('hidden');
    }
}

// Initialize appropriate class based on current page
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the login page
    if (document.getElementById('login-form')) {
        new LoginManager();
        
        // Add entrance animation
        anime({
            targets: '.glass-morphism',
            opacity: [0, 1],
            translateY: [50, 0],
            duration: 800,
            easing: 'easeOutQuart'
        });
    }
    
    // Check if we're on the chat page
    if (document.getElementById('message-input')) {
        new ChatApp();
    }
});