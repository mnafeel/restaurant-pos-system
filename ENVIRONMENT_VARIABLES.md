# 🔑 Environment Variables for Deployment

**All environment key-value pairs needed for your Restaurant POS**

---

## 🎯 **Quick Answer:**

### **For BACKEND on Render:**

You need **4 environment variables**:

| Key | Value | Required |
|-----|-------|----------|
| `JWT_SECRET` | `your-random-secret-key-here` | ✅ YES |
| `PORT` | `5002` | ✅ YES |
| `TZ` | `Asia/Kolkata` | ✅ YES |
| `NODE_ENV` | `production` | ✅ YES |

### **For FRONTEND on Render:**

✅ **NO environment variables needed!**

The frontend gets the backend URL from the code (not environment variable).

---

## 📋 **BACKEND Environment Variables Explained:**

### **1. JWT_SECRET**

**What:** Secret key for JWT authentication

**Purpose:**
- Encrypts login tokens
- Keeps users logged in securely
- Signs and verifies JWTs

**Value:** Any random string (32+ characters recommended)

**Examples:**
```
JWT_SECRET = my-super-secret-restaurant-pos-key-2024
JWT_SECRET = kJ8n3Lm9Pq2Rt5Vw8Xy1Az4Bc7De0Fg3Hj6K
JWT_SECRET = change-this-to-something-random-and-long
```

**⚠️ IMPORTANT:**
- Must be secret (don't share!)
- Change from default
- Use random characters
- Different for each deployment

**How to generate random secret:**
```bash
# On Mac/Linux
openssl rand -base64 32
```

---

### **2. PORT**

**What:** Port number for backend server

**Purpose:**
- Where your backend listens
- Render uses this port

**Value:** `5002`

**Why 5002?**
- Your code uses port 5002
- Render expects this port
- Don't change it!

**In your code (server.js):**
```javascript
const PORT = process.env.PORT || 5002;
```

---

### **3. TZ (Timezone)**

**What:** Timezone for the server

**Purpose:**
- Sets server timezone to Indian Standard Time
- All timestamps use IST
- Dates in DD/MM/YYYY format

**Value:** `Asia/Kolkata`

**Why Asia/Kolkata?**
- India's timezone
- IST = UTC +5:30
- Your bills show correct Indian time

**Alternatives (if needed):**
- `Asia/Kolkata` - India (IST) ✅
- `America/New_York` - US Eastern
- `Europe/London` - UK
- `Asia/Dubai` - UAE
- `Asia/Singapore` - Singapore

---

### **4. NODE_ENV**

**What:** Environment mode

**Purpose:**
- Tells Node.js this is production
- Optimizes performance
- Disables debug features

**Value:** `production`

**Options:**
- `production` - For live deployment ✅
- `development` - For local testing
- `test` - For automated tests

**Why production?**
- Faster performance
- Better error handling
- Security optimizations
- No debug output

---

## 📝 **How to Add on Render:**

### **Step-by-Step:**

1. **When creating Web Service**, scroll to **"Environment Variables"**

2. **Click "Add Environment Variable"**

3. **Add Variable 1:**
   - Key: `JWT_SECRET`
   - Value: `your-random-secret-key-here`
   - Click outside or press Tab

4. **Click "Add Environment Variable"** again

5. **Add Variable 2:**
   - Key: `PORT`
   - Value: `5002`

6. **Click "Add Environment Variable"** again

7. **Add Variable 3:**
   - Key: `TZ`
   - Value: `Asia/Kolkata`

8. **Click "Add Environment Variable"** again

9. **Add Variable 4:**
   - Key: `NODE_ENV`
   - Value: `production`

10. **Done!** All 4 variables added ✅

---

## 🖼️ **Visual Example:**

```
┌──────────────────────────────────────────┐
│ Environment Variables                    │
│                                          │
│ ┌─────────────┬────────────────────────┐ │
│ │ Key         │ Value                  │ │
│ ├─────────────┼────────────────────────┤ │
│ │ JWT_SECRET  │ my-secret-key-123      │ │
│ ├─────────────┼────────────────────────┤ │
│ │ PORT        │ 5002                   │ │
│ ├─────────────┼────────────────────────┤ │
│ │ TZ          │ Asia/Kolkata           │ │
│ ├─────────────┼────────────────────────┤ │
│ │ NODE_ENV    │ production             │ │
│ └─────────────┴────────────────────────┘ │
│                                          │
│ [Add Environment Variable]               │
└──────────────────────────────────────────┘
```

---

## ✅ **COPY-PASTE READY:**

### **Environment Variable 1:**
```
Key:   JWT_SECRET
Value: change-this-to-random-secret-key-123456
```

### **Environment Variable 2:**
```
Key:   PORT
Value: 5002
```

### **Environment Variable 3:**
```
Key:   TZ
Value: Asia/Kolkata
```

### **Environment Variable 4:**
```
Key:   NODE_ENV
Value: production
```

---

## 🔐 **Security Best Practices:**

### **For JWT_SECRET:**

**❌ BAD (Don't use):**
```
JWT_SECRET = secret
JWT_SECRET = 123456
JWT_SECRET = password
```

**✅ GOOD (Use these):**
```
JWT_SECRET = kJ8n3Lm9Pq2Rt5Vw8Xy1Az4Bc7De0Fg3Hj6K
JWT_SECRET = restaurant-pos-secure-key-2024-mnafeel
JWT_SECRET = randomly-generated-long-string-here
```

**Generate random secret:**
```bash
# On Mac (Terminal)
openssl rand -base64 32

# Example output:
# kJ8n3Lm9Pq2Rt5Vw8Xy1Az4Bc7De0Fg3Hj6K9Lm
```

---

## 🌐 **Optional Environment Variables:**

### **Additional (if needed in future):**

**Database URL (if using PostgreSQL):**
```
Key:   DATABASE_URL
Value: postgresql://user:password@host:5432/dbname
```

**API Keys (if integrating services):**
```
Key:   STRIPE_API_KEY
Value: sk_live_xxxxxxxxxxxxx

Key:   SENDGRID_API_KEY
Value: SG.xxxxxxxxxxxxx
```

**File Storage (if using S3/cloud storage):**
```
Key:   AWS_ACCESS_KEY_ID
Value: AKIAxxxxxxxxxxxxx

Key:   AWS_SECRET_ACCESS_KEY
Value: secret-key-here

Key:   AWS_BUCKET_NAME
Value: my-restaurant-uploads
```

**But for now, you ONLY need the 4 basic ones!** ✅

---

## 🔄 **How to Update Environment Variables:**

**After deployment:**

1. Go to **Render Dashboard**
2. Click on your **backend service**
3. Click **"Environment"** tab (left sidebar)
4. Find the variable you want to change
5. Click **"Edit"**
6. Change the value
7. Click **"Save Changes"**
8. **Render will redeploy automatically!**

---

## 🔍 **Check If Variables Are Set:**

**In your backend code (server.js), add:**

```javascript
console.log('Environment Check:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set ✓' : 'Missing ✗');
console.log('PORT:', process.env.PORT);
console.log('TZ:', process.env.TZ);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

**Check Render logs to verify!**

---

## ⚠️ **Common Mistakes:**

### **❌ WRONG - Missing JWT_SECRET:**
```
(no JWT_SECRET variable)
```
**Result:** Authentication fails! Login won't work!

### **✅ CORRECT:**
```
JWT_SECRET = your-secret-key
```

---

### **❌ WRONG - Wrong PORT:**
```
PORT = 3000
```
**Result:** Backend won't start! Port mismatch!

### **✅ CORRECT:**
```
PORT = 5002
```

---

### **❌ WRONG - Wrong Timezone:**
```
TZ = UTC
```
**Result:** Wrong time on bills!

### **✅ CORRECT:**
```
TZ = Asia/Kolkata
```

---

## 📊 **Environment Variables Summary Table:**

| Variable | Value | Purpose | Required |
|----------|-------|---------|----------|
| **JWT_SECRET** | Random string 32+ chars | JWT encryption | ✅ YES |
| **PORT** | `5002` | Server port | ✅ YES |
| **TZ** | `Asia/Kolkata` | Indian timezone | ✅ YES |
| **NODE_ENV** | `production` | Production mode | ✅ YES |

---

## 💡 **Why Environment Variables?**

**Benefits:**
- ✅ Keep secrets out of code
- ✅ Different values for dev/prod
- ✅ Easy to change without code changes
- ✅ Secure (not in GitHub)

**Example:**
```javascript
// In code - uses environment variable
const secret = process.env.JWT_SECRET;

// NOT hardcoded - bad!
const secret = 'my-secret-key';
```

---

## 🎯 **Final Checklist:**

**Before deploying backend on Render:**
- [ ] JWT_SECRET set (random, 32+ characters)
- [ ] PORT set to 5002
- [ ] TZ set to Asia/Kolkata
- [ ] NODE_ENV set to production
- [ ] All 4 variables added
- [ ] Values checked (no typos)

**For frontend:**
- [ ] No environment variables needed ✅

---

## 🔗 **Quick Copy-Paste:**

**On Render, add these 4 environment variables:**

```
JWT_SECRET = kJ8n3Lm9Pq2Rt5Vw8Xy1Az4Bc7De0Fg3Hj6K
PORT = 5002
TZ = Asia/Kolkata
NODE_ENV = production
```

*(Change JWT_SECRET to your own random value!)*

---

## 📖 **Related Guides:**

- **RENDER_STEP_BY_STEP.md** - Complete deployment guide
- **INSTALL_COMMANDS.md** - Install commands
- **BUILD_COMMANDS_EXPLAINED.md** - Build process

---

## ✅ **Summary:**

**Environment Variables Needed:**
- **Backend:** 4 variables (JWT_SECRET, PORT, TZ, NODE_ENV)
- **Frontend:** None!

**Just add the 4 variables on Render when deploying backend!** 🎉

---

**Restaurant POS Pro v1.0.0**  
**Environment Configuration Ready!** ✨

