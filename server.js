// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' })); // 支持 JSON 请求体
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(PUBLIC_DIR, 'data.json');

// 静态托管 public 下的前端文件
app.use(express.static(PUBLIC_DIR));

// GET /data.json -> 返回 data.json
app.get('/data.json', async (req, res) => {
  try {
    const text = await fs.readFile(DATA_FILE, 'utf8');
    res.type('application/json').send(text);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // 文件不存在时初始化为空数组
      await fs.writeFile(DATA_FILE, '[]', 'utf8');
      return res.json([]);
    }
    console.error('读取 data.json 失败:', err);
    res.status(500).json({ error: '读取数据失败' });
  }
});

// POST /data.json -> 覆盖写入 data.json
app.post('/data.json', async (req, res) => {
  try {
    const newData = req.body;
    if (!Array.isArray(newData)) {
      return res.status(400).json({ error: '期望数组格式的数据' });
    }

    // 先备份旧文件
    try {
      await fs.copyFile(DATA_FILE, DATA_FILE + '.bak');
    } catch (copyErr) {
      // 没有旧文件时忽略
    }

    await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (err) {
    console.error('保存 data.json 失败:', err);
    res.status(500).json({ error: '保存失败' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}/`);
});