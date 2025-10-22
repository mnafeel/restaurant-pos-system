# Complete Fresh Database Setup

## Overview
This document describes how to completely clear all data from the restaurant POS system and start with a completely fresh database containing only the owner login.

## What Gets Cleared
- ✅ All users (except owner)
- ✅ All shops (completely removed)
- ✅ All menu items
- ✅ All orders and order items
- ✅ All bills and transactions
- ✅ All tables and reservations
- ✅ All categories
- ✅ All audit logs
- ✅ All print queue items

## What Remains
- ✅ Owner account only
- ✅ Default system settings
- ✅ Empty database tables (ready for fresh data)

## Owner Login Credentials
- **Username:** `owner`
- **Password:** `owner123`
- **Role:** `owner`
- **Email:** `owner@restaurant.com`
- **Company:** `MNA POS SYSTEMS`

## Database Status After Fresh Start
- **Users:** 1 (owner only)
- **Shops:** 0 (completely clean)
- **Menu Items:** 0
- **Orders:** 0
- **Settings:** 16 (default system settings)

## How to Perform Fresh Start

### Method 1: Delete Database File (Recommended)
1. Stop the server if running
2. Delete the `restaurant.db` file
3. Start the server - it will automatically create a fresh database with owner login only

### Method 2: Use Clear Script
1. Create a script to clear all data
2. Run the script to delete database and recreate with owner only
3. Start the server

## Owner Capabilities After Fresh Start
- Create new shops from scratch
- Add new users (admin, cashier, etc.)
- Configure shop settings
- Set up menu items and categories
- Configure tables and reservations
- Set up tax rates and payment methods

## Important Notes
- The database file (`restaurant.db`) is ignored by git for security
- Fresh start creates a completely clean system
- Owner must create shops and users manually after fresh start
- All previous data is permanently deleted
- System settings are reset to defaults

## Security
- Database files are not committed to version control
- Fresh start removes all sensitive data
- Owner credentials are the only login available after fresh start
- Owner can create additional users as needed

---
*Last Updated: October 2024*
*System Version: Restaurant POS v1.0*
