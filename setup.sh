#!/bin/bash

# Workshop Registration System - Interactive Setup Script
# This script helps you configure MongoDB, Google OAuth, and other settings

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Workshop Registration System - Setup Configuration            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env files exist
if [ ! -f "server/.env" ]; then
    echo "❌ server/.env not found!"
    exit 1
fi

if [ ! -f "client/.env" ]; then
    echo "❌ client/.env not found!"
    exit 1
fi

# Function to update .env files
update_env() {
    local file=$1
    local key=$2
    local value=$3
    
    if [ -f "$file" ]; then
        if grep -q "^$key=" "$file"; then
            # Update existing line (macOS compatible)
            sed -i '' "s|^$key=.*|$key=$value|" "$file"
        else
            # Append new line
            echo "$key=$value" >> "$file"
        fi
    fi
}

# Function to read user input
read_input() {
    local prompt=$1
    local default=$2
    
    if [ -z "$default" ]; then
        read -p "$prompt: " input
    else
        read -p "$prompt [$default]: " input
        input=${input:-$default}
    fi
    echo "$input"
}

echo "📝 Configuration Guide"
echo ""
echo "This script will help you set up:"
echo "  1. MongoDB Connection String"
echo "  2. Google OAuth Credentials"
echo "  3. JWT Secret Key"
echo ""

# MongoDB Configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: MongoDB Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Do you have a MongoDB Atlas cluster set up?"
echo "If not, visit: https://www.mongodb.com/cloud/atlas"
echo ""

mongodb_uri=$(read_input "Enter your MongoDB URI")

if [ ! -z "$mongodb_uri" ]; then
    update_env "server/.env" "MONGODB_URI" "$mongodb_uri"
    echo "✅ MongoDB URI configured"
else
    echo "⚠️  MongoDB URI not set - server won't be able to connect"
fi

echo ""

# Google OAuth Configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Google OAuth Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Do you have Google OAuth credentials?"
echo "If not, visit: https://console.cloud.google.com"
echo ""

google_client_id=$(read_input "Enter your Google Client ID")

if [ ! -z "$google_client_id" ]; then
    update_env "server/.env" "GOOGLE_CLIENT_ID" "$google_client_id"
    update_env "client/.env" "VITE_GOOGLE_CLIENT_ID" "$google_client_id"
    echo "✅ Google Client ID configured"
fi

echo ""

google_client_secret=$(read_input "Enter your Google Client Secret")

if [ ! -z "$google_client_secret" ]; then
    update_env "server/.env" "GOOGLE_CLIENT_SECRET" "$google_client_secret"
    echo "✅ Google Client Secret configured"
fi

echo ""

# JWT Secret Configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: JWT Secret Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate a random JWT secret
jwt_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || echo "default-secret-change-me")

echo "Generated JWT Secret: $jwt_secret"
echo ""

update_env "server/.env" "JWT_SECRET" "$jwt_secret"
echo "✅ JWT Secret configured"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Your configuration has been saved to:"
echo "   • server/.env"
echo "   • client/.env"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Start the backend server:"
echo "   cd server && npm run dev"
echo ""
echo "2. Start the frontend server (in another terminal):"
echo "   cd client && npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "4. To set your account as admin:"
echo "   - Use MongoDB Compass or Atlas UI"
echo "   - Find your user document in the 'users' collection"
echo "   - Change 'isAdmin' from false to true"
echo ""
echo "📖 For more information, see: COMPLETE_SETUP.md"
echo ""

