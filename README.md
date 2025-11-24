# 🏥 Klinik Sentosa - Sistem Manajemen Klinik

Sistem manajemen klinik lengkap dengan fitur registrasi pasien, antrian, pemeriksaan dokter, apotek, dan kasir.

## 📋 Fitur Utama

✅ **Multi-Role System**
- Admin: Registrasi pasien, manage data pasien
- Dokter: Pemeriksaan & resep obat  
- Apoteker: Proses resep & kelola stok obat
- Kasir: Terima pembayaran
- Owner: Lihat laporan & kelola user

✅ **Auto Queue System**  
Pasien otomatis masuk antrian saat registrasi

✅ **Complete Workflow**  
Waiting → Doctor → Pharmacy → Cashier → Completed

✅ **Modern UI**  
React + TailwindCSS dengan design responsive

✅ **Secure Authentication**  
JWT-based authentication dengan role-based access

---

## 🛠 Tech Stack

### Backend
- Node.js + Express.js
- SQLite (better-sqlite3)
- JWT Authentication
- bcrypt

### Frontend
- React 18 + Vite
- React Router DOM v6
- Axios
- TailwindCSS

---

## 📦 Prerequisites

Pastikan sudah terinstall:
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** atau **yarn**
- **Git** (optional)

---

## 🚀 Installation & Setup

### 1. Clone / Download Project
```bash
# Jika menggunakan Git
git clone <repository-url>
cd Final-Clinic

# Atau extract ZIP file
```

### 2. Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install

# Initialize database
npm run init-db

# Start backend server
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 3. Setup Frontend

Buka terminal baru:

```bash
# Masuk ke folder frontend
cd frontend

# Install dependencies  
npm install

# Start development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

---

## 🔐 Default Credentials

Gunakan credentials berikut untuk login:

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | Admin |
| doctor | password123 | Dokter |
| pharmacist | password123 | Apoteker |
| cashier | password123 | Kasir |
| owner | password123 | Owner |

---

## 📖 User Guide

### **Admin**
1. Login sebagai `admin`
2. Registrasi pasien baru di menu "Registrasi Pasien"
3. Pasien otomatis masuk antrian dengan nomor urut
4. Lihat data pasien di menu "Data Pasien"
5. Lihat riwayat pembayaran di menu "Pembayaran"

### **Dokter**
1. Login sebagai `doctor`
2. Buka menu "Pemeriksaan"
3. Pilih pasien dari antrian
4. Input diagnosis & catatan dokter
5. Tambah resep obat (optional)
6. Submit → Pasien masuk ke antrian apotek

### **Apoteker**
1. Login sebagai `pharmacist`
2. Buka menu "Resep Masuk"
3. Proses resep pasien
4. System otomatis hitung total biaya & kurangi stok
5. Pasien masuk ke antrian kasir
6. Kelola stok obat di menu "Stok Obat"

### **Kasir**
1. Login sebagai `cashier`
2. Lihat antrian pembayaran
3. Klik "Terima Pembayaran"
4. Pilih metode pembayaran (Cash/Debit/Credit)
5. Transaksi selesai → Status jadi "Completed"

---

## 🗂 Struktur Folder

```
Final-Clinic/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # Database models
│   │   ├── utils/           # Helper functions
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Pages per role
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Axios, utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   ├── klinik_sentosa.db    # SQLite database
│   ├── schema.sql           # Database schema
│   └── seed.sql             # Initial data
│
├── agent.md                 # AI Agent documentation
└── README.md                # This file
```

---

## 🔄 Business Flow

```
1. Admin registrasi pasien
   ↓
2. Pasien otomatis masuk antrian (Status: WAITING)
   ↓
3. Dokter periksa & beri resep (Status: DOCTOR → PHARMACY)
   ↓
4. Apotek proses resep & hitung total (Status: PHARMACY → CASHIER)
   ↓
5. Kasir terima pembayaran (Status: CASHIER → COMPLETED)
```

---

## 🐛 Troubleshooting

### Backend tidak bisa start
```bash
# Pastikan port 5000 tidak dipakai
# Check dengan:
netstat -ano | findstr :5000

# Atau ubah port di backend/.env
PORT=5001
```

### Frontend tidak bisa start
```bash
# Pastikan port 5173 tidak dipakai
# Atau ubah di vite.config.js

# Jika error dependencies:
rm -rf node_modules package-lock.json
npm install
```

### Database error
```bash
# Re-initialize database:
cd backend
npm run init-db
```

### CORS Error
Pastikan `FRONTEND_URL` di `backend/.env` sesuai:
```
FRONTEND_URL=http://localhost:5173
```

---

## 📚 API Documentation

Lihat lengkap di [agent.md](./agent.md) untuk:
- List semua API endpoints
- Request/Response format
- Business rules
- Integration guide

---

## 🧪 Testing

### Manual Testing
1. Login sebagai admin
2. Registrasi pasien baru
3. Login sebagai doctor → Periksa pasien
4. Login sebagai pharmacist → Proses resep
5. Login sebagai cashier → Terima pembayaran
6. Cek status antrian berubah sesuai flow

### Check Database
```bash
cd database
sqlite3 klinik_sentosa.db

# Run queries:
SELECT * FROM patients;
SELECT * FROM queue;
SELECT * FROM medicines;
```

---

## 🚀 Build for Production

### Backend
```bash
cd backend
npm install --production
npm start
```

### Frontend
```bash
cd frontend
npm run build

# Output di folder 'dist'
# Deploy ke hosting (Vercel, Netlify, dll)
```

---

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your-secret-key-here
DATABASE_PATH=../database/klinik_sentosa.db
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is for educational purposes.

---

## 👥 Team

**Klinik Sentosa Development Team**  
Universitas - Semester 5  
Mata Kuliah: Sistem Analisis & Desain

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check [agent.md](./agent.md) untuk detail teknis
2. Check [Troubleshooting](#troubleshooting) section
3. Check console logs untuk error messages

---

**Happy Coding! 🎉**

---

## 📌 Quick Commands

```bash
# Backend
cd backend
npm install              # Install dependencies
npm run init-db          # Initialize database
npm run dev              # Start development server

# Frontend
cd frontend
npm install              # Install dependencies
npm run dev              # Start development server
npm run build            # Build for production

# Database
cd database
sqlite3 klinik_sentosa.db  # Open database
```

---

Last Updated: November 24, 2025
