# ABSENSI SISWA DIGITAL

<div align="center">

</div>

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![AdonisJS](https://img.shields.io/badge/AdonisJS-6.x-blueviolet.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)

**Sistem Absensi Digital Modern untuk Sekolah** - Solusi lengkap untuk mengelola kehadiran siswa dengan teknologi Fingerprint dan Face Recognition.

## ✨ Fitur Utama

### 🎯 Sistem Absensi Multi-Platform
- **Absensi Manual** - Input kehadiran secara manual oleh admin/guru
- **Fingerprint Recognition** - Integrasi dengan perangkat fingerprint ZKTeco
- **Face Recognition** - Teknologi pengenalan wajah berbasis AI
- **Real-time Monitoring** - Pantau kehadiran siswa secara langsung

### 📊 Manajemen Data Komprehensif
- **Data Siswa** - Kelola informasi lengkap siswa dan kelas
- **Data Guru** - Manajemen guru dan mata pelajaran
- **Kelas & Jadwal** - Organisasi kelas dan penjadwalan pelajaran
- **Perangkat** - Monitoring dan kontrol perangkat fingerprint

### 📈 Laporan & Analitik
- **Dashboard Interaktif** - Visualisasi data dengan chart dinamis
- **Laporan Detail** - Export ke Excel dengan format profesional
- **Statistik Real-time** - Tingkat kehadiran dan tren bulanan
- **Filter Lanjutan** - Pencarian berdasarkan tanggal, kelas, dan status



## 📋 Persyaratan Sistem

- Node.js 18 atau lebih tinggi
- MySQL 8.0 atau lebih tinggi
- NPM atau Yarn
- Git

## ⚡ Instalasi Cepat

### 1. Clone Repository
```bash
git clone https://github.com/imtaqin/ABSENSI-SISWA-DIGITAL.git
cd ABSENSI-SISWA-DIGITAL
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment
```bash
cp .env.example .env
```

Edit file `.env` dengan konfigurasi database Anda:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=absensi_siswa
```

### 4. Setup Database
```bash
# Buat database
mysql -u root -p -e "CREATE DATABASE absensi_siswa"

# Jalankan migrasi
node ace migration:run

# Seeder data awal (opsional)
npm run seed
```

### 5. Generate Key & Start Server
```bash
node ace generate:key
npm run dev
```

Buka browser dan akses: `http://localhost:3333`

## 📖 Dokumentasi

### Struktur Proyek
```
├── app/
│   ├── controllers/          # Controller untuk routing
│   ├── models/              # Model database
│   └── services/            # Business logic
├── database/
│   ├── migrations/          # Skema database
│   └── seeders/            # Data awal
├── resources/
│   └── views/              # Template Edge.js
├── public/                 # Asset statis
└── config/                # Konfigurasi aplikasi
```

### Penggunaan Dasar

#### 1. Login Admin
- Akses halaman login
- Gunakan kredensial admin default atau buat user baru

#### 2. Manajemen Siswa
- Tambah data siswa baru
- Upload foto untuk face recognition
- Assign ke kelas yang sesuai

#### 3. Setup Perangkat Fingerprint
- Konfigurasi IP address perangkat
- Test koneksi perangkat
- Sinkronisasi data siswa

#### 4. Monitoring Absensi
- Lihat dashboard real-time
- Generate laporan harian/bulanan
- Export data ke Excel



## 🤝 Kontribusi

Kami sangat menghargai kontribusi dari komunitas! Berikut cara berkontribusi:

1. **Fork** repository ini
2. **Buat branch** untuk fitur baru (`git checkout -b fitur-baru`)
3. **Commit** perubahan (`git commit -am 'Menambahkan fitur baru'`)
4. **Push** ke branch (`git push origin fitur-baru`)
5. **Submit Pull Request**

### Guidelines Kontribusi
- Ikuti coding style yang ada
- Tambahkan test untuk fitur baru
- Update dokumentasi jika diperlukan
- Gunakan commit message yang descriptive

## 🐛 Melaporkan Bug

Jika menemukan bug, silakan buat [issue baru](https://github.com/imtaqin/ABSENSI-SISWA-DIGITAL/issues) dengan informasi:
- Deskripsi bug yang jelas
- Langkah untuk mereproduksi
- Screenshot (jika ada)
- Environment details

## 📜 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file LICENSE untuk detail lengkap.

## 👨‍💻 Pengembang

**Taqin** - *Full Stack Developer*
- GitHub: [@imtaqin](https://github.com/fdciabdul)
- Email: taqin@example.com
- LinkedIn: [linkedin.com/in/fdciabdul](https://linkedin.com/in/fdciabdul)

## ⭐ Support Proyek

Jika proyek ini membantu Anda, berikan ⭐ di GitHub!

---

## 💝 Donasi

Dukungan Anda sangat berarti untuk pengembangan proyek ini! Setiap donasi akan digunakan untuk:
- Maintenance server demo
- Pengembangan fitur baru
- Improvement dokumentasi
- Dukungan komunitas

### 🎯 Cara Berdonasi

- **Bank BRI:** 227401035133504
- **Saweria:** `https://saweria.co/fdciabdul`




**Catatan:** Proyek ini adalah open-source dan gratis untuk digunakan. Donasi bersifat sukarela dan tidak ada kewajiban untuk berdonasi dalam menggunakan software ini.

---

<div align="center">

**[⬆ Kembali ke Atas](#absensi-siswa-digital)**

Made with ❤️ by **Taqin**

![GitHub stars](https://img.shields.io/github/stars/imtaqin/ABSENSI-SISWA-DIGITAL?style=social)
![GitHub forks](https://img.shields.io/github/forks/imtaqin/ABSENSI-SISWA-DIGITAL?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/imtaqin/ABSENSI-SISWA-DIGITAL?style=social)

</div>