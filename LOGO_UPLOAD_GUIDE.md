# Logo & Avatar Upload Guide

## Overview

Your Restaurant POS system now supports image uploads for user avatars and shop logos, enhancing personalization and branding.

## 🖼️ Features

### User Avatar Upload
- ✅ Upload profile picture (max 5MB)
- ✅ Display on profile page
- ✅ Show in sidebar
- ✅ Replace existing avatar
- ✅ Delete avatar
- ✅ Automatic old file cleanup
- ✅ Initials fallback if no avatar

### Shop Logo Upload
- ✅ Upload shop logo (max 5MB)
- ✅ Display on shop cards
- ✅ Use on receipts (future)
- ✅ Replace existing logo
- ✅ Delete logo
- ✅ Automatic old file cleanup
- ✅ Store icon fallback if no logo

## 📸 User Avatar Upload

### How to Upload Your Avatar

1. **Navigate to Profile**
   - Click your name in bottom-left sidebar
   - Or go to: Profile page

2. **Upload Avatar**
   - Click the camera icon (📷) on your profile picture
   - Select an image file
   - Supported formats: JPG, PNG, GIF, WebP
   - Maximum size: 5MB
   - Image uploads automatically

3. **View Avatar**
   - Avatar displays immediately
   - Shown on profile page (large)
   - Shown in sidebar (small)
   - Updates across all pages

### Remove Avatar

1. **Click trash icon** (🗑️) on profile picture
2. **Confirm deletion**
3. Reverts to initials (first letter of first & last name)

### Avatar Display

**Profile Page:**
- Large circular avatar (80x80px)
- Border with shadow
- Camera icon overlay for upload
- Trash icon for delete

**Sidebar:**
- Small circular avatar (32x32px)
- Shown next to your name
- Updates when avatar changes

**Fallback:**
- If no avatar: Shows initials in circle
- Example: "John Doe" → "JD"

## 🏪 Shop Logo Upload

### How to Upload Shop Logo

1. **Navigate to Shops**
   - Click "Shops" in sidebar
   - Find the shop to add logo

2. **Upload Logo**
   - Click camera icon (📷) on shop card
   - Select logo image file
   - Supported formats: JPG, PNG, GIF, WebP
   - Maximum size: 5MB
   - Logo uploads automatically

3. **View Logo**
   - Logo displays on shop card
   - Circular format (48x48px)
   - Will appear on receipts (future enhancement)

### Remove Shop Logo

1. **Click trash icon** (🗑️) on logo
2. **Confirm removal**
3. Reverts to store icon

### Logo Display

**Shop Card:**
- Circular logo (48x48px)
- Border with shadow
- Camera icon for upload
- Trash icon for delete
- Store icon fallback if no logo

**Future Enhancements:**
- Logo on printed receipts
- Logo on bills
- Logo on reports

## 🔧 Technical Details

### Backend Implementation

#### File Upload Middleware (Multer)
```javascript
- Storage: Disk storage
- Max size: 5MB
- Allowed: Images only (image/*)
- Directories: 
  - /uploads/avatars/ (user avatars)
  - /uploads/shop-logos/ (shop logos)
```

#### API Endpoints

**Avatar Upload:**
```http
POST /api/profile/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- avatar: <image file>
```

**Avatar Delete:**
```http
DELETE /api/profile/avatar
Authorization: Bearer <token>
```

**Shop Logo Upload:**
```http
POST /api/shops/:id/logo
Authorization: Bearer <token>
Content-Type: multipart/form-data
Roles: Admin, Manager

Form Data:
- logo: <image file>
```

**Shop Logo Delete:**
```http
DELETE /api/shops/:id/logo
Authorization: Bearer <token>
Roles: Admin, Manager
```

### Database Schema

**Users table updated:**
```sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
```

**Shops table updated:**
```sql
ALTER TABLE shops ADD COLUMN logo_url TEXT;
```

### File Storage

**Directory Structure:**
```
uploads/
├── avatars/
│   ├── 1234567890-123456789.jpg
│   ├── 1234567891-987654321.png
│   └── .gitkeep
└── shop-logos/
    ├── 1234567892-456789123.jpg
    ├── 1234567893-789123456.png
    └── .gitkeep
```

**File Naming:**
- Format: `{timestamp}-{random}.{ext}`
- Example: `1697123456789-987654321.jpg`
- Prevents conflicts and overwrites

### Frontend Implementation

**Avatar Upload Component:**
```jsx
<input 
  type="file" 
  accept="image/*"
  onChange={handleAvatarUpload}
/>
```

**Features:**
- FormData for file upload
- Loading state during upload
- Error handling
- File validation (type, size)
- Preview before upload (optional)
- Automatic refresh after upload

## 📋 Supported Formats

### Image Formats
- ✅ **JPEG/JPG** - Most common, good compression
- ✅ **PNG** - Transparency support, high quality
- ✅ **GIF** - Animation support (not recommended for logos)
- ✅ **WebP** - Modern format, excellent compression

### Recommended Specifications

**User Avatars:**
- Size: 200x200px to 500x500px
- Format: JPG or PNG
- File size: < 500KB for best performance
- Square aspect ratio recommended

**Shop Logos:**
- Size: 300x300px to 800x800px
- Format: PNG (for transparency) or JPG
- File size: < 1MB for best performance
- Square or horizontal aspect ratio

## 🎨 Best Practices

### For User Avatars

✅ **Do:**
- Use clear, professional photos
- Square images work best
- Keep file size under 500KB
- Use JPG for photos, PNG for graphics
- Center your face in the image

❌ **Don't:**
- Upload very large files (slows down loading)
- Use inappropriate images
- Upload copyrighted material
- Use low-resolution images

### For Shop Logos

✅ **Do:**
- Use your official logo
- High resolution (300x300px minimum)
- PNG format for transparency
- Professional, clear branding
- Test visibility on receipts

❌ **Don't:**
- Use pixelated images
- Upload very large files
- Use copyrighted logos without permission
- Change logo frequently (brand consistency)

## 🔒 Security

### File Upload Security

- ✅ **Size Limit**: 5MB maximum
- ✅ **Type Validation**: Images only
- ✅ **Extension Check**: Server-side validation
- ✅ **Unique Filenames**: Prevents conflicts
- ✅ **Old File Cleanup**: Deletes previous uploads
- ✅ **Authorization**: JWT required
- ✅ **Role-Based**: Shop logos require Admin/Manager

### Privacy

- User avatars visible to all logged-in users
- Shop logos visible to all users
- Files stored on server filesystem
- No public access without authentication

## 📊 Storage Management

### Automatic Cleanup

When you upload new image:
1. New file saved to disk
2. Database updated with new URL
3. Old file automatically deleted
4. No orphaned files left

### Manual Cleanup (Admin)

```bash
# View upload directory
ls -lh uploads/avatars/
ls -lh uploads/shop-logos/

# Check disk usage
du -sh uploads/

# Clean orphaned files (run from server)
# This would require custom script
```

### Backup Uploads

```bash
# Include uploads in backup
tar -czf backup.tar.gz restaurant.db uploads/

# Restore uploads
tar -xzf backup.tar.gz
```

## 🛠️ Troubleshooting

### Upload Fails

**"File too large"**
- Compress image before upload
- Use online compression tools
- Maximum: 5MB

**"Invalid file type"**
- Only images allowed (JPG, PNG, GIF, WebP)
- Check file extension
- Re-save image in supported format

**"Upload failed"**
- Check internet connection
- Verify server is running
- Check uploads directory permissions
- Review server logs

### Image Not Displaying

**Avatar not showing:**
- Hard refresh browser (Ctrl+F5)
- Check if file exists: http://localhost:5002/uploads/avatars/
- Verify avatar_url in database
- Check server logs

**Logo not showing:**
- Hard refresh browser
- Check file exists in uploads/shop-logos/
- Verify logo_url in database
- Check CORS settings

### Permissions Error

```bash
# Fix upload directory permissions
chmod -R 755 uploads/
chown -R $USER:$USER uploads/
```

## 🎯 Example Usage

### Upload User Avatar

```javascript
// Frontend code
const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  await axios.post('/api/profile/avatar', formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};
```

### Upload Shop Logo

```javascript
// Frontend code
const handleUpload = async (shopId, file) => {
  const formData = new FormData();
  formData.append('logo', file);
  
  await axios.post(`/api/shops/${shopId}/logo`, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};
```

## 📱 Mobile Upload

On mobile devices:
- Camera icon opens camera or photo library
- Can take new photo or select existing
- Automatic upload after selection
- Same size and format restrictions apply

## 🚀 Future Enhancements

Planned features:
- 📸 Image cropping before upload
- 🖼️ Multiple image sizes (thumbnail, medium, large)
- ☁️ Cloud storage integration (S3, Cloudinary)
- 🎨 Image filters and effects
- 📄 Logo on PDF receipts
- 🌐 CDN integration for faster loading
- 📊 Usage analytics

## ✅ Checklist

### After Implementation

- [x] Upload directories created
- [x] Multer configured
- [x] Database schema updated
- [x] API endpoints created
- [x] Frontend components updated
- [x] Error handling added
- [x] File cleanup implemented
- [x] Documentation written

### Before Going Live

- [ ] Test uploads on production server
- [ ] Verify disk space available
- [ ] Set up backup strategy for uploads
- [ ] Configure file size limits
- [ ] Test with different image formats
- [ ] Mobile upload testing
- [ ] Load testing with concurrent uploads

## 📞 Support

Having issues with uploads?
1. Check browser console for errors
2. Verify file size < 5MB
3. Ensure file is an image
4. Check server logs: `docker logs restaurant-pos-api`
5. Verify uploads directory permissions

---

**Note:** Uploaded files are stored on server filesystem. For production, consider using cloud storage (AWS S3, Google Cloud Storage, etc.) for better scalability.
