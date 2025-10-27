class RegisterManager {
    constructor() {
        this.form = document.getElementById('register-form');
        this.button = document.getElementById('register-button');
        this.buttonText = document.getElementById('button-text');
        this.buttonLoading = document.getElementById('button-loading');
        this.messageArea = document.getElementById('message-area');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleRegister(e));
        
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
    
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const username = formData.get('username');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');
        
        if (!username || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        this.setLoadingState(true);
        this.hideMessage();
        
        try {
            const response = await fetch('/api/auth/register', {
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
                this.showMessage('Account created successfully! Redirecting...', 'success');
                
                anime({
                    targets: this.button,
                    scale: [1, 1.1, 1],
                    backgroundColor: ['#10b981', '#059669'],
                    duration: 600,
                    easing: 'easeOutQuart'
                });
                
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1500);
                
            } else {
                this.showMessage(data.message || 'Registration failed', 'error');
                this.setLoadingState(false);
                
                anime({
                    targets: this.form,
                    translateX: [-10, 10, -10, 10, 0],
                    duration: 400,
                    easing: 'easeOutQuart'
                });
            }
            
        } catch (error) {
            console.error('Registration error:', error);
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

document.addEventListener('DOMContentLoaded', () => {
    new RegisterManager();
    
    anime({
        targets: '.glass-morphism',
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 800,
        easing: 'easeOutQuart'
    });
});
