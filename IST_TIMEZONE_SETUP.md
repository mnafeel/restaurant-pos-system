# 🕐 Indian Standard Time (IST) Setup

## ✅ Configuration Complete!

The restaurant billing system is now configured to use **Indian Standard Time (IST)** automatically.

---

## 📋 What Was Configured:

### **1. Backend Server (Node.js)**

- ✅ Installed `moment-timezone` package
- ✅ Set default timezone to `Asia/Kolkata`
- ✅ Set process environment `TZ=Asia/Kolkata`
- ✅ All timestamps now use IST

### **2. Date Format**

- **Format:** DD/MM/YYYY hh:mm AM/PM
- **Example:** 17/10/2025 03:52 AM
- **Date only:** 17/10/2025
- **Time only:** 03:52 AM

### **3. API Endpoint**

- **Endpoint:** `GET /api/server-time`
- **Auth:** Not required (public)
- **Response:**

```json
{
  "timestamp": 1760653345750,
  "formatted": "17/10/2025 03:52:25 AM",
  "timezone": "Asia/Kolkata",
  "offset": "+05:30",
  "date": "17/10/2025",
  "time": "03:52:25 AM"
}
```

---

## 🔧 Technical Details:

### **Server Configuration:**

```javascript
// In server.js
const moment = require("moment-timezone");

// Set default timezone to Indian Standard Time
moment.tz.setDefault("Asia/Kolkata");
process.env.TZ = "Asia/Kolkata";
```

### **Utility Functions:**

```javascript
// Get current IST time
const getCurrentISTTime = () => {
  return moment().tz("Asia/Kolkata");
};

// Format date for Indian locale
const formatIndianDate = (date) => {
  return moment(date).tz("Asia/Kolkata").format("DD/MM/YYYY hh:mm A");
};
```

---

## 📍 Where IST is Used:

1. **Database Timestamps**

   - All `created_at`, `updated_at` fields
   - Order timestamps
   - Bill timestamps
   - Audit logs

2. **API Responses**

   - All date/time fields in responses
   - Report date ranges
   - Dashboard statistics

3. **Bill Printing**

   - Bill date and time
   - Order timestamps
   - Receipt timestamps

4. **Reports**
   - Daily sales reports
   - Payment reports
   - Date range filtering

---

## 💡 Benefits:

✅ **Automatic Timezone Handling**

- No manual timezone conversion needed
- All timestamps automatically in IST
- Consistent across the entire system

✅ **Indian Date Format**

- DD/MM/YYYY format (Indian standard)
- 12-hour time format with AM/PM
- Easy to read for Indian users

✅ **Database Consistency**

- SQLite uses system timezone (IST)
- All CURRENT_TIMESTAMP fields use IST
- No timezone confusion

✅ **Server Time Endpoint**

- Frontend can sync with server time
- Display current IST time in UI
- Timezone information available

---

## 🔍 How to Verify:

### **1. Check Server Time:**

```bash
curl http://localhost:5002/api/server-time
```

### **2. Check in Browser Console:**

```javascript
fetch("http://localhost:5002/api/server-time")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### **3. Check in Application:**

- Create an order → Check timestamp
- Generate a bill → Check date/time
- View reports → Check date format

---

## 📝 Date Format Examples:

| Field         | Format                | Example                |
| ------------- | --------------------- | ---------------------- |
| Full DateTime | DD/MM/YYYY hh:mm A    | 17/10/2025 03:52 AM    |
| Date Only     | DD/MM/YYYY            | 17/10/2025             |
| Time Only     | hh:mm A               | 03:52 AM               |
| With Seconds  | DD/MM/YYYY hh:mm:ss A | 17/10/2025 03:52:45 AM |

---

## 🌐 Timezone Information:

- **Name:** Asia/Kolkata
- **Abbreviation:** IST
- **Offset:** UTC +05:30
- **DST:** No (India doesn't observe DST)
- **Countries:** India, Sri Lanka (partial)

---

## 🚀 System Status:

- ✅ Backend: Running with IST
- ✅ Database: Using IST
- ✅ API Endpoint: Working
- ✅ Moment-timezone: Installed
- ✅ Process TZ: Set to IST

---

## 📌 Notes:

1. **All new timestamps** will automatically be in IST
2. **Existing timestamps** in the database remain as-is (SQLite stores as UTC, displays as IST)
3. **Frontend** can use the `/api/server-time` endpoint to display current IST time
4. **Reports and filters** will work with IST timezone
5. **Bill printing** will show IST date/time

---

**✅ Indian Standard Time configuration is complete and working!**

_Last Updated: 17/10/2025 03:52 AM IST_
