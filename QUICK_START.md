# 🚀 Restaurant POS - Quick Start Guide

## ⚡ Starting the System

### Option 1: Use the Startup Script (Recommended)

```bash
cd /Users/admin/restaurant-billing-system
./START_SYSTEM.sh
```

### Option 2: Manual Start

```bash
# Terminal 1 - Backend
cd /Users/admin/restaurant-billing-system
node server.js

# Terminal 2 - Frontend
cd /Users/admin/restaurant-billing-system/client
npx serve -s build -l 3000
```

---

## 🔑 Login Credentials

| Role    | Username | Password   | Access                        |
| ------- | -------- | ---------- | ----------------------------- |
| Cashier | cashier  | cashier123 | **Premium Order Taking Page** |
| Admin   | admin    | admin123   | Dashboard, Reports, Settings  |
| Owner   | owner    | owner123   | Owner Portal, All Features    |
| Chef    | chef     | chef123    | Kitchen Display               |

---

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5002

---

## 🎨 Premium Features

### Order Taking Page (Cashier)

✨ **Beautiful glassy design** with:

- Backdrop blur effects
- Gradient blue buttons
- Smooth hover animations
- Professional billing interface
- Real-time order summary
- Table selection
- Category filters
- Search functionality

### Dashboard (Admin/Owner)

📊 Charts and analytics:

- Sales trends
- Order statistics
- Top items
- Staff performance

---

## 🛑 Stopping the System

```bash
pkill -9 node
```

Or press `Ctrl+C` in the terminal windows.

---

## 🔧 Troubleshooting

### Port Already in Use Error

```bash
lsof -ti:5002 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Backend Not Responding

Check logs:

```bash
tail -50 /Users/admin/restaurant-billing-system/server.log
```

### Frontend Not Loading

1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Restart frontend

### Rate Limit Error (429)

Wait 1 minute or restart backend:

```bash
lsof -ti:5002 | xargs kill -9
cd /Users/admin/restaurant-billing-system
node server.js > server.log 2>&1 &
```

---

## 📱 First Time Setup

1. **Start the system** using the startup script
2. **Open browser** to http://localhost:3000
3. **Login as Cashier** to see the premium order taking page
4. **Login as Admin** to access dashboard and settings

---

## ✨ What's New - Premium Design

The Order Taking page now features:

- **Glassy backdrop-blur panels** for a modern look
- **Gradient buttons** (blue to indigo)
- **Professional card layouts** with shadows
- **Smooth animations** on hover
- **Responsive design** for all screen sizes
- **Real-time billing summary** sticky panel
- **Category-based menu filtering**
- **Search functionality**
- **Table selection** with visual feedback

---

## 📞 Need Help?

- Check `server.log` for backend errors
- All credentials end with "123" (role + "123")
- Use lowercase usernames
- Hard refresh browser if styles don't load

---

**🎉 Enjoy your premium Restaurant POS system!**
