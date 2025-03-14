#!/bin/bash

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if MONA_APP_ID is set in .env
if grep -q "YOUR_MONA_APPLICATION_ID" .env; then
    echo "Error: You need to set your MONA Application ID in the .env file before deploying."
    echo "Please replace 'YOUR_MONA_APPLICATION_ID' with your actual MONA Application ID."
    exit 1
fi

# Extract MONA_APP_ID from .env
MONA_APP_ID=$(grep MONA_APP_ID .env | cut -d '=' -f2)

# Update script.js with the actual MONA_APP_ID
sed -i '' "s/YOUR_MONA_APPLICATION_ID/$MONA_APP_ID/g" script.js

echo "Deploying to Vercel..."
vercel --prod

# Reset script.js to use the placeholder
sed -i '' "s/$MONA_APP_ID/YOUR_MONA_APPLICATION_ID/g" script.js

echo "Deployment complete!" 