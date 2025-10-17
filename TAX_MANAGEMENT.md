# Tax Management Guide

## Overview

The Restaurant POS system provides comprehensive tax management capabilities through the admin interface. You can add, edit, and delete taxes just like menu items.

## Features

### ✅ Add New Taxes
- Create custom taxes (GST, VAT, Sales Tax, etc.)
- Set tax rate (percentage)
- Choose inclusive or exclusive calculation
- Activate/deactivate taxes

### ✅ Edit Existing Taxes
- Update tax name
- Modify tax rate
- Change inclusive/exclusive setting
- All changes logged in audit trail

### ✅ Delete Taxes
- Remove unused taxes
- Confirmation required before deletion
- Audit log maintained

### ✅ Toggle Active Status
- Enable/disable taxes without deleting
- Disabled taxes won't apply to new bills

## How to Manage Taxes

### Add a New Tax

1. **Login as Admin or Manager**
   - Username: `admin` / Password: `admin123`

2. **Navigate to Settings**
   - Click "Settings" in sidebar
   - Select "Taxes & Charges" tab

3. **Add Tax**
   - Click "Add Tax" button
   - Fill in details:
     - **Tax Name**: e.g., "VAT", "GST", "Sales Tax"
     - **Rate**: e.g., 10.00 (for 10%)
     - **Inclusive**: Check if tax is already included in prices
   - Click "Add Tax"

4. **Success!**
   - New tax appears in the list
   - Automatically active
   - Will apply to new bills

### Edit an Existing Tax

1. **Navigate to Settings → Taxes & Charges**

2. **Click Edit Button (pencil icon)**
   - On the tax you want to modify

3. **Update Details**
   - Change name, rate, or inclusive setting
   - Click "Update Tax"

4. **Changes Applied**
   - Updated tax shown in list
   - New bills use updated rate
   - Existing bills unchanged

### Delete a Tax

1. **Navigate to Settings → Taxes & Charges**

2. **Click Delete Button (trash icon)**
   - On the tax you want to remove

3. **Confirm Deletion**
   - Confirmation popup appears
   - Warning: Action cannot be undone

4. **Tax Removed**
   - Deleted from system
   - Action logged in audit trail
   - Existing bills retain old tax data

### Toggle Active Status

1. **Navigate to Settings → Taxes & Charges**

2. **Toggle Active Checkbox**
   - Check to activate
   - Uncheck to deactivate

3. **Status Updated**
   - Active taxes apply to new bills
   - Inactive taxes are skipped

## Tax Types Explained

### Exclusive Tax (Default)
- Tax calculated ON TOP of item prices
- Example: Item $100 + 10% tax = $110 total
- Most common for VAT, GST, Sales Tax

### Inclusive Tax
- Tax already included in item prices
- Example: Item $100 includes 10% tax ($9.09 is tax)
- Used when prices shown are final

## Examples

### Example 1: Add 10% VAT

```
Settings → Taxes & Charges → Add Tax

Name: VAT
Rate: 10.00
Inclusive: ☐ Unchecked (exclusive)

Result: $100 item + 10% VAT = $110 total
```

### Example 2: Add 15% Service Tax (Inclusive)

```
Settings → Taxes & Charges → Add Tax

Name: Service Tax
Rate: 15.00
Inclusive: ☑ Checked (inclusive)

Result: $100 item (already includes $13.04 tax)
```

### Example 3: Multiple Taxes

```
Tax 1: GST 9% (exclusive)
Tax 2: Service Tax 5% (exclusive)

Item: $100
After GST: $100 + 9% = $109
After Service: $109 + 5% = $114.45
Total: $114.45
```

## How Taxes Apply to Bills

### Bill Calculation Order

1. **Subtotal**: Sum of all items
2. **Discount**: Subtract discount (if any)
3. **Service Charge**: Add service charge (if enabled)
4. **Taxes**: Apply all active taxes
5. **Round Off**: Round to nearest dollar/cent
6. **Total**: Final amount

### Example Bill

```
Item 1: Pizza         $12.99
Item 2: Coke          $2.99
----------------------------
Subtotal:             $15.98
Discount (10%):       -$1.60
Service Charge (5%):  +$0.72
GST (9%):            +$1.35
----------------------------
Total:                $16.45
```

## Service Charge

In addition to taxes, you can configure a service charge:

1. **Navigate to Settings → Taxes & Charges**
2. **Scroll to Service Charge section**
3. **Set percentage** (default: 5%)
4. **Click Save All Changes**

Service charge applies to all bills and is calculated before taxes.

## Best Practices

### ✅ Do's
- Use clear, descriptive tax names
- Set accurate tax rates
- Test with sample bills before going live
- Keep taxes active that apply to your business
- Review tax configuration regularly

### ❌ Don'ts
- Don't delete taxes that are in use
- Don't change rates without proper authorization
- Don't use inclusive taxes unless prices include tax
- Don't create duplicate taxes
- Don't forget to activate new taxes

## API Reference

### Get All Taxes
```http
GET /api/taxes
Authorization: Bearer <token>
```

### Create Tax
```http
POST /api/taxes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "VAT",
  "rate": 10.00,
  "is_inclusive": false
}
```

### Update Tax
```http
PUT /api/taxes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated VAT",
  "rate": 12.00,
  "is_inclusive": false,
  "is_active": true
}
```

### Delete Tax
```http
DELETE /api/taxes/:id
Authorization: Bearer <token>
```

## Audit Trail

All tax operations are logged:
- Tax created
- Tax updated
- Tax deleted
- Tax activated/deactivated

View audit logs:
```
Browser: http://localhost:5002/api/audit-logs?table_name=taxes
```

## Troubleshooting

### Tax Not Applying to Bills
1. Check if tax is active
2. Verify tax rate is correct
3. Check bill generation code
4. Review audit logs

### Wrong Tax Amount
1. Verify tax rate percentage
2. Check if tax is inclusive/exclusive
3. Verify service charge isn't being taxed twice
4. Test with simple amounts

### Can't Delete Tax
1. Only Admin/Manager can delete
2. Check if used in active bills
3. Deactivate instead of delete
4. Contact support if issue persists

## Security

Tax management requires:
- **Admin** or **Manager** role
- Valid JWT token
- All actions logged
- Confirmation for deletions

## Support

For tax configuration help:
- See README.md for general documentation
- Check audit logs for tax changes
- Review bill calculations in Reports
- Contact admin for assistance

---

**Note**: Tax laws vary by location. Consult with a tax professional to ensure compliance with local regulations.
