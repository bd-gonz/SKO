// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// API Helper class
class API {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        if (data.success && data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.success && data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    async verifyToken() {
        try {
            const data = await this.request('/auth/verify');
            return data;
        } catch (error) {
            this.setToken(null);
            throw error;
        }
    }

    // Stats endpoints
    async getStats() {
        return await this.request('/stats');
    }

    async updateStats(gameResult, difficulty, playtime) {
        return await this.request('/stats/update', {
            method: 'POST',
            body: JSON.stringify({ gameResult, difficulty, playtime })
        });
    }

    async resetStats() {
        return await this.request('/stats/reset', {
            method: 'POST'
        });
    }

    // Logout
    logout() {
        this.setToken(null);
    }
}

// Export singleton instance
const api = new API();