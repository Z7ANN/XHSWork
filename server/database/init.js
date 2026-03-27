require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

const DB_NAME = process.env.DB_NAME || 'xhswork'

async function init() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    multipleStatements: true,
  })

  console.log(`正在删除数据库 ${DB_NAME}...`)
  await conn.query(`DROP DATABASE IF EXISTS ${DB_NAME}`)

  console.log('正在创建表结构...')
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
  await conn.query(schema)

  console.log('正在导入种子数据...')
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8')
  await conn.query(seed)

  console.log('数据库初始化完成 ✓')
  await conn.end()
}

init().catch((err) => {
  console.error('初始化失败:', err.message)
  process.exit(1)
})
