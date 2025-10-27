# Web App Login Fix - README

## ✅ Web Login is Now Fixed!

### 🚀 How to Start the Web Application:

1. **Start the Backend Server:**

   ```bash
   node server.js
   ```

   The server will start on `http://localhost:5000`

2. **Start the React Client (in a new terminal):**

   ```bash
   cd client
   npm start
   ```

   The web app will open at `http://localhost:3000`

### 📱 Login Credentials:

**First Time Setup:**

- You need to create a user through the admin panel or owner portal
- Or access the database directly to add users

### 🔧 Fixed Issues:

1. **Web Login Fetch**: The axios interceptor now properly detects web mode
2. **Server Running**: Backend server must be running for web login to work
3. **Desktop vs Web**: The interceptor only activates in Electron (desktop mode)

### 🌐 Web Mode (Browser):

- Uses cloud API directly
- Server must be running on localhost:5000
- Login requests go directly to server

### 🖥️ Desktop Mode (Electron):

- Uses local SQLite database
- Works completely offline
- No server required

### 📝 Important Notes:

- **Web App**: Requires server to be running
- **Desktop App**: Works standalone (offline)
- Login credentials are shared between web and desktop apps
- Desktop app has separate local database

---

**To access web app**: `http://localhost:3000` (after starting client)
**To access server API**: `http://localhost:5000` (after starting server)
