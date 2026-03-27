const nodemailer = require('nodemailer')
const configRepository = require('../repositories/configRepository')

let cachedTransporter = null
let cachedConfig = null

async function getSmtpConfig() {
  const keys = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_name']
  const configs = {}
  for (const key of keys) {
    const row = await configRepository.findByKey(key)
    configs[key] = row?.configValue || ''
  }
  return configs
}

async function getTransporter() {
  const config = await getSmtpConfig()
  const configKey = `${config.smtp_host}:${config.smtp_port}:${config.smtp_user}`
  if (cachedTransporter && cachedConfig === configKey) return { transporter: cachedTransporter, config }
  cachedTransporter = nodemailer.createTransport({
    host: config.smtp_host || 'smtp.qq.com',
    port: Number(config.smtp_port) || 465,
    secure: true,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
  })
  cachedConfig = configKey
  return { transporter: cachedTransporter, config }
}

async function sendVerifyCode(to, code) {
  const { transporter, config } = await getTransporter()
  const fromName = config.smtp_from_name || '小红书AI创作助手'
  await transporter.sendMail({
    from: `"${fromName}" <${config.smtp_user}>`,
    to,
    subject: '登录验证码',
    html: `
      <div style="max-width:400px;margin:0 auto;padding:32px;font-family:sans-serif;">
        <h2 style="color:#ff4757;margin:0 0 16px;">${fromName}</h2>
        <p style="color:#333;font-size:14px;">您的验证码是：</p>
        <p style="font-size:32px;font-weight:bold;color:#ff4757;letter-spacing:6px;margin:16px 0;">${code}</p>
        <p style="color:#999;font-size:12px;">验证码 5 分钟内有效，请勿泄露给他人。</p>
      </div>
    `,
  })
}

module.exports = { sendVerifyCode }
