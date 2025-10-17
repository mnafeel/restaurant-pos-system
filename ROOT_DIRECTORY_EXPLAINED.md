# 📁 Root Directory Explained (Render.com)

**What "Root Directory" means when deploying on Render**

---

## 🎯 **Simple Answer:**

**Root Directory** = Where your code starts in your GitHub repository.

---

## 📂 **Your Repository Structure:**

```
restaurant-pos-system/          ← ROOT of repository
├── client/                     ← Frontend code here
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server.js                   ← Backend code here
├── package.json                ← Backend dependencies
└── README.md
```

---

## 🎯 **When Deploying on Render:**

### **For BACKEND (Node.js):**

**Root Directory:** _(leave empty)_

**Why?**

- Your `server.js` is in the root folder
- `package.json` is in the root folder
- Render starts from the top of your repository

**What Render does:**

1. Goes to repository root
2. Finds `package.json`
3. Runs `npm install`
4. Runs `node server.js`

---

### **For FRONTEND (React):**

**Root Directory:** `client`

**Why?**

- Your React code is inside the `client/` folder
- `client/package.json` has React dependencies
- Render needs to go INTO the client folder first

**What Render does:**

1. Goes to repository root
2. Opens `client/` folder
3. Finds `client/package.json`
4. Runs `npm install && npm run build`
5. Uses `client/build/` folder

---

## 📋 **Visual Example:**

### **BACKEND Deployment:**

```
GitHub Repository:
├── restaurant-pos-system/
    ├── server.js          ← Render starts HERE
    ├── package.json       ← Uses THIS
    └── client/

Root Directory: (empty)
              = Start at top level
```

### **FRONTEND Deployment:**

```
GitHub Repository:
├── restaurant-pos-system/
    ├── server.js
    └── client/            ← Render starts HERE
        ├── src/
        ├── public/
        ├── package.json   ← Uses THIS
        └── build/         ← Serves THIS

Root Directory: client
              = Start inside client folder
```

---

## 🔍 **Common Mistakes:**

### **❌ WRONG - Backend with "client" root:**

```
Root Directory: client
```

**Result:** Error! server.js not found!

### **✅ CORRECT - Backend with empty root:**

```
Root Directory: (leave empty)
```

**Result:** Works! Finds server.js ✓

---

### **❌ WRONG - Frontend with empty root:**

```
Root Directory: (leave empty)
```

**Result:** Error! No React app in root!

### **✅ CORRECT - Frontend with "client":**

```
Root Directory: client
```

**Result:** Works! Finds React app ✓

---

## 📝 **On Render Dashboard:**

### **Backend Service Configuration:**

| Field              | Value                  |
| ------------------ | ---------------------- |
| **Name**           | restaurant-pos-backend |
| **Root Directory** | _(leave empty)_        |
| **Build Command**  | npm install            |
| **Start Command**  | node server.js         |

**Why empty?** Because `server.js` is at the top level.

---

### **Frontend Static Site Configuration:**

| Field                 | Value                        |
| --------------------- | ---------------------------- |
| **Name**              | restaurant-pos-frontend      |
| **Root Directory**    | `client`                     |
| **Build Command**     | npm install && npm run build |
| **Publish Directory** | build                        |

**Why "client"?** Because React app is inside `client/` folder.

---

## 💡 **How to Know What to Put:**

### **Question:** Where is the `package.json` file?

**For Backend:**

- `package.json` is in root folder
- Root Directory = _(empty)_

**For Frontend:**

- `package.json` is in `client/` folder
- Root Directory = `client`

---

## 🎯 **Summary Table:**

| Deployment   | Root Directory | Reason                                 |
| ------------ | -------------- | -------------------------------------- |
| **Backend**  | _(empty)_      | server.js and package.json are in root |
| **Frontend** | `client`       | React app is inside client/ folder     |

---

## 📸 **Screenshot Guide:**

### **Backend (leave empty):**

```
┌─────────────────────────────────────┐
│ Root Directory                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │  ← Leave BLANK
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### **Frontend (type "client"):**

```
┌─────────────────────────────────────┐
│ Root Directory                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ client                          │ │  ← Type: client
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔧 **If You Made a Mistake:**

### **Wrong root directory set?**

**Fix it:**

1. Go to Render dashboard
2. Click on your service
3. Settings → Build & Deploy
4. Change "Root Directory"
5. Save changes
6. Manual Deploy → Deploy latest commit

---

## ✅ **Quick Reference:**

**When deploying your Restaurant POS:**

| What                       | Root Directory  |
| -------------------------- | --------------- |
| **Backend (Web Service)**  | _(leave empty)_ |
| **Frontend (Static Site)** | `client`        |

**That's it!**

---

## 🎓 **Additional Examples:**

### **If your structure was different:**

**Example 1:**

```
my-project/
├── backend/
│   └── server.js
└── frontend/
    └── src/
```

Backend root: `backend`  
Frontend root: `frontend`

**Example 2:**

```
my-project/
├── app.js
└── public/
```

Backend root: _(empty)_  
Frontend root: `public`

**Your actual structure:**

```
restaurant-pos-system/
├── server.js          ← Backend
└── client/            ← Frontend
```

Backend root: _(empty)_  
Frontend root: `client` ✅

---

## 💡 **Remember:**

**Root Directory** = **Starting folder** for Render to look for your code.

- Backend starts at repository top → empty
- Frontend starts in client folder → "client"

---

**🎯 For your POS:**

- **Backend:** Leave empty
- **Frontend:** Type `client`

That's all you need to know! ✅
