# 🚀 QUICK START GUIDE - Klinik Sentosa

## Cara Cepat Menjalankan Sistem

### ✅ Prerequisites Check
Pastikan sudah install:
- ✅ Node.js v18+ 
- ✅ npm

### 📝 Langkah Pertama Kali (Hanya Sekali)

#### 1. Install Frontend Dependencies
```bash
cd "D:\Document\Kuliah\Sem 5\SAD - B\Tugas\Klinik-moti\Final-Clinic\frontend"
npm install
```

**✅ SUDAH SELESAI** - Backend dependencies & database sudah di-setup!

---

## 🎯 Cara Menjalankan (Setiap Kali)

### OPTION 1: Pakai Batch Files (PALING MUDAH) ✨

#### Terminal 1 - Backend:
1. Buka Windows Explorer
2. Navigate ke folder: `D:\Document\Kuliah\Sem 5\SAD - B\Tugas\Klinik-moti\Final-Clinic`
3. **Double-click** file: `start-backend.bat`
4. Backend akan jalan di `http://localhost:5000`

#### Terminal 2 - Frontend:
1. Buka Windows Explorer lagi
2. Navigate ke folder yang sama
3. **Double-click** file: `start-frontend.bat`  
4. Frontend akan jalan di `http://localhost:5173`

#### Test Sistem:
1. Buka browser: `http://localhost:5173`
2. Login dengan:
   - Username: `admin`
   - Password: `password123`

---

### OPTION 2: Manual via Terminal/CMD

#### Terminal 1 - Backend:
```bash
cd "D:\Document\Kuliah\Sem 5\SAD - B\Tugas\Klinik-moti\Final-Clinic\backend"
node src/server.js
```

#### Terminal 2 - Frontend:
```bash
cd "D:\Document\Kuliah\Sem 5\SAD - B\Tugas\Klinik-moti\Final-Clinic\frontend"
npm run dev
```

---

### OPTION 3: Pakai PowerShell

#### Terminal 1 - Backend:
```powershell
cd "D:\Document\Kuliah\Sem 5\SAD - B\Tugas\Klinik-moti\Final-Clinic\backend"
node src/server.js
```

#### Terminal 2 - Frontend:
```powershell
cd "D:\Document\Kuliah\Sem 5\SAD - B\Tugas\Klinik-moti\Final-Clinic\frontend"
npm run dev
```

---

## 🛑 Cara Stop Server

### Backend:
- Tekan `Ctrl + C` di terminal backend
- Atau close terminal window

### Frontend:
- Tekan `Ctrl + C` di terminal frontend
- Atau close terminal window

---

## ⚠️ Troubleshooting

### Error: "Port 5000 already in use"
```bash
# Windows CMD:
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F

# Contoh:
taskkill /PID 4152 /F
```

### Error: "Port 5173 already in use"
```bash
# Windows CMD:
netstat -ano | findstr :5173
taskkill /PID [PID_NUMBER] /F
```

### Error: "Cannot find module"
```bash
# Frontend:
cd frontend
npm install

# Backend:
cd backend
npm install
```

### Error: "Database not found"
```bash
cd backend
npm run init-db
```

---

## 🔐 Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | Admin |
| doctor | password123 | Dokter |
| pharmacist | password123 | Apoteker |
| cashier | password123 | Kasir |
| owner | password123 | Owner |

---

## 📊 Test Flow Lengkap

### 1. Login sebagai Admin
- Username: `admin`
- Password: `password123`

### 2. Registrasi Pasien Baru
- Buka menu: **Registrasi Pasien**
- Isi data pasien
- Submit → Pasien otomatis masuk antrian

### 3. Login sebagai Doctor (Terminal Baru)
- Logout dari admin
- Login dengan: `doctor` / `password123`
- Buka menu: **Pemeriksaan**
- Pilih pasien dari antrian
- Input diagnosis & resep
- Submit → Status jadi "Pharmacy"

### 4. Login sebagai Pharmacist
- Logout dari doctor
- Login dengan: `pharmacist` / `password123`
- Buka menu: **Resep Masuk**
- Klik "Proses Resep"
- Total cost akan dihitung otomatis
- Status jadi "Cashier"

### 5. Login sebagai Cashier
- Logout dari pharmacist
- Login dengan: `cashier` / `password123`
- Dashboard akan tampil antrian pembayaran
- Klik "Terima Pembayaran"
- Pilih metode (cash/debit/credit)
- Status jadi "Completed"

---

## ✅ Success!

Jika semua langkah berhasil:
- ✅ Backend jalan di port 5000
- ✅ Frontend jalan di port 5173
- ✅ Login berhasil
- ✅ Bisa registrasi pasien
- ✅ Flow lengkap berjalan

**Sistem siap digunakan!** 🎉

---

## 📚 Dokumentasi Lengkap

- **README.md** - Setup guide lengkap
- **agent.md** - Technical documentation untuk developer/AI

---

## 🆘 Need Help?

1. Check error message di terminal
2. Check troubleshooting section di atas
3. Check README.md untuk detail
4. Check agent.md untuk technical issues

---

**Last Updated**: November 24, 2025
