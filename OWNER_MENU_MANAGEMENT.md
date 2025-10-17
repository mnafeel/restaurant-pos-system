# 👑 Owner Menu Management Guide

**Date:** October 16, 2025  
**Status:** ✅ Complete

---

## 🎯 Overview

Owner can now view and manage menu items for ANY shop from the Owner Portal.

---

## 🍽️ Features

### **1. View Shop Menu**

- Click "Menu" button on any shop card
- See all menu items for that shop
- Grid layout with images
- Shows: name, category, price, availability

### **2. Delete Individual Items**

- Each menu item has "Delete Item" button
- Confirmation dialog
- Only affects that specific shop
- Other shops unaffected

### **3. Clear Entire Menu**

- "Clear All Menu" button
- ⚠️ **Requires owner password**
- Deletes ALL menu items from shop
- Cannot be undone!

---

## 📍 Access Points

### **Option A: From Shops Tab**

1. Go to "Shops" tab
2. Find the shop
3. Click "Menu" button (orange)
4. Menu modal opens

### **Option B: From All Users Tab**

1. Go to "All Users" tab
2. Find an admin user
3. Click 📦 (package icon)
4. Menu modal opens for their shop

---

## 🏪 Shop Card Buttons

```
Row 1: [Edit] [Menu] [Close/Open]
Row 2: [Staff] [Reset] [Delete]
```

**New Menu Button:**

- Orange background
- Package icon
- Opens menu modal

---

## 📋 Menu Modal Layout

```
┌────────────────────────────────────────┐
│ DOWNTOWN BRANCH - Menu          [X]    │
│ 15 items                               │
├────────────────────────────────────────┤
│ Menu Items (15)    [Clear All Menu]   │
│                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ [Image]  │ │ [Image]  │ │ [Image]  ││
│ │ Chicken  │ │ Burger   │ │ Pizza    ││
│ │ Main     │ │ Main     │ │ Italian  ││
│ │ ₹199     │ │ ₹149     │ │ ₹299     ││
│ │ [Delete] │ │ [Delete] │ │ [Delete] ││
│ └──────────┘ └──────────┘ └──────────┘│
└────────────────────────────────────────┘
```

---

## 🔐 Clear Menu - Password Protected

### **Why Password Required:**

- Prevents accidental deletion
- Cannot be undone
- Deletes entire menu
- High-impact action

### **Flow:**

1. **Click** "Clear All Menu" button
2. **Warning dialog** appears:

   ```
   ⚠️ Clear Entire Menu

   You are about to clear ALL 15 menu items
   from Downtown Branch.

   This action cannot be undone!

   Enter Owner Password: [________]

   [Cancel] [Clear All Menu]
   ```

3. **Enter** owner password (`owner123`)
4. **Click** "Clear All Menu"
5. ✅ All items deleted
6. ✅ Success message shown

---

## 🐛 Troubleshooting

### **If Clear Menu Shows 401 Error:**

**Problem:** Password not recognized

**Solution:**

1. Make sure you're entering: `owner123`
2. No extra spaces
3. Case-sensitive
4. Check backend logs: `tail -f /tmp/backend.log`

**Backend will log:**

```
Clear menu request - shopId: 1, password provided: true
Password match: true
Menu items deleted: 15
```

---

## 🎯 Use Cases

### **Scenario 1: Remove Test Items**

1. Shop admin added test menu items
2. Owner wants to clean them up
3. Owner opens shop menu
4. Deletes items one by one
5. ✅ Test items removed

### **Scenario 2: Reset Shop Menu**

1. Shop wants fresh start
2. Owner clicks "Clear All Menu"
3. Enters password
4. ✅ Entire menu cleared
5. Shop admin can add new items

### **Scenario 3: Remote Management**

1. Owner checks shop menu remotely
2. Sees outdated items
3. Deletes specific items
4. ✅ Menu updated without shop admin

---

## 👥 All Users Tab - Menu Access

### **Admin Users:**

**Actions Available:**

```
[📦 Menu] [🔐 Reset Password] [🗑️ Delete User]
```

**Menu Button:**

- Shows ONLY for admin role
- Orange package icon
- Click to view their shop's menu
- Same modal as Shops tab

### **Other Staff:**

**Actions Available:**

```
[🔐 Reset Password] [🗑️ Delete User]
```

No menu button (they don't manage menu)

---

## ✅ Current Implementation

### **Backend Endpoints:**

```javascript
GET  /api/shops/:shopId/menu
  - Owner only
  - Fetch all menu items for shop
  - Returns items with images, prices

DELETE /api/menu/:id
  - Owner, Admin, Manager
  - Delete single menu item
  - Confirmation required

DELETE /api/shops/:shopId/menu
  - Owner only
  - Clear entire shop menu
  - Password required
  - Logged in audit
```

### **Frontend Features:**

```javascript
// Shop Cards
[Edit] [Menu] [Close/Open]
[Staff] [Reset] [Delete]

// All Users Table
For Admin: [📦] [🔐] [🗑️]
For Staff: [🔐] [🗑️]

// Menu Modal
- View items grid
- Delete individual items
- Clear all menu (password)
```

---

## 🔑 Owner Credentials

```
Username: owner
Password: owner123
```

**Use this password when clearing menu!**

---

## 📊 Summary

| Action      | Access          | Protection     | Undo? |
| ----------- | --------------- | -------------- | ----- |
| View Menu   | Shops/Users tab | None           | N/A   |
| Delete Item | Menu modal      | Confirmation   | ❌ No |
| Clear All   | Menu modal      | Owner Password | ❌ No |

---

## 🌐 System Access

- **URL:** http://localhost:3000
- **Owner Login:** owner / owner123
- **Backend:** Restarted with logging ✅
- **Frontend:** Ready ✅

---

## 🎯 Test It Now

1. **Login as owner**
2. **Go to Shops tab** (or All Users tab)
3. **Click "Menu"** on a shop card (or 📦 on admin user)
4. **Try:**
   - Delete single item (no password)
   - Clear all menu (with password: `owner123`)

---

**👑 Complete menu control for every shop!** 🍽️✨

---

**Check backend logs if password fails:**

```bash
tail -f /tmp/backend.log
```

This will show password verification process.
