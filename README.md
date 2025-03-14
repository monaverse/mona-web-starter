# Mona Gallery Client Library

A simple and lightweight client library for integrating Mona Gallery functionality into your web applications.

## Installation

### Using NPM
```bash
npm install mona-gallery-client
```

### Using CDN
```html
<script src="https://cdn.jsdelivr.net/npm/mona-gallery-client@1.0.0/mona-client.js"></script>
```

## Usage

### Initialize the client
```javascript
// If using modules
import MonaClient from 'mona-gallery-client';

// Create a new instance
const mona = new MonaClient();

// Optionally configure with custom options
const mona = new MonaClient({
    baseUrl: 'https://custom-api-url.com' // Optional: defaults to https://api.mona.gallery
});
```

### Authentication
```javascript
// Request OTP
const requestResult = await mona.requestOTP('user@example.com');

// Verify OTP
const verifyResult = await mona.verifyOTP('user@example.com', '123456');
// The access token is automatically stored in the client instance
```

### Get User Profile
```javascript
const profile = await mona.getUserProfile();
```

### Get Assets
```javascript
// Get community assets
const communityAssets = await mona.getCommunityAssets();

// Get user's assets
const userAssets = await mona.getUserAssets();
```

### Token Management
```javascript
// Manually set an access token
mona.setAccessToken('your-access-token');

// Get the current access token
const token = mona.getAccessToken();
```

## Error Handling

All methods return promises and can throw errors. It's recommended to use try-catch blocks:

```javascript
try {
    const profile = await mona.getUserProfile();
} catch (error) {
    console.error('Error fetching profile:', error);
}
```

## Examples

### Complete Authentication Flow
```javascript
try {
    // Request OTP
    await mona.requestOTP('user@example.com');
    
    // After user receives OTP via email
    const result = await mona.verifyOTP('user@example.com', '123456');
    
    if (result.accessToken) {
        // Get user profile
        const profile = await mona.getUserProfile();
        console.log('Logged in user:', profile);
        
        // Get user's assets
        const assets = await mona.getUserAssets();
        console.log('User assets:', assets);
    }
} catch (error) {
    console.error('Error:', error);
}
```

## License

MIT License 