# 🖥️ Restaurant POS - Desktop Application Setup

## Hybrid Cloud-Local System

This system combines **cloud access** (your current website) with **desktop software** that works offline.

---

## 📦 What You Get

### **Two Ways to Use:**

1. **Cloud Website** (Vercel)
   - Access from anywhere
   - Multi-device sync
   - Real-time updates
   - Works on phone, tablet, computer

2. **Desktop App** (Electron)
   - Windows .exe installer
   - Mac .dmg installer
   - Local database backup
   - Works offline
   - Auto-syncs with cloud

---

## 🚀 Building the Desktop App

### **For Windows (.exe):**

```bash
# Build Windows installer
npm run build-win
```

Output: `dist/Restaurant POS Setup 1.0.0.exe`

### **For Mac (.dmg):**

```bash
# Build Mac installer  
npm run build-mac
```

Output: `dist/Restaurant POS-1.0.0.dmg`

### **For Both:**

```bash
# Build both Windows and Mac
npm run build-all
```

---

## 📥 Installation Instructions

### **Windows:**

1. Download `Restaurant POS Setup 1.0.0.exe`
2. Double-click to run installer
3. Choose installation location
4. Click "Install"
5. Desktop shortcut created automatically
6. Launch from desktop or Start menu

### **Mac:**

1. Download `Restaurant POS-1.0.0.dmg`
2. Double-click to open
3. Drag app to Applications folder
4. Open from Applications
5. (First time: Right-click → Open to bypass Gatekeeper)

---

## 🔄 How Hybrid Sync Works

### **Online Mode (Default):**
- App connects to cloud database
- All changes sync instantly
- Works with other devices
- Multi-device support

### **Offline Mode (Automatic):**
- Internet drops → Auto-switch to local database
- Continue working normally
- All changes queued locally
- No data loss

### **Back Online:**
- Internet returns → Automatic sync
- Local changes uploaded to cloud
- Fresh data downloaded
- All devices in sync

---

## 💾 Local Database

- **Location:** User data folder
  - Windows: `C:\Users\[Username]\AppData\Roaming\restaurant-billing-system\`
  - Mac: `~/Library/Application Support/restaurant-billing-system/`

- **File:** `restaurant-local.db` (SQLite)

- **Sync Queue:** Tracks offline changes for cloud sync

---

## 🔧 Development

### **Run in Dev Mode:**

```bash
# Terminal 1: Start React dev server
cd client
npm start

# Terminal 2: Start Electron
npm run electron-dev
```

### **Debug:**

- DevTools open automatically in development
- Check console for sync status
- Monitor network requests

---

## 📊 Features

### **Cloud (Website):**
- ✅ Multi-device access
- ✅ Remote management
- ✅ Real-time sync
- ✅ PWA installable
- ✅ Works on all devices

### **Desktop App:**
- ✅ Offline capable
- ✅ Local database
- ✅ Auto-sync
- ✅ Professional installer
- ✅ Native feel

### **Hybrid Benefits:**
- ✅ Always accessible
- ✅ Never lose data
- ✅ Fast local operations
- ✅ Cloud backup
- ✅ Multi-device + offline

---

## 🛠️ Technical Details

### **Stack:**
- **Frontend:** React (from client/build)
- **Desktop:** Electron
- **Local DB:** SQLite
- **Cloud DB:** PostgreSQL (Render)
- **API:** Node.js/Express

### **Sync Strategy:**
- Check connectivity every request
- Queue local changes when offline
- Sync queue every 5 minutes (auto)
- Manual sync: Ctrl+R / Cmd+R

### **Database Tables:**
All cloud tables mirrored locally:
- users
- shops
- menu_items
- orders
- order_items
- bills
- sync_queue (local only)

---

## 🎯 Usage Scenarios

### **Scenario 1: Restaurant (Stable Internet)**
- Primary: Cloud website
- Backup: Desktop app installed
- If internet drops: Desktop continues working
- Internet returns: Auto-syncs

### **Scenario 2: Food Truck (Unreliable Internet)**
- Primary: Desktop app
- Syncs when WiFi available
- Works offline always
- Cloud backup when online

### **Scenario 3: Multi-Location**
- Each location: Desktop app + cloud access
- Manager: Cloud access from anywhere
- All locations sync to cloud
- Offline independence per location

---

## 📝 Notes

### **Data Priority:**
- Cloud is source of truth
- Local is backup + offline cache
- Conflicts: Cloud data wins
- Manual resolution if needed

### **Performance:**
- Online: API latency ~100-500ms
- Offline: Local DB ~1-10ms
- Sync: Background, non-blocking
- Updates: Automatic when available

### **Security:**
- Local database encrypted
- Credentials stored securely
- HTTPS for cloud sync
- JWT authentication

---

## 🆘 Troubleshooting

### **App won't start:**
- Check if port 3000 is free
- Delete local database and restart
- Reinstall application

### **Sync not working:**
- Check internet connection
- Manual sync: Menu → File → Sync Now
- Check sync queue in database

### **Database issues:**
- Backup: Copy `restaurant-local.db`
- Reset: Delete database file, restart app
- Restore: Replace with backup file

---

## 📦 Distribution

### **To share installers:**

1. Build: `npm run build-all`
2. Files in `dist/` folder:
   - `Restaurant POS Setup 1.0.0.exe` (Windows)
   - `Restaurant POS-1.0.0.dmg` (Mac)
3. Upload to cloud storage / USB drive
4. Share with users
5. Users: Download and install

### **Updates:**
- Rebuild with new version number
- Distribute new installers
- Users: Install over old version
- Data preserved automatically

---

## 🎉 Summary

You now have:
- ✅ Cloud website (multi-device)
- ✅ Desktop app (offline backup)
- ✅ Auto-sync (hybrid mode)
- ✅ Windows + Mac support
- ✅ Professional installers

**Best of both worlds: Cloud + Local!** 🚀

