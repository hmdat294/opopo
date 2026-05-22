export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const JSONBIN_BIN_ID = '6a0fd8eaee5a733b12fd2029';
  const JSONBIN_KEY = '$2a$10$UYIF4qD14K7VjKd.t7YRduvRNGS2JVp4OHtjxfTJi8Un9/o3cn7wO';
  const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

  try {
    if (req.method === 'GET') {
      // Fetch dữ liệu từ JSONBin
      const response = await fetch(JSONBIN_URL, {
        method: 'GET',
        headers: {
          'X-Master-Key': JSONBIN_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`JSONBin error: ${response.status}`);
      }

      const data = await response.json();
      const aluminumTypes = data.record?.aluminumTypes || [];
      
      res.status(200).json(aluminumTypes);
    } else if (req.method === 'PUT') {
      // Update dữ liệu vào JSONBin
      const { aluminumTypes } = req.body;

      if (!Array.isArray(aluminumTypes)) {
        res.status(400).json({ error: 'Invalid data format' });
        return;
      }

      const response = await fetch(JSONBIN_URL, {
        method: 'PUT',
        headers: {
          'X-Master-Key': JSONBIN_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ aluminumTypes })
      });

      if (!response.ok) {
        throw new Error(`JSONBin error: ${response.status}`);
      }

      const data = await response.json();
      res.status(200).json({ aluminumTypes });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
