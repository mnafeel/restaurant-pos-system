# 🍽️ Restaurant POS Pro v1.0.0

> Professional Restaurant Point of Sale System with Multi-Shop Management, Billing, and Analytics

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📋 Overview

**Restaurant POS Pro** is a comprehensive, full-stack point of sale system designed for restaurants, cafes, and food service businesses. Built with React and Node.js, it offers powerful features for order management, billing, inventory tracking, and business analytics.

### ✨ Key Features

- 🏪 **Multi-Shop Management** - Manage multiple restaurant locations from one system
- 💰 **Dynamic Currency Support** - 30+ currencies supported
- 🕐 **Indian Standard Time (IST)** - Automatic timezone handling
- 🍳 **Kitchen Display System** - Real-time order tracking for kitchen
- 💳 **Multiple Payment Methods** - Cash, Card, UPI support
- 📊 **Advanced Reports** - Sales, payments, top items analytics
- 🖨️ **Thermal Printing** - Direct receipt printing support
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔐 **Role-Based Access** - Owner, Admin, Manager, Cashier, Chef roles
- 🎨 **Premium UI/UX** - Modern, intuitive interface

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

   ```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/restaurant-pos-system.git
cd restaurant-pos-system

# Install backend dependencies
   npm install

# Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

### Running the Application

#### **Development Mode:**

```bash
# Terminal 1 - Start Backend Server
node server.js

# Terminal 2 - Start Frontend (in client directory)
cd client
npm start
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5002

#### **Production Mode:**

   ```bash
# Build frontend
cd client
npm run build
cd ..

# Start backend
node server.js

# Serve frontend (in another terminal)
cd client
npx serve -s build -p 3000
```

---

## 👤 Default Login Credentials

**Owner Account:**
- Username: `owner`
- Password: `owner123`
- Access: Full system access, shop management

---

## 📦 Tech Stack

### **Frontend:**
- React 18
- React Router v6
- Axios (HTTP client)
- Tailwind CSS (styling)
- Chart.js (analytics)
- React Hot Toast (notifications)
- Socket.io Client (real-time updates)

### **Backend:**
- Node.js
- Express.js
- SQLite3 (database)
- Socket.io (real-time communication)
- JWT (authentication)
- bcryptjs (password hashing)
- Moment.js with timezone support
- Express Rate Limit (security)
- Helmet (security)

---

## 🏗️ Project Structure

```
restaurant-pos-system/
├── client/                    # React frontend
│   ├── public/
│   └── src/
│       ├── components/        # Reusable components
│       ├── contexts/          # React contexts (Auth, Currency)
│       ├── hooks/             # Custom hooks (useServerTime)
│       ├── pages/             # Page components
│       └── index.js
├── uploads/                   # User uploads (avatars, menu images)
├── server.js                  # Express backend server
├── restaurant.db              # SQLite database
├── version.json               # Version configuration
└── package.json
```

---

## 🌟 Main Features

### 👑 **Owner Portal**
- Create and manage multiple shop locations
- Manage staff across all shops
- View consolidated analytics
- Upload company logo and branding
- Change shop admin passwords

### 🏪 **Shop Management**
- Each shop has its own admin account
- Complete data isolation between shops
- Shop-specific staff management
- Individual shop settings

### 🍽️ **Menu Management**
- Add items with images
- Category organization
- Stock tracking
- Price management
- Availability toggle (in-stock/out-of-stock)
- Category sorting and filtering

### 📱 **Order Taking**
- Dine-In, Takeaway order types
- Table selection (when enabled)
- Visual menu grid
- Real-time cart updates
- Customer information capture
- Payment method selection
- Send to kitchen functionality
- Pending orders management

### 🧾 **Billing**
- Professional bill generation
- Tax and service charge calculation
- Discount management
- Split bill support
- Thermal receipt printing
- Bill history and reprinting

### 📊 **Reports & Analytics**
- Sales reports (daily, weekly, monthly)
- Payment breakdown (Cash, Card, UPI)
- Top selling items analysis
- Staff performance tracking
- Date range filtering
- CSV export functionality

### ⚙️ **Settings**
- Currency selection (30+ currencies)
- Table management toggle
- Kitchen display system toggle
- Default payment method
- Shop information

---

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Rate limiting on login attempts
- ✅ Helmet security headers
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Audit logging for all actions

---

## 🌐 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy Options:
- **Render.com** - Free tier available, auto-deploy from GitHub
- **Railway.app** - Simple deployment, good free tier
- **Heroku** - Traditional PaaS option
- **DigitalOcean** - VPS for more control
- **AWS/Azure** - Enterprise cloud platforms

---

## 📝 Configuration

### **Backend (server.js)**

```javascript
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
```

### **Frontend (client/src/index.js)**

```javascript
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
```

---

## 🔧 API Documentation

### **Public Endpoints (No Auth Required):**
- `GET /api/version` - System version info
- `GET /api/server-time` - Current IST time
- `GET /api/public/branding` - Company branding

### **Authentication:**
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Orders:**
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `PUT /api/orders/:id/status` - Update order status

### **Bills:**
- `GET /api/bills` - List bills
- `GET /api/bills/:id` - Get bill details
- `POST /api/bills` - Generate bill
- `PUT /api/bills/:id` - Update bill

### **Menu:**
- `GET /api/menu` - List menu items
- `POST /api/menu` - Add menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### **Reports:**
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/top-items` - Top selling items
- `GET /api/reports/daily-payments` - Payment breakdown
- `GET /api/reports/dashboard` - Dashboard statistics

---

## 📊 Database Schema

### **Main Tables:**
- `users` - User accounts and authentication
- `shops` - Restaurant shop locations
- `tables` - Table management
- `menu_items` - Menu items with pricing
- `categories` - Menu categories
- `orders` - Customer orders
- `order_items` - Order line items
- `bills` - Generated bills
- `settings` - System configuration
- `audit_logs` - Activity tracking

---

## 🎨 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Analytics)

### Order Taking
![Order Taking](https://via.placeholder.com/800x400?text=Order+Taking+Screen)

### Menu Management
![Menu](https://via.placeholder.com/800x400?text=Menu+Management)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with React and Node.js
- Icons by React Icons (Feather Icons)
- Charts by Chart.js
- UI inspired by modern POS systems

---

## 📞 Contact & Support

- **Email:** support@yourrestaurant.com
- **Website:** https://yourrestaurant.com
- **GitHub Issues:** For bug reports and feature requests

---

## 🗓️ Version History

### v1.0.0 (2025-10-17)
- ✅ Initial release
- ✅ Multi-shop management
- ✅ Dynamic currency support
- ✅ Indian timezone (IST)
- ✅ Kitchen display system
- ✅ Complete billing system
- ✅ Reports and analytics

---

## 🔮 Roadmap

### Future Enhancements:
- [ ] Mobile app (React Native)
- [ ] Online ordering integration
- [ ] Customer loyalty program
- [ ] Advanced inventory management
- [ ] Multi-language support
- [ ] WhatsApp notifications
- [ ] Email receipts
- [ ] Cloud backup automation
- [ ] Advanced analytics dashboard
- [ ] Third-party integrations (Zomato, Swiggy)

---

**Made with ❤️ for Restaurant Businesses**

**Restaurant POS Pro v1.0.0** | © 2025 | Indian Standard Time (IST)
