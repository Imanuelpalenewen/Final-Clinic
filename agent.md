# 🤖 AGENT.MD - Panduan untuk AI Agent

Dokumentasi lengkap untuk membantu AI Agent memahami dan mengembangkan Sistem Klinik Sentosa.

---

## 📋 TABLE OF CONTENTS

1. [Overview Sistem](#overview-sistem)
2. [Tech Stack](#tech-stack)
3. [Struktur Folder](#struktur-folder)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Business Rules](#business-rules)
7. [Frontend Pages](#frontend-pages)
8. [Coding Conventions](#coding-conventions)
9. [Integration Guide](#integration-guide)
10. [Testing Checklist](#testing-checklist)

---

## 🎯 OVERVIEW SISTEM

**Klinik Sentosa** adalah sistem manajemen klinik dengan 5 role user:
- **Admin**: Registrasi pasien, manage data pasien, lihat pembayaran
- **Dokter**: Periksa pasien, beri diagnosis & resep
- **Apoteker**: Proses resep, kelola stok obat
- **Kasir**: Terima pembayaran
- **Owner**: Lihat laporan, kelola akun user

### Flow Sistem Lengkap:
```
1. Admin registrasi pasien → Pasien otomatis masuk antrian (status: waiting)
2. Dokter periksa → Input diagnosis & resep → Status jadi: pharmacy
3. Apotek proses resep → Hitung total cost → Status jadi: cashier
4. Kasir terima pembayaran → Status jadi: completed
```

---

## 🛠 TECH STACK

### Backend
- **Node.js** + **Express.js**
- **SQLite** (better-sqlite3) untuk database
- **JWT** untuk authentication
- **bcrypt** untuk hash password

### Frontend
- **React 18** + **Vite**
- **React Router DOM** v6 untuk routing
- **Axios** untuk HTTP requests
- **TailwindCSS** untuk styling
- **Lucide React** untuk icons

---

## 📁 STRUKTUR FOLDER

```
/Final-Clinic
├── /backend
│   ├── /src
│   │   ├── /controllers      # Business logic
│   │   ├── /routes           # API routes
│   │   ├── /middleware       # Auth JWT
│   │   ├── /models           # DB connection
│   │   ├── /utils            # Helper functions
│   │   ├── app.js            # Express setup
│   │   └── server.js         # Server entry
│   ├── package.json
│   └── .env
│
├── /frontend
│   ├── /src
│   │   ├── /components       # React components
│   │   ├── /pages            # Pages per role
│   │   ├── /hooks            # Custom hooks (useAuth)
│   │   ├── /lib              # Axios, utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── /database
│   ├── klinik_sentosa.db     # SQLite file
│   ├── schema.sql
│   └── seed.sql
│
├── agent.md                  # This file
└── README.md
```

---

## 🗄 DATABASE SCHEMA

### 1. users
```sql
id, username, password (hashed), full_name, role, created_at
Role: 'admin' | 'doctor' | 'pharmacist' | 'cashier' | 'owner'
```

### 2. patients
```sql
id, no_rm (unique), name, dob, address, phone, created_at
```

### 3. queue
```sql
id, queue_number (auto-increment), patient_id, status, 
doctor_notes, diagnosis, total_cost, created_at, updated_at
Status: 'waiting' | 'doctor' | 'pharmacy' | 'cashier' | 'completed' | 'cancelled'
```

### 4. medicines
```sql
id, name, stock, unit, price, updated_at
```

### 5. prescriptions
```sql
id, queue_id, medicine_id, quantity
```

### 6. transactions
```sql
id, queue_id, amount, payment_method, created_at
Payment Method: 'cash' | 'debit' | 'credit'
```

---

## 🌐 API ENDPOINTS

### **Auth**
| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|------|
| POST | `/api/auth/login` | `{username, password}` | `{user, token}` | ❌ |
| GET | `/api/auth/me` | - | `{user}` | ✅ |
| POST | `/api/auth/logout` | - | `{success}` | ✅ |

### **Patients**
| Method | Endpoint | Body | Response | Auth | Role |
|--------|----------|------|----------|------|------|
| GET | `/api/patients` | - | `[patients]` | ✅ | All |
| GET | `/api/patients/:id` | - | `{patient}` | ✅ | All |
| POST | `/api/patients` | `{no_rm, name, dob, address, phone}` | `{patient, queueNumber}` | ✅ | admin |
| PUT | `/api/patients/:id` | `{no_rm, name, dob, address, phone}` | `{patient}` | ✅ | admin |
| DELETE | `/api/patients/:id` | - | `{success}` | ✅ | admin |

**⚠️ IMPORTANT**: POST `/api/patients` otomatis menambahkan pasien ke antrian dengan status `waiting`.

### **Queue**
| Method | Endpoint | Body | Response | Auth | Role |
|--------|----------|------|----------|------|------|
| GET | `/api/queue?status=` | - | `[queue]` | ✅ | All |
| GET | `/api/queue/:id` | - | `{queue + prescriptions}` | ✅ | All |
| PUT | `/api/queue/:id/status` | `{status}` | `{queue}` | ✅ | admin |
| PUT | `/api/queue/:id/doctor` | `{diagnosis, doctor_notes, prescriptions:[{medicine_id, quantity}]}` | `{queue}` | ✅ | doctor |
| PUT | `/api/queue/:id/pharmacy` | - | `{queue, total_cost}` | ✅ | pharmacist |

### **Medicines**
| Method | Endpoint | Body | Response | Auth | Role |
|--------|----------|------|----------|------|------|
| GET | `/api/medicines` | - | `[medicines]` | ✅ | All |
| POST | `/api/medicines` | `{name, stock, unit, price}` | `{medicine}` | ✅ | pharmacist, admin |
| PUT | `/api/medicines/:id` | `{name, stock, unit, price}` | `{medicine}` | ✅ | pharmacist, admin |
| DELETE | `/api/medicines/:id` | - | `{success}` | ✅ | pharmacist, admin |

### **Transactions**
| Method | Endpoint | Body | Response | Auth | Role |
|--------|----------|------|----------|------|------|
| POST | `/api/transactions` | `{queue_id, amount, payment_method}` | `{transaction}` | ✅ | cashier |
| GET | `/api/transactions?startDate=&endDate=` | - | `[transactions]` | ✅ | All |
| GET | `/api/transactions/:id` | - | `{transaction + prescriptions}` | ✅ | All |

---

## 📜 BUSINESS RULES

### 1. Auto-Increment Queue Number
```javascript
// Backend: patientsController.js line ~50
const maxQueue = db.prepare('SELECT COALESCE(MAX(queue_number), 0) as max_num FROM queue').get();
const nextQueueNumber = maxQueue.max_num + 1;
```
**RULE**: Queue number TIDAK pernah reset, selalu increment +1 dari max yang ada.

### 2. Soft Delete Patient
```javascript
// Backend: patientsController.js line ~115
// Saat DELETE patient:
// 1. Update queue status jadi 'cancelled' (BUKAN delete)
// 2. Delete patient record
// 3. Queue number tetap ada, tidak hilang
```

### 3. Status Transition Flow
```
waiting → doctor → pharmacy → cashier → completed
         ↓ (bisa skip ke cancelled)
    cancelled
```
**RULE**: Status harus mengikuti urutan. Tidak boleh loncat-loncat.

### 4. Pharmacy Calculate Total Cost
```javascript
// Backend: queueController.js line ~150
// Saat pharmacy submit:
// 1. Ambil semua prescriptions untuk queue_id
// 2. Hitung: total_cost = SUM(medicine.price * quantity)
// 3. Update stock: medicine.stock -= quantity
// 4. Update queue.total_cost & status = 'cashier'
```

### 5. Payment Complete Transaction
```javascript
// Backend: transactionsController.js line ~20
// Saat cashier bayar:
// 1. Insert record ke table transactions
// 2. Update queue.status = 'completed'
```

---

## 🎨 FRONTEND PAGES

### Mapping Pages → Endpoints

| Role | Page | Main Endpoints | Actions |
|------|------|---------------|---------|
| **Admin** | Dashboard | `/patients`, `/queue` | View stats |
| | PatientRegistration | `POST /patients` | Create patient → auto queue |
| | PatientManagement | `GET /patients`, `DELETE /patients/:id` | CRUD patients |
| | Payments | `GET /transactions` | View all transactions |
| | Reports | - | (In development) |
| **Doctor** | Dashboard | `GET /queue?status=doctor` | View waiting count |
| | Examinations | `GET /queue?status=doctor`, `PUT /queue/:id/doctor` | Examine + prescribe |
| | Prescriptions | - | (In development) |
| **Pharmacist** | Dashboard | `GET /queue?status=pharmacy` | View waiting count |
| | Prescriptions | `GET /queue?status=pharmacy`, `PUT /queue/:id/pharmacy` | Process prescriptions |
| | Stock | `GET /medicines`, `POST /medicines`, `PUT /medicines/:id` | Manage medicine stock |
| **Cashier** | Dashboard | `GET /queue?status=cashier`, `POST /transactions` | Accept payments |
| **Owner** | Dashboard | - | (In development) |
| | Reports | - | (In development) |
| | Accounts | - | (In development) |

---

## 🔧 CODING CONVENTIONS

### Backend
```javascript
// File naming: camelCase
// Example: patientsController.js, authRoutes.js

// Function naming: camelCase
// Example: getAllPatients, createPatient

// Response format (ALWAYS):
{
  success: true/false,
  message: "Success message or error",
  data: {} // actual data
}

// Error handling:
try {
  // ... logic
  res.json({ success: true, data: result });
} catch (error) {
  res.status(500).json({ 
    success: false, 
    message: error.message 
  });
}
```

### Frontend
```javascript
// File naming: PascalCase for components
// Example: Login.jsx, Dashboard.jsx

// Axios usage:
import axios from '../lib/axios'; // Always use this, NOT raw axios

// Async data fetching pattern:
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const response = await axios.get('/endpoint');
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);

// State naming: descriptive
// Good: patients, queueList, selectedQueue
// Bad: data, items, selected
```

---

## 🔗 INTEGRATION GUIDE

### 1. Axios Interceptors (Already Setup)
```javascript
// File: frontend/src/lib/axios.js

// Request interceptor (line 15):
// Automatically adds JWT token to all requests
config.headers.Authorization = `Bearer ${token}`;

// Response interceptor (line 25):
// If 401 (Unauthorized) → Auto logout & redirect to login
```

### 2. Protected Routes Pattern
```javascript
// File: frontend/src/App.jsx line 40

<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>

// Checks:
// 1. User logged in? (if not → redirect /login)
// 2. User role allowed? (if not → redirect to own dashboard)
```

### 3. Auth Flow
```javascript
// Login:
1. User submit username + password
2. POST /api/auth/login
3. Backend verify & return JWT token
4. Frontend save to localStorage: token + user
5. Redirect to /{role}/dashboard

// Logout:
1. Remove token from localStorage
2. Remove user from localStorage
3. Redirect to /login
```

---

## ✅ TESTING CHECKLIST

### Manual Testing Steps

#### 1. Authentication
- [ ] Login dengan username: `admin`, password: `password123`
- [ ] Login dengan role lain (doctor, pharmacist, cashier, owner)
- [ ] Cek redirect ke dashboard sesuai role
- [ ] Logout berhasil & redirect ke login

#### 2. Admin - Registrasi Pasien
- [ ] Buka `/admin/patient-registration`
- [ ] Isi form: No RM, Nama, Tanggal Lahir, Alamat, Telepon
- [ ] Submit form
- [ ] Cek: Pasien masuk database
- [ ] Cek: Nomor antrian auto-generated
- [ ] Cek: Status antrian = 'waiting'

#### 3. Doctor - Pemeriksaan
- [ ] Login sebagai `doctor`
- [ ] Buka `/doctor/examinations`
- [ ] Cek: Muncul list pasien dengan status 'doctor'
- [ ] Klik "Periksa" pada pasien
- [ ] Isi: Diagnosis, Catatan Dokter, Tambah Resep Obat
- [ ] Submit
- [ ] Cek: Status berubah jadi 'pharmacy'

#### 4. Pharmacist - Proses Resep
- [ ] Login sebagai `pharmacist`
- [ ] Buka `/pharmacist/prescriptions`
- [ ] Cek: Muncul list pasien dengan status 'pharmacy'
- [ ] Klik "Proses Resep"
- [ ] Cek: Total cost dihitung otomatis
- [ ] Cek: Stok obat berkurang
- [ ] Cek: Status berubah jadi 'cashier'

#### 5. Cashier - Pembayaran
- [ ] Login sebagai `cashier`
- [ ] Buka `/cashier/dashboard`
- [ ] Cek: Muncul list pasien dengan status 'cashier'
- [ ] Klik "Terima Pembayaran"
- [ ] Input metode pembayaran (cash/debit/credit)
- [ ] Cek: Status berubah jadi 'completed'
- [ ] Cek: Record masuk table transactions

#### 6. Admin - Delete Patient
- [ ] Login sebagai `admin`
- [ ] Buka `/admin/patient-management`
- [ ] Delete salah satu pasien
- [ ] Cek: Pasien terhapus dari table patients
- [ ] Cek: Queue status jadi 'cancelled' (BUKAN delete)
- [ ] Cek: Nomor antrian tetap ada

#### 7. Pharmacist - Manage Stock
- [ ] Login sebagai `pharmacist`
- [ ] Buka `/pharmacist/stock`
- [ ] Tambah obat baru
- [ ] Edit stok obat
- [ ] Cek: Perubahan tersimpan di database

### Edge Cases to Test

1. **Login dengan credentials salah** → Show error message
2. **Akses halaman tanpa login** → Redirect ke /login
3. **Doctor akses halaman admin** → Redirect ke /doctor/dashboard
4. **Proses resep dengan stok obat tidak cukup** → Show error
5. **Submit form dengan field kosong** → Show validation error

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: "Token not found" saat akses API
**Solution**: Check localStorage, pastikan token tersimpan. Jika tidak ada, user harus login lagi.

### Issue 2: CORS error di browser
**Solution**: Backend sudah setup CORS di `app.js`. Pastikan `FRONTEND_URL` di `.env` benar.

### Issue 3: Database locked (SQLite)
**Solution**: SQLite menggunakan WAL mode. Pastikan tidak ada koneksi lain yang open.

### Issue 4: Stok obat minus
**Solution**: Backend sudah ada validasi di `queueController.js line ~140`. Tidak boleh proses jika stok < quantity.

---

## 📝 DEVELOPMENT TIPS

### 1. Tambah Fitur Baru
```
1. Buat endpoint di backend (controller + route)
2. Test endpoint dengan Postman/Thunder Client
3. Buat page/component di frontend
4. Integrate dengan axios
5. Test full flow
```

### 2. Debug Tips
```javascript
// Backend: Log semua errors
console.error('Error:', error);

// Frontend: Log response dari API
console.log('API Response:', response);

// Check network tab di browser DevTools
```

### 3. Database Inspect
```bash
# Install SQLite browser atau gunakan CLI:
cd database
sqlite3 klinik_sentosa.db

# Run queries:
SELECT * FROM users;
SELECT * FROM queue;
SELECT * FROM medicines;
```

---

## 🎓 LEARNING RESOURCES

- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **SQLite**: https://www.sqlite.org/docs.html
- **JWT**: https://jwt.io/introduction
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 📞 SUPPORT

Jika AI Agent menemukan bug atau ada pertanyaan tentang sistem:
1. Check file ini (agent.md) terlebih dahulu
2. Check code comments di file terkait
3. Check console logs untuk error messages

---

**Last Updated**: November 24, 2025
**Version**: 1.0.0
**Maintainer**: Klinik Sentosa Dev Team
