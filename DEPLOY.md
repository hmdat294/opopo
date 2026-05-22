# OPOPO - Aluminum Optimization System

Ứng dụng quản lý và tối ưu hóa tiêu thụ nhôm.

## Kiến trúc

- **Frontend:** HTML/CSS/JavaScript (static files)
- **Backend Storage:** JSONBin (cloud JSON storage)
- **Deployment:** Vercel (hosting static files)

## Deploy lên Vercel

### 1. Chuẩn bị
- Tài khoản GitHub
- Tài khoản Vercel (kết nối với GitHub)
- Bin JSONBin (đã tạo sẵn)

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

### 3. Cấu hình JSONBin

Dữ liệu được lưu trên JSONBin:
- **Bin ID:** `6a0fd8eaee5a733b12fd2029`
- **Master Key:** Đã được set trong `js/services/aluminumService.js`

⚠️ **Lưu ý bảo mật:** API key được embed trong code frontend (không tránh được với frontend apps). Để bảo mật, bạn có thể:
1. Tạo Bin riêng cho production
2. Sử dụng backend proxy server
3. Sử dụng database thay thế (MongoDB, Supabase, Firebase)

### 4. Cách hoạt động

**Local (development):**
```bash
# Mở index.html trong browser (hoặc dùng Live Server)
# App sẽ fetch/update dữ liệu từ JSONBin trực tiếp
```

**Production (Vercel):**
- Static files được serve từ Vercel CDN
- Tất cả API requests đi trực tiếp đến JSONBin từ browser
- Dữ liệu được lưu vĩnh viễn trên JSONBin

### 5. API Endpoints (JSONBin)

```
GET https://api.jsonbin.io/v3/b/6a0fd8eaee5a733b12fd2029
Header: X-Master-Key: {KEY}
Response: { record: { aluminumTypes: [...] }, metadata: {...} }

PUT https://api.jsonbin.io/v3/b/6a0fd8eaee5a733b12fd2029
Header: X-Master-Key: {KEY}
Body: { aluminumTypes: [...] }
```

### 6. Cấu trúc dữ liệu

```json
{
  "aluminumTypes": [
    {
      "id": "alum_1",
      "name": "vách C3209",
      "code": "C3209",
      "weightPerMeter": 802,
      "profileCount": 1
    }
  ]
}
```

### 7. Backup & Restore

- **Backup:** Tải file từ JSONBin dashboard
- **Restore:** Upload file JSON vào JSONBin

---

**Demo URL:** `your-project.vercel.app`

**JSONBin Dashboard:** https://jsonbin.io/
