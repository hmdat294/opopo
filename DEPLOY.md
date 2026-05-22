# OPOPO - Aluminum Optimization System

Ứng dụng quản lý và tối ưu hóa tiêu thụ nhôm.

## Deploy lên Vercel

### 1. Chuẩn bị
- Tài khoản GitHub
- Tài khoản Vercel (kết nối với GitHub)

### 2. Deploy

**Cách 1: Import từ GitHub (Đơn giản nhất)**
1. Push code lên GitHub repository
2. Vào https://vercel.com/new
3. Chọn repository của bạn
4. Vercel sẽ tự động detect cấu hình
5. Click "Deploy"

**Cách 2: Dùng Vercel CLI**
```bash
npm install -g vercel
vercel
```

### 3. Cấu hình

Project này đã có sẵn:
- ✅ `package.json` - Dependencies
- ✅ `vercel.json` - Vercel config
- ✅ `api/aluminumTypes.js` - Serverless function
- ✅ Static files (.html, .css, .js)

### 4. Cách hoạt động

**Local (development):**
```bash
npm install
npm run dev  # Khởi động json-server trên port 3000
```
Mở http://localhost:5500 (dùng Live Server extension)

**Production (Vercel):**
- Static files được serve từ Vercel CDN
- API requests được xử lý bởi serverless function `/api/aluminumTypes`
- Dữ liệu lưu trong `db.json`

### 5. Ghi chú quan trọng

⚠️ **Vercel có giới hạn về file system:**
- Serverless functions không thể ghi file vào disk
- Dữ liệu sẽ được lưu nhưng sẽ reset khi deploy lại
- Để lưu dữ liệu vĩnh viễn, cần dùng database (MongoDB, PostgreSQL, etc.)

### 6. Upgrade sang database (Optional)

Để lưu dữ liệu vĩnh viễn trên production:
1. Dùng MongoDB Atlas (free tier có sẵn)
2. Hoặc Supabase, Firebase
3. Cập nhật `api/aluminumTypes.js` để query database thay vì file

---

**Domains:**
- Demo: `your-project.vercel.app`
- Custom domain có thể được thêm trong Vercel Dashboard
