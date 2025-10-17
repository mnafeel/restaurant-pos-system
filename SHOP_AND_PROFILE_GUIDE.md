# Shop Management & User Profile Guide

## Overview

Your Restaurant POS system now includes comprehensive shop management for multi-location businesses and user profile management for all users.

## 🏪 Shop Management

### Features

- ✅ **Add Multiple Shops** - Manage multiple restaurant locations
- ✅ **Primary Shop** - Designate one shop as primary (for billing/receipts)
- ✅ **Edit Shop Details** - Update address, contact info, tax ID
- ✅ **Delete Shops** - Remove unused locations (cannot delete primary)
- ✅ **Shop Cards** - Visual cards with all details
- ✅ **Audit Trail** - All changes logged

### Access

**Who can use:** Admin & Manager roles

**How to access:**
```
Login → Shops (in sidebar)
```

### Add a New Shop

1. **Navigate to Shops**
   - Click "Shops" in sidebar
   - Click "Add New Shop" button

2. **Fill in Details:**
   - **Shop Name**: e.g., "Main Branch", "Downtown Location"
   - **Address**: Street address
   - **City**: City name
   - **State**: State/Province code
   - **ZIP Code**: Postal code
   - **Country**: Country name (default: USA)
   - **Phone**: Contact number
   - **Email**: Shop email address
   - **Tax ID**: Business tax identification number
   - **Primary**: Check to set as primary location

3. **Save**
   - Click "Add Shop"
   - Shop appears in grid

### Edit a Shop

1. **Find the Shop Card**
2. **Click ✏️ Edit button**
3. **Update any details**
4. **Click "Update Shop"**

### Delete a Shop

1. **Find the Shop Card**
2. **Click 🗑️ Delete button** (only visible for non-primary shops)
3. **Confirm deletion**
4. Shop removed from system

**Note:** Cannot delete primary shop. Set another shop as primary first.

### Set Primary Shop

1. **Find the Shop Card** (non-primary shop)
2. **Click "Set as Primary" button**
3. Primary badge moves to selected shop
4. Primary shop info used on receipts/bills

### Example Use Cases

**Single Location:**
- Create main shop with full details
- Set as primary
- Use for all bills and receipts

**Multi-Location Chain:**
- Create shop for each branch
- Headquarters as primary
- Each location has own details
- Track sales by location (future feature)

**Franchise Model:**
- Each franchise location as separate shop
- Manage contact info centrally
- Different tax IDs per location

## 👤 User Profile

### Features

- ✅ **View Profile** - See all your account details
- ✅ **Edit Information** - Update name, email, phone
- ✅ **Change Password** - Secure password updates
- ✅ **Account Details** - View role, status, user ID
- ✅ **Activity Timeline** - See account created/updated dates
- ✅ **Contact Info** - Manage your contact details

### Access

**Who can use:** All logged-in users (any role)

**How to access:**
```
Method 1: Click your name in the bottom-left sidebar
Method 2: Navigate → Profile
```

### View Your Profile

Your profile shows:
- **Header Card**: Name, username, role badge
- **Personal Information**: Name, email, phone
- **Account Details**: Username, role, status, user ID
- **Activity**: Account created/updated dates
- **Contact Information**: Email and phone

### Edit Personal Information

1. **Navigate to Profile**
2. **Update fields:**
   - First Name
   - Last Name
   - Email
   - Phone

3. **Click "Save Changes"**
4. Profile updated successfully

### Change Your Password

1. **Navigate to Profile**
2. **Scroll to Security section**
3. **Click "Change Password"**
4. **Enter:**
   - Current Password
   - New Password (min 6 characters)
   - Confirm New Password

5. **Click "Update Password"**
6. Password changed successfully

**Security Requirements:**
- Must know current password
- New password minimum 6 characters
- Passwords must match
- Cannot reuse current password

### Profile Information Display

**Profile Header:**
- Gradient card with initials circle
- Full name
- Username with @ prefix
- Role badge (colored by role)

**Account Status Indicator:**
- 🟢 Green = Active
- 🔴 Red = Inactive

**Role Badges:**
- 🟣 Purple = Admin
- 🔵 Blue = Manager
- 🟢 Green = Cashier
- 🟠 Orange = Chef

## 🔐 Security & Permissions

### Shop Management Permissions

| Action | Admin | Manager | Cashier | Chef |
|--------|-------|---------|---------|------|
| View Shops | ✅ | ✅ | ❌ | ❌ |
| Add Shop | ✅ | ❌ | ❌ | ❌ |
| Edit Shop | ✅ | ✅ | ❌ | ❌ |
| Delete Shop | ✅ | ❌ | ❌ | ❌ |
| Set Primary | ✅ | ✅ | ❌ | ❌ |

### User Profile Permissions

| Action | All Users |
|--------|-----------|
| View Own Profile | ✅ |
| Edit Own Profile | ✅ |
| Change Own Password | ✅ |

**Note:** Users can only edit their own profile. Admins can manage other users via User Management page.

## 📊 API Endpoints

### Shop Management

```http
GET /api/shops
Authorization: Bearer <token>
Roles: Admin, Manager
```

```http
POST /api/shops
Authorization: Bearer <token>
Roles: Admin
Content-Type: application/json

{
  "name": "Main Branch",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "USA",
  "phone": "+1234567890",
  "email": "main@restaurant.com",
  "tax_id": "TAX123456",
  "is_primary": true
}
```

```http
PUT /api/shops/:id
Authorization: Bearer <token>
Roles: Admin, Manager
```

```http
DELETE /api/shops/:id
Authorization: Bearer <token>
Roles: Admin
```

### User Profile

```http
GET /api/profile
Authorization: Bearer <token>
```

```http
PUT /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@restaurant.com",
  "phone": "+1234567890",
  "current_password": "oldpass123",
  "new_password": "newpass123"
}
```

## 🎯 Workflows

### Setting Up Multiple Locations

1. **Create Main Location**
   - Shops → Add New Shop
   - Enter headquarters details
   - Check "Set as Primary"
   - Save

2. **Add Branch Locations**
   - For each branch:
     - Add New Shop
     - Enter branch details
     - Don't check primary
     - Save

3. **Manage Locations**
   - Edit details as needed
   - Change primary if headquarters moves
   - Delete closed branches

### Updating Your Profile

1. **Regular Updates**
   - Profile → Edit Information
   - Update name, email, or phone
   - Save Changes

2. **Periodic Password Changes**
   - Profile → Security → Change Password
   - Enter current and new password
   - Update Password

3. **Keep Information Current**
   - Update phone if changed
   - Update email for notifications
   - Verify information quarterly

## 💡 Best Practices

### Shop Management

✅ **Do:**
- Set headquarters as primary shop
- Keep contact information updated
- Use clear, descriptive shop names
- Include full address details
- Maintain accurate tax IDs

❌ **Don't:**
- Delete shops with historical data
- Change primary shop frequently
- Leave address fields empty
- Use duplicate shop names
- Share tax IDs across locations

### User Profile

✅ **Do:**
- Use real name for accountability
- Keep email address current
- Change password every 90 days
- Use strong passwords (8+ characters)
- Review profile information monthly

❌ **Don't:**
- Share your password
- Use simple passwords
- Ignore password change prompts
- Use personal email (use work email)
- Leave phone number empty

## 🛠️ Troubleshooting

### Shop Management Issues

**Can't delete shop:**
- Check if it's the primary shop
- Set another shop as primary first
- Then delete

**Can't see Shops menu:**
- Check your role (need Admin or Manager)
- Contact admin for access

**Changes not saving:**
- Check internet connection
- Verify all required fields filled
- Check browser console for errors

### Profile Issues

**Can't change password:**
- Verify current password is correct
- Ensure new password is 6+ characters
- Check that passwords match
- Clear browser cache

**Email already exists:**
- Email is taken by another user
- Use different email address
- Contact admin if it's your email

**Profile not updating:**
- Check internet connection
- Verify token is valid
- Try logout and login again

## 📚 Related Documentation

- **User Management**: See `README.md` → User Management
- **Settings**: See Settings page for global shop settings
- **Audit Logs**: All shop and profile changes are logged

## 🎓 Training

### For Admins

1. Set up all shop locations during initial configuration
2. Designate primary shop for billing
3. Review shop information quarterly
4. Train managers on editing shops
5. Monitor audit logs for changes

### For All Users

1. Review your profile after first login
2. Update contact information
3. Change default password
4. Keep profile information current
5. Report any profile issues to admin

## 🎉 Benefits

### Shop Management Benefits

- 📍 Track multiple locations
- 📄 Accurate billing information
- 🏢 Professional receipts
- 🔍 Location-based reporting (future)
- 📊 Multi-location analytics (future)

### User Profile Benefits

- 👤 Personalized experience
- 🔐 Secure account management
- 📱 Current contact information
- 🔄 Easy information updates
- 🛡️ Password control

---

**Need help?** 
- Admin: Contact system administrator
- Technical Issues: Check browser console
- Feature Requests: Submit to development team
