const express = require('express');
const cors = require('cors');
const { saveUser, getAllFaceData, updateLoginInfo, getUserStats, isUserExists } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
// 添加静态文件服务
app.use(express.static('.'));

// 检查用户名是否存在
app.get('/api/users/check/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const exists = await isUserExists(username);
        res.json({ exists });
    } catch (error) {
        console.error('检查用户名失败:', error);
        res.status(500).json({ error: '检查用户名失败' });
    }
});

// 保存用户数据
app.post('/api/users', async (req, res) => {
    try {
        const { username, faceDescriptor } = req.body;
        
        // 检查用户名是否已存在
        const exists = await isUserExists(username);
        if (exists) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        await saveUser(username, faceDescriptor);
        res.json({ success: true });
    } catch (error) {
        console.error('保存用户失败:', error);
        res.status(500).json({ error: error.message || '保存用户失败' });
    }
});

// 获取所有人脸数据
app.get('/api/faces', async (req, res) => {
    try {
        const faceData = await getAllFaceData();
        res.json(faceData);
    } catch (error) {
        console.error('获取人脸数据失败:', error);
        res.status(500).json({ error: '获取人脸数据失败' });
    }
});

// 更新登录信息
app.post('/api/login', async (req, res) => {
    try {
        const { username } = req.body;
        const loginInfo = await updateLoginInfo(username);
        res.json(loginInfo);
    } catch (error) {
        console.error('更新登录信息失败:', error);
        res.status(500).json({ error: '更新登录信息失败' });
    }
});

// 获取用户统计信息
app.get('/api/users/:username/stats', async (req, res) => {
    try {
        const { username } = req.params;
        const stats = await getUserStats(username);
        if (stats) {
            res.json(stats);
        } else {
            res.status(404).json({ error: '用户不存在' });
        }
    } catch (error) {
        console.error('获取用户统计信息失败:', error);
        res.status(500).json({ error: '获取用户统计信息失败' });
    }
});

const PORT = 3100;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('人脸识别系统已启动，可以开始使用了');
}); 