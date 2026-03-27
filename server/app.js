require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env.development', override: true })
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3200

// 中间件
const allowedOrigins = [
  'http://localhost:3100',
  'http://localhost:3000',
  'http://localhost:3300',
  'https://xhswork.com',
  'https://www.xhswork.com',
]
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '10mb' }))

// 静态文件
app.use('/api/images', express.static(path.join(__dirname, 'output')))
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')))

const { auth, adminOnly } = require('./middlewares/auth')

// 支付回调（不需要auth）
app.use('/api/pay', require('./routes/web/pay'))

// 用户端路由
app.use('/api/auth', require('./routes/web/auth'))
app.use('/api/user', auth, require('./routes/web/user'))
app.use('/api/packages', require('./routes/web/package'))
app.use('/api/orders', auth, require('./routes/web/order'))
app.use('/api/redeem', auth, require('./routes/web/redeem'))
app.use('/api/editor', auth, require('./routes/web/editor'))
app.use('/api/cover', auth, require('./routes/web/cover'))
app.use('/api/viral', auth, require('./routes/web/viral'))

// 管理端路由
app.use('/api/admin', auth, adminOnly)
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'))
app.use('/api/admin/users', require('./routes/admin/user'))
app.use('/api/admin/packages', require('./routes/admin/package'))
app.use('/api/admin/configs', require('./routes/admin/config'))
app.use('/api/admin/orders', require('./routes/admin/order'))
app.use('/api/admin/redeems', require('./routes/admin/redeem'))
app.use('/api/admin/generations', require('./routes/admin/generation'))
app.use('/api/admin/ai-models', require('./routes/admin/aiModel'))
app.use('/api/admin/sensitive-words', require('./routes/admin/sensitiveWord'))
app.use('/api/admin/point-logs', require('./routes/admin/pointLog'))

// 健康检查
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// 定时清理 output 目录（每小时执行，清理天数从系统配置读取）
const fs = require('fs')
const pathModule = require('path')
const outputDir = pathModule.join(__dirname, 'output')
const configRepository = require('./repositories/configRepository')
setInterval(async () => {
  if (!fs.existsSync(outputDir)) return
  try {
    const config = await configRepository.findByKey('output_clean_days')
    const days = parseInt(config?.configValue) || 0
    if (days <= 0) return
    const now = Date.now()
    const maxAge = days * 24 * 60 * 60 * 1000
    for (const dir of fs.readdirSync(outputDir)) {
      const dirPath = pathModule.join(outputDir, dir)
      const stat = fs.statSync(dirPath)
      if (stat.isDirectory() && now - stat.mtimeMs > maxAge) {
        fs.rmSync(dirPath, { recursive: true, force: true })
      }
    }
  } catch (err) {
    console.error('[清理output]', err.message)
  }
}, 60 * 60 * 1000)

// 全局错误处理
const errorHandler = require('./middlewares/errorHandler')
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
