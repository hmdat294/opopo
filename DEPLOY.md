# OPOPO - Aluminum Optimization System

Ứng dụng quản lý và tối ưu hóa tiêu thụ nhôm.

## Kiến trúc

- **Frontend:** HTML/CSS/JavaScript (static files)
- **Backend Proxy:** Vercel Serverless Functions (`/api/aluminumTypes`)
- **Data Storage:** JSONBin (cloud JSON storage)
- **Deployment:** Vercel

## Tại sao cần serverless function?

JSONBin bị **CORS block** khi gọi từ frontend trực tiếp trên production. Serverless function làm **proxy** để:
- Gọi JSONBin từ phía server (backend) → không bị CORS
- Frontend chỉ gọi API của chính mình (`/api/aluminumTypes`)
- API key JSONBin được bảo vệ trên backend

## Deploy lên Vercel

### 1. Chuẩn bị
- Tài khoản GitHub
- Tài khoản Vercel (kết nối với GitHub)

### 2. Deploy

**Cách 1: Import từ GitHub (Đơn giản nhất)**
1. Push code lên GitHub repository
   ```bash
   git add .
   git commit -m "Fix JSONBin proxy"
   git push
   ```
2. Vào https://vercel.com/new
3. Chọn repository của bạn
4. Click "Deploy"

**Cách 2: Dùng Vercel CLI**
```bash
npm install -g vercel
vercel
```

### 3. Cách hoạt động

**Flow:**
```
Browser (Frontend)
    ↓
/api/aluminumTypes (Vercel Serverless Function)
    ↓
JSONBin API (Backend)
    ↓
/api/aluminumTypes (trả về data)
    ↓
Browser (display)
```

**Local Development:**
```bash
# Mở index.html trong browser
# App gọi /api/aluminumTypes
# API function gọi JSONBin
# CORS không bị chặn vì request từ backend
```

**Production (Vercel):**
- Static files được serve từ Vercel CDN
- Serverless functions xử lý requests
- JSONBin backend lưu trữ dữ liệu

### 4. API Endpoints

**GET** `/api/aluminumTypes`
```bash
curl https://your-project.vercel.app/api/aluminumTypes
Response: [{ id: "alum_1", name: "...", code: "C3209", ... }]
```

**PUT** `/api/aluminumTypes` (Update toàn bộ)
```bash
curl -X PUT https://your-project.vercel.app/api/aluminumTypes \
  -H "Content-Type: application/json" \
  -d '{ "aluminumTypes": [...] }'
```

### 5. Cấu trúc project

```
/
├── index.html          # Frontend chính
├── aluminum.html       # Quản lý nhôm
├── js/
│   ├── services/
│   │   ├── aluminumService.js   # Gọi /api/aluminumTypes
│   │   └── optimizationService.js
│   └── ui/
│       └── render.js
├── api/
│   └── aluminumTypes.js         # Serverless proxy function
├── vercel.json         # Config functions
└── package.json
```

### 6. JSONBin Configuration

- **Bin ID:** `6a0fd8eaee5a733b12fd2029`
- **Master Key:** Lưu trữ an toàn trong serverless function

⚠️ **API key không expose** vì được sử dụng từ backend, không frontend

### 7. Troubleshooting

**Issue: "Cannot POST /api/aluminumTypes"**
- Kiểm tra `vercel.json` có `functions` config
- Đảm bảo `api/aluminumTypes.js` tồn tại

**Issue: JSONBin 401 Unauthorized**
- Kiểm tra API key trong `api/aluminumTypes.js`
- Kiểm tra Bin ID đúng

**Issue: "Bin not found"**
- Vercel function chạy OK nhưng JSONBin trả lỗi
- Kiểm tra https://jsonbin.io dashboard

---

**Demo:** https://your-project.vercel.app
