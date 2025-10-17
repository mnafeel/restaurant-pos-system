# Quick Setup Guide

## 🚀 One-Command Setup

### Using Docker (Recommended)

```bash
chmod +x start.sh
./start.sh
```

The script will automatically:

- Start all services (API, Print Service, Web App, KDS)
- Set up the database with sample data
- Display access URLs and credentials

### Manual Setup

If Docker is not available, the script will:

- Install dependencies automatically
- Start all services manually
- Provide process IDs for monitoring

## 📋 What's Included

After setup, you'll have:

- ✅ 10 pre-configured tables (T1-T10)
- ✅ Sample menu with 12 items across 7 categories
- ✅ 3 user accounts (Admin, Cashier, Chef)
- ✅ Tax configuration (GST 9%, Service Tax 5%)
- ✅ Default settings configured

## 🔐 Default Accounts

| Role    | Username | Password   | Access Level   |
| ------- | -------- | ---------- | -------------- |
| Admin   | admin    | admin123   | Full access    |
| Cashier | cashier  | cashier123 | POS operations |
| Chef    | chef     | chef123    | Kitchen only   |

**⚠️ Change these passwords immediately in production!**

## 🎯 First Steps

### 1. Login

Navigate to http://localhost (or http://localhost:3000 if manual setup)
Login with admin credentials

### 2. Configure Shop Information

1. Go to Settings → Shop Info
2. Update:
   - Shop name
   - Address
   - Phone/Email
   - Receipt header/footer
3. Click "Save All Changes"

### 3. Configure Printer (if using thermal printer)

1. Go to Settings → Printer Config
2. Select printer type:
   - Network: Enter IP and port
   - USB: Connect printer and select
3. Test print

### 4. Review Menu

1. Go to Inventory
2. Review pre-loaded items
3. Add/edit items as needed
4. Add item variants if needed

### 5. Verify Tables

1. Go to Tables
2. Review table layout
3. Add/remove tables as needed
4. Organize by location

## 🧪 Testing the System

### Test Order Flow

1. **Place Order**

   - Go to Orders
   - Select a table (e.g., T1)
   - Add items to cart
   - Add special instructions
   - Submit order

2. **Kitchen Display**

   - Open Kitchen (KDS) page
   - See the new order appear
   - Mark items as In-Progress
   - Mark as Ready when done

3. **Generate Bill**

   - Go to Bills
   - Select the table with order
   - Review items
   - Apply discount (optional)
   - Generate bill
   - Print receipt
   - Mark as paid

4. **Verify Table Status**
   - Go to Tables
   - Table should be Free again

### Test Reports

1. Go to Reports
2. View dashboard metrics
3. Check sales by period
4. Export to CSV

## 🔧 Customization

### Adding Users

1. Go to Users (Admin only)
2. Click "Add User"
3. Fill in details
4. Assign role
5. Save

### Managing Menu

1. Go to Inventory
2. Categories:
   - Add new category
   - Reorder categories
3. Items:
   - Add item with price
   - Set category
   - Mark tax applicable
   - Add variants (sizes, options)
   - Set stock levels

### Configuring Taxes

1. Go to Settings → Taxes & Charges
2. Add Tax:
   - Name (e.g., "VAT")
   - Rate (%)
   - Inclusive/Exclusive
3. Edit service charge rate

### Table Operations

1. **Merge Tables**

   - Select multiple tables
   - Click "Merge Selected"
   - Primary table shows merged status

2. **Split Tables**
   - Click "Split" on merged table
   - All tables become independent

## 📱 Multi-Device Setup

### Main POS Terminal

- Full web interface
- http://localhost

### Kitchen Display

- Dedicated KDS interface
- http://localhost:8080
- Auto-updates with new orders

### Additional Terminals

1. Access from other devices on network
2. Replace `localhost` with server IP
3. Example: http://192.168.1.100

## 🛠️ Troubleshooting

### Services Won't Start

```bash
# Check if ports are in use
lsof -i :5002 # API
lsof -i :5003 # Print Service
lsof -i :3000 # Frontend (manual)
lsof -i :80   # Frontend (Docker)

# Kill conflicting processes
kill -9 <PID>

# Restart
./start.sh
```

### Database Issues

```bash
# Reset database
rm restaurant.db
# Restart - will recreate with sample data
./start.sh
```

### Printer Not Working

1. Check printer IP/connection
2. Verify firewall settings
3. Test with: `ping <printer-ip>`
4. Check print queue: http://localhost:5003/health
5. Retry failed jobs from Settings

### Permission Denied

```bash
chmod +x start.sh
```

## 📊 Performance Tips

### For High Traffic

1. Use PostgreSQL instead of SQLite
2. Enable Redis caching
3. Deploy behind load balancer
4. Use dedicated print server

### Database Optimization

```bash
# Backup regularly
sqlite3 restaurant.db ".backup 'backup-$(date +%Y%m%d).db'"

# Vacuum periodically
sqlite3 restaurant.db "VACUUM"
```

## 🔐 Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Update JWT_SECRET
- [ ] Configure CORS properly
- [ ] Enable HTTPS
- [ ] Set up firewall rules
- [ ] Regular database backups
- [ ] Monitor audit logs
- [ ] Update printer credentials

## 📞 Getting Help

- Documentation: README.md
- API Docs: Check README.md API section
- Issues: GitHub Issues
- Logs: `docker-compose logs -f` or check console

## ✅ System Health Check

Verify all services are running:

```bash
# Docker
docker-compose ps

# Manual
ps aux | grep node
```

Test endpoints:

```bash
# API Health
curl http://localhost:5002/api/settings

# Print Service Health
curl http://localhost:5003/health
```

## 🎉 You're Ready!

Your restaurant POS system is now set up and ready to use!

Next steps:

1. Customize menu and prices
2. Train staff on the system
3. Test thoroughly before going live
4. Set up regular backups
5. Monitor system performance

For detailed documentation, see README.md
