import { join } from 'path'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 数据库文件路径
const dbFile = join(__dirname, 'face_db.json')

// 确保数据库文件存在
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ users: [] }))
}

// 创建数据库适配器
const adapter = new JSONFile(dbFile)
const db = new Low(adapter)

// 初始化数据库
async function initDB() {
    await db.read()
    if (!db.data) {
        db.data = { users: [] }
        await db.write()
    }
    console.log(`数据库已初始化，当前有 ${db.data.users.length} 个用户`)
}

// 检查用户名是否已存在
async function isUserExists(username) {
    await db.read()
    if (!db.data) {
        return false
    }
    return db.data.users.some(user => user.username === username)
}

// 添加新用户
async function saveUser(username, faceDescriptor) {
    await db.read()
    if (!db.data) {
        db.data = { users: [] }
    }
    
    // 检查用户名是否已存在
    if (await isUserExists(username)) {
        throw new Error('用户名已存在')
    }
    
    // 添加新用户
    db.data.users.push({
        username,
        faceDescriptor,
        registerTime: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        loginCount: 0
    })
    console.log(`新用户注册: ${username}`)
    
    await db.write()
}

// 获取所有用户的人脸数据
async function getAllFaceData() {
    await db.read()
    if (!db.data) {
        return {}
    }
    const faceData = db.data.users.reduce((acc, user) => {
        acc[user.username] = user.faceDescriptor
        return acc
    }, {})
    console.log(`加载了 ${Object.keys(faceData).length} 个用户的人脸数据`)
    return faceData
}

// 更新用户登录信息
async function updateLoginInfo(username) {
    await db.read()
    if (!db.data) {
        return null
    }
    const user = db.data.users.find(user => user.username === username)
    if (user) {
        user.lastLogin = new Date().toISOString()
        user.loginCount = (user.loginCount || 0) + 1
        await db.write()
        console.log(`用户 ${username} 登录成功，这是第 ${user.loginCount} 次登录`)
        return {
            loginCount: user.loginCount,
            lastLogin: user.lastLogin
        }
    }
    return null
}

// 获取用户统计信息
async function getUserStats(username) {
    await db.read()
    if (!db.data) {
        return null
    }
    const user = db.data.users.find(user => user.username === username)
    if (user) {
        return {
            loginCount: user.loginCount || 0,
            registerTime: user.registerTime,
            lastLogin: user.lastLogin
        }
    }
    return null
}

// 初始化数据库
initDB().catch(err => {
    console.error('数据库初始化失败:', err)
    process.exit(1)
})

export {
    saveUser,
    getAllFaceData,
    updateLoginInfo,
    getUserStats,
    isUserExists
} 