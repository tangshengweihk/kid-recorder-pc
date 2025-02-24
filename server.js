import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { saveUser, getAllFaceData, updateLoginInfo, getUserStats, isUserExists } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());
// 添加静态文件服务
app.use(express.static('.'));

// 代理路由
app.use('/proxy', async (req, res) => {
    try {
        const targetUrl = `http://localhost:3000${req.url}`;
        console.log('代理请求到:', targetUrl);
        
        const response = await fetch(targetUrl);
        const text = await response.text();
        
        // 设置与原始响应相同的状态码
        res.status(response.status);
        
        // 设置响应头
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        
        // 发送响应
        res.send(text);
    } catch (error) {
        console.error('代理请求失败:', error);
        res.status(500).json({ error: '代理请求失败' });
    }
});

// 代理路由
app.use('/proxy/api/devices/quick', async (req, res) => {
    try {
        const targetUrl = `http://localhost:3000/api/devices/quick${req.url.includes('?') ? req.url : ''}`;
        console.log('代理请求到:', targetUrl);
        
        const response = await fetch(targetUrl);
        const text = await response.text();
        
        // 设置与原始响应相同的状态码
        res.status(response.status);
        
        // 设置响应头
        res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
        
        // 发送响应
        res.send(text);
    } catch (error) {
        console.error('代理请求失败:', error);
        res.status(500).json({ error: '代理请求失败' });
    }
});

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

// 设备快速登记
app.get('/api/devices/quick', async (req, res) => {
    try {
        const { device_name, serial_number, user_name } = req.query;
        
        if (!device_name || !serial_number || !user_name) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        // 这里可以添加设备登记的业务逻辑
        // 例如：保存到数据库、更新设备状态等
        
        // 返回成功消息
        res.json({
            message: '设备登记成功',
            data: {
                device_name,
                serial_number,
                user_name,
                register_time: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('设备登记失败:', error);
        res.status(500).json({ error: '设备登记失败' });
    }
});

const PORT = 3100;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('人脸识别系统已启动，可以开始使用了');
}); 