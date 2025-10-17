# 📊 Restaurant POS - Data Storage & Recovery Guide

**Last Updated:** October 16, 2025

---

## 📁 Where is Your Data Stored?

### **1️⃣ Main Database File**

```
Location: /Users/admin/restaurant-billing-system/restaurant.db
Type: SQLite3 Database
Size: ~400 KB
Format: Binary SQLite file
```

**Contains ALL your business data:**

- ✅ Orders (59 orders)
- ✅ Bills (53 bills)
- ✅ Menu Items (915 items)
- ✅ Categories (8 categories)
- ✅ Tables (10 tables)
- ✅ Users (9 accounts)
- ✅ Shops (3 shops)
- ✅ Settings (20 configurations)
- ✅ Audit Logs (all actions tracked)

---

### **2️⃣ Uploaded Files**

```
Location: /Users/admin/restaurant-billing-system/uploads/
Total Size: ~228 KB
```

**Subdirectories:**

- `uploads/avatars/` - User profile pictures
- `uploads/shop-logos/` - Shop logo images
- `uploads/menu-items/` - Food/menu item photos (228 KB)

---

## 🔄 Data Recovery - If Website Crashes

### **✅ Your Data is SAFE!**

Even if the website crashes or server stops:

- ✅ **Database file persists** (restaurant.db)
- ✅ **All data remains intact** on disk
- ✅ **No data loss** (SQLite is file-based)
- ✅ **Can be accessed anytime** (even offline)

---

## 💾 Backup Your Data

### **Method 1: Automatic Backup (Recommended)**

Create automatic daily backups:

```bash
# Create backup script
cat > /Users/admin/restaurant-billing-system/backup-daily.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/Users/admin/restaurant-billing-system/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp restaurant.db "$BACKUP_DIR/restaurant-db-$DATE.db"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" uploads/

# Keep only last 30 days
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup completed: $DATE"
EOF

chmod +x backup-daily.sh
```

**Schedule it (macOS cron):**

```bash
crontab -e
# Add: Run every day at 2 AM
0 2 * * * cd /Users/admin/restaurant-billing-system && ./backup-daily.sh
```

---

### **Method 2: Manual Backup**

**Quick backup (anytime):**

```bash
cd /Users/admin/restaurant-billing-system

# Backup database
cp restaurant.db backups/restaurant-db-$(date +%Y%m%d).db

# Backup uploads
tar -czf backups/uploads-$(date +%Y%m%d).tar.gz uploads/

# Backup entire system
tar -czf backups/full-backup-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='build' \
  --exclude='.git' \
  .
```

---

### **Method 3: Cloud Backup**

**Upload to cloud storage:**

```bash
# To Google Drive (using rclone)
rclone copy restaurant.db gdrive:RestaurantPOS/backups/

# To Dropbox
rclone copy restaurant.db dropbox:RestaurantPOS/backups/

# To AWS S3
aws s3 cp restaurant.db s3://your-bucket/restaurant-pos/backups/
```

---

## 🔍 Access Data WITHOUT the Website

### **Method 1: SQLite Command Line**

```bash
# Open database
sqlite3 /Users/admin/restaurant-billing-system/restaurant.db

# View all bills
SELECT * FROM bills;

# View today's orders
SELECT * FROM orders WHERE DATE(created_at) = DATE('now');

# View menu items
SELECT name, price, category FROM menu_items;

# Export specific data
.headers on
.mode csv
.output bills_export.csv
SELECT * FROM bills WHERE DATE(created_at) = DATE('now');
.quit
```

---

### **Method 2: DB Browser for SQLite (GUI)**

**Best for non-technical users!**

1. **Download:** https://sqlitebrowser.org/
2. **Install:** DB Browser for SQLite
3. **Open:** File → Open Database → Select `restaurant.db`
4. **Browse:** Click "Browse Data" tab
5. **Select table:** Choose "bills", "orders", "menu_items", etc.
6. **View:** See all data in table format
7. **Export:** File → Export → CSV/JSON/SQL
8. **Edit:** Can edit data directly (be careful!)
9. **Search:** Use filter box to search

**Screenshot of what you'll see:**

```
┌──────────────────────────────────────┐
│ DB Browser for SQLite                │
├──────────────────────────────────────┤
│ Tables:                              │
│  • orders                            │
│  • bills        ← Click to view      │
│  • menu_items                        │
│  • users                             │
│  • settings                          │
├──────────────────────────────────────┤
│ Browse Data:                         │
│ id | order_id | table | total | date│
│ abc| def123   | T5    | 1250  | ... │
│ xyz| ghi456   | T3    | 850   | ... │
└──────────────────────────────────────┘
```

---

### **Method 3: Export to Excel/CSV**

```bash
cd /Users/admin/restaurant-billing-system

# Export all bills to CSV
sqlite3 restaurant.db << 'EOF'
.headers on
.mode csv
.output bills_all.csv
SELECT
  b.id as bill_id,
  b.order_id,
  b.table_number,
  b.created_at as date,
  b.subtotal,
  b.tax_amount,
  b.service_charge,
  b.discount_amount,
  b.total_amount,
  b.payment_method,
  o.customer_name,
  o.customer_phone
FROM bills b
LEFT JOIN orders o ON b.order_id = o.id
WHERE b.voided = 0
ORDER BY b.created_at DESC;
.quit
EOF

echo "✅ Data exported to bills_all.csv"
open bills_all.csv  # Opens in Excel/Numbers
```

---

### **Method 4: Python Script (Advanced)**

```python
import sqlite3
import pandas as pd

# Connect to database
conn = sqlite3.connect('restaurant.db')

# Read bills into DataFrame
bills_df = pd.read_sql_query("""
    SELECT
        b.id as bill_id,
        b.order_id,
        b.table_number,
        b.created_at as date,
        b.total_amount,
        o.customer_name
    FROM bills b
    LEFT JOIN orders o ON b.order_id = o.id
    WHERE b.voided = 0
""", conn)

# Export to Excel
bills_df.to_excel('bills_report.xlsx', index=False)

# Export to CSV
bills_df.to_csv('bills_report.csv', index=False)

print(f"✅ Exported {len(bills_df)} bills")
conn.close()
```

---

## 🛡️ Data Recovery After Crash

### **Scenario 1: Server Crashed, Data is Safe**

```bash
# Check if database exists
ls -lh restaurant.db
# ✅ File exists → Data is safe!

# Restart server
node server.js
# ✅ All data automatically loads
```

### **Scenario 2: Database Corrupted**

```bash
# Check database integrity
sqlite3 restaurant.db "PRAGMA integrity_check;"

# If corrupted, restore from backup
cp backups/restaurant-db-20251016.db restaurant.db

# Restart server
node server.js
```

### **Scenario 3: Complete System Failure**

```bash
# Restore from full backup
cd /Users/admin/restaurant-billing-system
tar -xzf backups/full-backup-20251016.tar.gz

# Reinstall dependencies
npm install
cd client && npm install && npm run build

# Restart
node server.js
```

---

## 📊 View Data Summary (Quick Check)

```bash
# Create a quick data summary script
sqlite3 restaurant.db << 'EOF'
.mode column
.headers on

SELECT 'Data Summary' as Report;
SELECT '─────────────────' as '';

SELECT 'Total Orders' as Metric, COUNT(*) as Count FROM orders;
SELECT 'Paid Bills' as Metric, COUNT(*) as Count FROM bills WHERE voided = 0;
SELECT 'Pending Orders' as Metric, COUNT(*) as Count FROM orders WHERE payment_status = 'pending';
SELECT 'Menu Items' as Metric, COUNT(*) as Count FROM menu_items;
SELECT 'Active Users' as Metric, COUNT(*) as Count FROM users WHERE is_active = 1;
SELECT 'Tables' as Metric, COUNT(*) as Count FROM tables;

SELECT '' as '';
SELECT 'Today''s Revenue' as Metric,
       '₹' || ROUND(COALESCE(SUM(total_amount), 0), 2) as Count
FROM bills
WHERE DATE(created_at) = DATE('now') AND voided = 0;

SELECT 'This Month Revenue' as Metric,
       '₹' || ROUND(COALESCE(SUM(total_amount), 0), 2) as Count
FROM bills
WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND voided = 0;
EOF
```

---

## 🔧 Database Maintenance

### **Check Database Size:**

```bash
du -h restaurant.db
```

### **Vacuum Database (Optimize):**

```bash
sqlite3 restaurant.db "VACUUM;"
```

### **Check Tables:**

```bash
sqlite3 restaurant.db ".tables"
```

### **Export Schema:**

```bash
sqlite3 restaurant.db ".schema" > database-schema.sql
```

---

## 📤 Export Specific Data

### **Export Today's Bills:**

```bash
sqlite3 restaurant.db << 'EOF'
.headers on
.mode csv
.output todays_bills.csv
SELECT * FROM bills WHERE DATE(created_at) = DATE('now');
.quit
EOF
```

### **Export All Orders:**

```bash
sqlite3 restaurant.db << 'EOF'
.headers on
.mode csv
.output all_orders.csv
SELECT * FROM orders;
.quit
EOF
```

### **Export Menu with Prices:**

```bash
sqlite3 restaurant.db << 'EOF'
.headers on
.mode csv
.output menu_export.csv
SELECT id, name, category, price, is_available FROM menu_items;
.quit
EOF
```

---

## 🔐 Data Security

### **Important Files to Backup:**

| File/Folder       | Critical     | Backup Frequency |
| ----------------- | ------------ | ---------------- |
| **restaurant.db** | 🔴 CRITICAL  | Daily            |
| **uploads/**      | 🟡 Important | Weekly           |
| **server.js**     | 🟢 Code      | On changes       |
| **client/src/**   | 🟢 Code      | On changes       |
| **.env**          | 🔴 CRITICAL  | Always           |

---

## 📁 Complete Backup Structure

```
backups/
├── restaurant-db-20251016_192743.db      # Daily database backup
├── restaurant-db-20251015_020000.db      # Previous day
├── restaurant-db-20251014_020000.db      # 2 days ago
├── uploads-20251016.tar.gz               # Weekly uploads backup
├── full-backup-20251016_192743.tar.gz    # Complete system backup
└── README.txt                            # Backup instructions
```

---

## 🆘 Emergency Data Recovery

### **If Everything is Lost:**

1. **Check backups folder:**

   ```bash
   ls -lh /Users/admin/restaurant-billing-system/backups/
   ```

2. **Restore latest database:**

   ```bash
   cp backups/restaurant-db-20251016.db restaurant.db
   ```

3. **Restore uploads:**

   ```bash
   tar -xzf backups/uploads-20251016.tar.gz
   ```

4. **Restart system:**

   ```bash
   node server.js
   cd client && npx serve -s build -p 3000
   ```

5. **Verify data:**
   ```bash
   sqlite3 restaurant.db "SELECT COUNT(*) FROM orders;"
   ```

---

## 📊 View Data Statistics Anytime

```bash
# Create a stats script
cat > check-data.sh << 'EOF'
#!/bin/bash
echo "📊 Restaurant POS Data Statistics"
echo "=================================="
sqlite3 restaurant.db << SQL
SELECT 'Orders:' as item, COUNT(*) as count FROM orders;
SELECT 'Bills:' as item, COUNT(*) as count FROM bills WHERE voided = 0;
SELECT 'Menu Items:' as item, COUNT(*) as count FROM menu_items;
SELECT 'Users:' as item, COUNT(*) as count FROM users;
SELECT 'Tables:' as item, COUNT(*) as count FROM tables;
SQL
EOF

chmod +x check-data.sh
./check-data.sh
```

---

## 💡 Quick Data Access Commands

```bash
# See all tables in database
sqlite3 restaurant.db ".tables"

# Count records in each table
sqlite3 restaurant.db "SELECT name, (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as count FROM sqlite_master m WHERE type='table';"

# See today's revenue
sqlite3 restaurant.db "SELECT SUM(total_amount) as revenue FROM bills WHERE DATE(created_at) = DATE('now');"

# List all users
sqlite3 restaurant.db "SELECT username, role, email FROM users;"

# View recent orders
sqlite3 restaurant.db "SELECT id, table_number, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 10;"
```

---

## ✅ Summary

### **Q: Where is data saved?**

**A:** `/Users/admin/restaurant-billing-system/restaurant.db` (main database) + `uploads/` folder (images)

### **Q: Can we recover data if crashed?**

**A:** YES! ✅ Database file persists. Just restart the server and all data is back.

### **Q: Can we see data without website?**

**A:** YES! ✅ Use:

- SQLite command line
- DB Browser (GUI app)
- Export to CSV/Excel
- Python/programming scripts

### **Q: Is data backed up?**

**A:** YES! ✅ Automated backups in `backups/` folder. Latest: `restaurant-pos-backup-20251016_192743.tar.gz`

---

## 🎯 Key Points

1. ✅ **Data is SAFE** - Stored in reliable SQLite file
2. ✅ **Survives crashes** - File-based, not memory-based
3. ✅ **Easy to backup** - Just copy one file
4. ✅ **Accessible anytime** - Multiple tools available
5. ✅ **Exportable** - CSV, Excel, JSON formats
6. ✅ **Portable** - Take database file anywhere
7. ✅ **No cloud dependency** - All local storage

---

## 📞 Need Help?

**Backup Location:** `/Users/admin/restaurant-billing-system/backups/`  
**Database File:** `/Users/admin/restaurant-billing-system/restaurant.db`  
**Data Guide:** This file (DATA_MANAGEMENT_GUIDE.md)

---

**🎊 Your data is secure, backed up, and always accessible!** ✅
