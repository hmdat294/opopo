import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'db.json');

function readDb() {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading db.json:', error);
    return { aluminumTypes: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing db.json:', error);
    return false;
  }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const db = readDb();
  const { id } = req.query;

  if (req.method === 'GET') {
    // GET /api/aluminumTypes - trả về danh sách
    // GET /api/aluminumTypes?id=xxx - trả về chi tiết
    if (id) {
      const item = db.aluminumTypes.find(a => a.id === id);
      if (item) {
        res.status(200).json(item);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } else {
      res.status(200).json(db.aluminumTypes);
    }
  } else if (req.method === 'POST') {
    // POST /api/aluminumTypes - thêm mới
    const newItem = {
      id: `alum_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      ...req.body
    };
    db.aluminumTypes.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } else if (req.method === 'PUT') {
    // PUT /api/aluminumTypes?id=xxx - cập nhật
    const index = db.aluminumTypes.findIndex(a => a.id === id);
    if (index !== -1) {
      db.aluminumTypes[index] = { ...db.aluminumTypes[index], ...req.body };
      writeDb(db);
      res.status(200).json(db.aluminumTypes[index]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else if (req.method === 'DELETE') {
    // DELETE /api/aluminumTypes?id=xxx - xóa
    const index = db.aluminumTypes.findIndex(a => a.id === id);
    if (index !== -1) {
      const deleted = db.aluminumTypes.splice(index, 1);
      writeDb(db);
      res.status(200).json(deleted[0]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
