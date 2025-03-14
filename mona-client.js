class MonaClient {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://api.mona.gallery';
        this.accessToken = null;
    }

    async requestOTP(email) {
        const response = await fetch(`${this.baseUrl}/auth/request-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });
        return await response.json();
    }

    async verifyOTP(email, otp) {
        const response = await fetch(`${this.baseUrl}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });
        const data = await response.json();
        if (data.accessToken) {
            this.accessToken = data.accessToken;
        }
        return data;
    }

    async getUserProfile() {
        if (!this.accessToken) throw new Error('Not authenticated');
        const response = await fetch(`${this.baseUrl}/users/me`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
            },
        });
        return await response.json();
    }

    async getCommunityAssets() {
        if (!this.accessToken) throw new Error('Not authenticated');
        const response = await fetch(`${this.baseUrl}/assets/community`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
            },
        });
        return await response.json();
    }

    async getUserAssets() {
        if (!this.accessToken) throw new Error('Not authenticated');
        const response = await fetch(`${this.baseUrl}/assets/user`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
            },
        });
        return await response.json();
    }

    setAccessToken(token) {
        this.accessToken = token;
    }

    getAccessToken() {
        return this.accessToken;
    }
}

// Make it available in both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.MonaClient = MonaClient;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonaClient;
} 