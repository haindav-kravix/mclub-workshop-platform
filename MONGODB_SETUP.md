# 🔐 MongoDB Authentication Issue - Troubleshooting

**Status:** Authentication Failed (bad auth)

## What Happened

Your MongoDB connection string is correct in format, but the authentication failed. This usually means one of these issues:

1. **Username/Password is incorrect**
2. **IP address is not whitelisted in MongoDB Atlas**
3. **Database user doesn't have proper permissions**

## How to Fix

### Step 1: Verify MongoDB Atlas Settings

1. Go to: https://cloud.mongodb.com
2. Log in to your MongoDB Atlas account
3. Go to **Clusters** → **Security** → **Database Access**
4. Find the user `nanihaindav99145_db_user`
5. Verify the password is correct (it should be `Haindav@1`)

### Step 2: Check IP Whitelist

1. Go to **Clusters** → **Security** → **Network Access**
2. Look for your IP address (or 0.0.0.0/0 for anywhere)
3. If not there, click "Add IP Address"
4. For development: Add `0.0.0.0/0` (allows from anywhere)
5. For production: Add your specific IP address

### Step 3: Verify Database Name

Your connection string uses `workshop-registration` as the database name.

To create this database automatically:
- The database will be created when the first document is inserted
- Or create it manually in MongoDB Atlas

### Step 4: Test Connection

Run this command to test your connection:

```bash
# Install mongodb-shell if you don't have it
npm install -g mongodb-cli-tools

# Test connection
mongosh "mongodb+srv://nanihaindav99145_db_user:Haindav%401@cluster0.tkl0k00.mongodb.net/workshop-registration"
```

If that works, you'll see:
```
connecting to: mongodb://...
test>
```

## Connection String Breakdown

```
mongodb+srv://username:password@cluster0.tkl0k00.mongodb.net/database-name?options

├─ mongodb+srv = MongoDB Atlas (SRV connection)
├─ username = nanihaindav99145_db_user
├─ password = Haindav@1 (encoded as Haindav%401)
├─ cluster = cluster0.tkl0k00.mongodb.net
├─ database = workshop-registration
└─ options = retryWrites=true&w=majority
```

## Actions to Take

1. ✅ Verify username and password match exactly
2. ✅ Check that your IP is whitelisted
3. ✅ Create the database (it will auto-create on first use)
4. ✅ Test connection with mongosh
5. ✅ Then restart the backend server

## Current Configuration

**Server .env file has been updated with:**
- ✅ MongoDB URI: `mongodb+srv://nanihaindav99145_db_user:Haindav%401@cluster0.tkl0k00.mongodb.net/workshop-registration`
- ✅ Google Client ID: Configured
- ✅ JWT Secret: Generated
- ✅ Frontend .env: Configured with Google Client ID

## Once Authentication Works

You'll see this in the server logs:
```
✅ MongoDB connected successfully
✅ Server running on port 5000
```

Then the system will be fully operational!

## Need More Help?

Check MongoDB Atlas docs: https://docs.mongodb.com/manual/reference/connection-string/

