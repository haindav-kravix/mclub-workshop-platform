# Deployment Guide - Workshop Registration System

This guide covers deploying both the frontend and backend to production.

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment (Node.js Server)](#backend-deployment)
3. [Frontend Deployment (React App)](#frontend-deployment)
4. [Database Considerations](#database-considerations)
5. [Environment Setup](#environment-setup)
6. [SSL/HTTPS Setup](#ssltls-setup)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables configured (MongoDB, Google OAuth, JWT Secret)
- [ ] Database backups enabled
- [ ] Google OAuth authorized redirect URIs updated
- [ ] SSL certificates obtained
- [ ] Domain name registered
- [ ] Monitoring/logging service set up
- [ ] Error tracking (e.g., Sentry) configured

---

## Backend Deployment

### Option 1: Heroku (Easiest)

#### 1. Install Heroku CLI
```bash
brew tap heroku/brew && brew install heroku
heroku login
```

#### 2. Prepare Your Repository
```bash
# In project root
git init
git add .
git commit -m "Initial commit"
```

#### 3. Create Heroku App
```bash
heroku create your-app-name
heroku stack:set heroku-22
```

#### 4. Configure Environment Variables
```bash
heroku config:set MONGODB_URI="your-mongodb-atlas-uri"
heroku config:set GOOGLE_CLIENT_ID="your-google-client-id"
heroku config:set GOOGLE_CLIENT_SECRET="your-google-secret"
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set NODE_ENV="production"
heroku config:set FRONTEND_URL="https://your-domain.com"
```

#### 5. Add Procfile in project root
```
web: cd server && npm start
```

#### 6. Update package.json in server/
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

#### 7. Deploy
```bash
git push heroku main
heroku logs --tail  # Watch deployment logs
```

**Cost:** Free tier available (but sleeps after 30 mins inactivity)

### Option 2: Railway

#### 1. Create Railway Project
- Go to [Railway](https://railway.app)
- Create new project
- Connect GitHub repository

#### 2. Add PostgreSQL/MongoDB
- Click "Add service"
- Select MongoDB Atlas
- Add your connection string

#### 3. Set Environment Variables
- Go to Variables
- Add all .env variables

#### 4. Deploy
- Railway auto-deploys on git push

**Cost:** $5/month minimum

### Option 3: DigitalOcean (More Control)

#### 1. Create Droplet
```bash
# Create a Ubuntu 22.04 droplet ($6/month)
# SSH into it: ssh root@your-ip
```

#### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Clone Your Repository
```bash
git clone https://github.com/yourusername/workshop-registration.git
cd workshop-registration/server
npm install
```

#### 4. Set Up Environment Variables
```bash
nano .env
# Paste your environment variables
```

#### 5. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 start server.js --name "workshop-api"
pm2 startup
pm2 save
```

#### 6. Set Up Nginx (Reverse Proxy)
```bash
sudo apt update
sudo apt install nginx

sudo nano /etc/nginx/sites-available/workshop
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/workshop /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Set Up SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Cost:** $5-20/month depending on size

### Option 4: AWS (Most Scalable)

#### 1. Create EC2 Instance
- Go to [AWS Console](https://console.aws.amazon.com)
- Create Ubuntu 22.04 instance
- Configure security groups (allow 80, 443, 5000)

#### 2. Install Dependencies
```bash
sudo apt update && sudo apt upgrade
sudo apt install nodejs npm nginx
```

#### 3. Deploy Application
Follow DigitalOcean steps 3-7 above

#### 4. Configure RDS (Managed Database)
- AWS handles MongoDB via DocumentDB or use Atlas

**Cost:** $5-50+/month depending on load

---

## Frontend Deployment

### Option 1: Vercel (Recommended for React)

#### 1. Install Vercel CLI
```bash
npm i -g vercel
```

#### 2. Deploy
```bash
cd client
vercel --prod
```

#### 3. Configure Environment
```bash
vercel env add VITE_API_URL
vercel env add VITE_GOOGLE_CLIENT_ID
vercel --prod
```

**Cost:** Free tier (with pro option)

### Option 2: Netlify

#### 1. Build Your App
```bash
cd client
npm run build
```

#### 2. Deploy
- Connect GitHub to [Netlify](https://netlify.com)
- Set build command: `npm run build`
- Set publish directory: `dist`

#### 3. Environment Variables
- In Site settings → Build & Deploy → Environment
- Add `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`

**Cost:** Free tier available

### Option 3: Serve from Node.js Backend

#### 1. Build Frontend
```bash
cd client
npm run build
```

#### 2. Copy to Server
```bash
mkdir -p server/public
cp -r client/dist/* server/public/
```

#### 3. Update server.js
```javascript
// After routes, add:
app.use(express.static(path.join(__dirname, 'public')));

// Catch all routes and serve index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

#### 4. Deploy as One Unit
```bash
git push heroku main  # Or your platform
```

---

## Database Considerations

### MongoDB Atlas Production Setup

1. **Create Production Cluster**
   - Dedicated cluster (not shared)
   - Multi-region replication
   - Automated backups

2. **Security**
   - Enable encryption at rest
   - Enable encryption in transit
   - Restrict network access to app servers only
   - Use strong database user passwords

3. **Backups**
   - Enable continuous backups
   - Set 30-day backup retention
   - Test restore procedures

4. **Monitoring**
   - Enable monitoring and logging
   - Set up alerts for high CPU/memory

### Scale as Needed
```
- 0-1000 users: M10 cluster ($57/month)
- 1000-10000 users: M20 cluster ($113/month)
- 10000+ users: M50+ cluster or sharding
```

---

## Environment Setup

### Production .env (Backend)
```env
PORT=5000
NODE_ENV=production

MONGODB_URI=mongodb+srv://prod_user:strong_password@prod-cluster.mongodb.net/workshop-db

GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-secret

JWT_SECRET=very-long-random-string-min-32-chars

FRONTEND_URL=https://your-domain.com

# Optional: Error Tracking
SENTRY_DSN=your-sentry-dsn
```

### Production .env (Frontend)
```env
VITE_API_URL=https://api.your-domain.com/api
VITE_GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
```

### Update Google OAuth
1. Go to Google Cloud Console
2. Update authorized origins:
   - `https://your-domain.com`
   - `https://www.your-domain.com`
3. Update authorized redirect URIs:
   - `https://your-domain.com/login`
   - `https://www.your-domain.com/login`

---

## SSL/TLS Setup

### Using Let's Encrypt (Free)

```bash
# On your server
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Renew automatically
sudo certbot renew --dry-run
```

### In Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring and Maintenance

### 1. Set Up Logging
```bash
# View Heroku logs
heroku logs --tail

# View Railway logs
# Via dashboard

# View DigitalOcean logs
tail -f /var/log/pm2/error.log
```

### 2. Monitor Performance
```bash
# PM2 monitoring
pm2 monit

# Heroku metrics
heroku metrics
```

### 3. Database Monitoring
- MongoDB Atlas: Monitoring tab in cloud portal
- Set up alerts for:
  - High CPU/Memory
  - Failed connections
  - Slow queries

### 4. Error Tracking
```bash
# Install Sentry
npm install @sentry/node

# In server.js
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### 5. Regular Maintenance
- [ ] Review logs weekly
- [ ] Monitor database growth
- [ ] Test backups monthly
- [ ] Update dependencies quarterly
- [ ] Review security vulnerabilities: `npm audit`

---

## Cost Comparison

| Platform | Frontend | Backend | Database | Total |
|----------|----------|---------|----------|-------|
| Vercel + Heroku + Atlas | Free | Free* | $57 | $57/mo |
| Vercel + Railway + Atlas | Free | $5 | $57 | $62/mo |
| Netlify + Netlify | Free | N/A | $57 | $57/mo** |
| DigitalOcean Only | Free** | $6 | $57 | $63/mo |

*Heroku free tier sleeps after 30 mins
**If serving frontend from same Node.js server

---

## Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Backend not responding, check server logs |
| 404 Routes Not Working | Check reverse proxy config, trailing slashes |
| Database Connection Failed | Check MONGODB_URI, IP whitelist |
| OAuth Not Working | Verify authorized origins in Google Cloud |
| Slow Performance | Check database indices, enable caching |
| Memory Issues | Increase instance size or enable horizontal scaling |

---

## Next Steps After Deployment

1. Set up monitoring alerts
2. Configure automated backups
3. Set up CI/CD pipeline for auto-deployment
4. Create runbook for common issues
5. Schedule regular security audits
6. Plan scaling strategy for growth

