#!/bin/bash

# Restaurant POS - Data Export Script
# Exports data to CSV files for viewing in Excel/Numbers

EXPORT_DIR="exports"
DATE=$(date +%Y%m%d)

# Create export directory
mkdir -p $EXPORT_DIR

echo "📊 Exporting Restaurant POS Data..."
echo ""

# Export Today's Bills
sqlite3 restaurant.db << EOF
.headers on
.mode csv
.output ${EXPORT_DIR}/bills_today_${DATE}.csv
SELECT 
  b.id as bill_id,
  b.order_id,
  b.table_number,
  datetime(b.created_at, 'localtime') as date_time,
  b.subtotal,
  b.tax_amount,
  b.service_charge,
  b.discount_amount,
  b.total_amount,
  b.payment_method,
  o.customer_name,
  o.customer_phone,
  u.first_name || ' ' || u.last_name as staff_name
FROM bills b
LEFT JOIN orders o ON b.order_id = o.id
LEFT JOIN users u ON b.staff_id = u.id
WHERE DATE(b.created_at) = DATE('now') AND b.voided = 0
ORDER BY b.created_at DESC;
EOF

echo "✅ Today's Bills: ${EXPORT_DIR}/bills_today_${DATE}.csv"

# Export All Bills (This Month)
sqlite3 restaurant.db << EOF
.headers on
.mode csv
.output ${EXPORT_DIR}/bills_month_${DATE}.csv
SELECT 
  b.id as bill_id,
  b.order_id,
  b.table_number,
  datetime(b.created_at, 'localtime') as date_time,
  b.total_amount,
  b.payment_method,
  o.customer_name
FROM bills b
LEFT JOIN orders o ON b.order_id = o.id
WHERE strftime('%Y-%m', b.created_at) = strftime('%Y-%m', 'now') 
  AND b.voided = 0
ORDER BY b.created_at DESC;
EOF

echo "✅ This Month's Bills: ${EXPORT_DIR}/bills_month_${DATE}.csv"

# Export Menu Items
sqlite3 restaurant.db << EOF
.headers on
.mode csv
.output ${EXPORT_DIR}/menu_items_${DATE}.csv
SELECT 
  id,
  name,
  category,
  description,
  price,
  is_available,
  stock_quantity,
  prep_time_minutes
FROM menu_items
ORDER BY category, name;
EOF

echo "✅ Menu Items: ${EXPORT_DIR}/menu_items_${DATE}.csv"

# Export All Orders
sqlite3 restaurant.db << EOF
.headers on
.mode csv
.output ${EXPORT_DIR}/orders_all_${DATE}.csv
SELECT 
  id as order_id,
  table_number,
  datetime(created_at, 'localtime') as date_time,
  total_amount,
  payment_status,
  payment_method,
  order_type,
  kds_status,
  customer_name,
  customer_phone
FROM orders
ORDER BY created_at DESC;
EOF

echo "✅ All Orders: ${EXPORT_DIR}/orders_all_${DATE}.csv"

# Export Users
sqlite3 restaurant.db << EOF
.headers on
.mode csv
.output ${EXPORT_DIR}/users_${DATE}.csv
SELECT 
  id,
  username,
  email,
  role,
  first_name,
  last_name,
  is_active,
  shop_id
FROM users
ORDER BY role, username;
EOF

echo "✅ Users: ${EXPORT_DIR}/users_${DATE}.csv"

echo ""
echo "═══════════════════════════════════════"
echo "✅ ALL DATA EXPORTED!"
echo "═══════════════════════════════════════"
echo ""
echo "📁 Exported Files:"
ls -lh ${EXPORT_DIR}/*_${DATE}.csv
echo ""
echo "📂 Location: /Users/admin/restaurant-billing-system/${EXPORT_DIR}/"
echo ""
echo "💡 Open in Excel/Numbers/Google Sheets"
echo "🎊 Your data is ready to view!"

