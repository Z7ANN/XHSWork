CREATE DATABASE IF NOT EXISTS xhswork DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xhswork;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(200) DEFAULT '' COMMENT '密码（bcrypt加密）',
  nickname VARCHAR(50) DEFAULT '',
  avatar VARCHAR(500) DEFAULT '',
  points INT DEFAULT 0 COMMENT '积分余额',
  vipExpireAt DATETIME DEFAULT NULL COMMENT 'VIP到期时间',
  inviteCode VARCHAR(20) DEFAULT '' COMMENT '邀请码（唯一）',
  invitedBy INT DEFAULT NULL COMMENT '邀请人ID',
  status TINYINT DEFAULT 1 COMMENT '0:禁用 1:正常',
  role VARCHAR(20) DEFAULT 'user' COMMENT 'user:用户 admin:管理员',
  lastLoginAt DATETIME DEFAULT NULL COMMENT '上次登录时间',
  registerIp VARCHAR(64) DEFAULT '' COMMENT '注册IP',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_invite_code (inviteCode)
) ENGINE=InnoDB;

-- 套餐表（积分制）
CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'trial:体验包 monthly:月付 yearly:年付 topup:积分充值',
  price DECIMAL(10,2) DEFAULT 0,
  originalPrice DECIMAL(10,2) DEFAULT 0 COMMENT '原价（划线价）',
  points INT DEFAULT 0 COMMENT '赠送积分',
  vipDays INT DEFAULT 0 COMMENT 'VIP天数（0=无VIP）',
  features JSON COMMENT '权益描述列表',
  badge VARCHAR(20) DEFAULT '' COMMENT '角标文字（如：新年促销）',
  imageConcurrency INT DEFAULT 1 COMMENT '图片并发生成数',
  sortOrder INT DEFAULT 0 COMMENT '排序（越小越前）',
  status TINYINT DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderNo VARCHAR(64) NOT NULL UNIQUE COMMENT '订单号',
  userId INT NOT NULL,
  packageId INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
  pointsGranted INT DEFAULT 0 COMMENT '到账积分',
  vipDaysGranted INT DEFAULT 0 COMMENT '到账VIP天数',
  payMethod VARCHAR(20) DEFAULT '' COMMENT 'wechat/alipay',
  payTradeNo VARCHAR(128) DEFAULT '' COMMENT '第三方支付流水号',
  qrCodeUrl VARCHAR(500) DEFAULT '' COMMENT '支付二维码链接',
  status TINYINT DEFAULT 0 COMMENT '0:待支付 1:已支付 2:已取消 3:已退款',
  paidAt DATETIME DEFAULT NULL,
  expireAt DATETIME NOT NULL COMMENT '订单过期时间',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (packageId) REFERENCES packages(id),
  INDEX idx_userId (userId),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- 生成记录表
CREATE TABLE IF NOT EXISTS generations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type VARCHAR(20) NOT NULL COMMENT 'oneclick/editor/cover',
  title VARCHAR(200) DEFAULT '',
  content MEDIUMTEXT,
  images JSON COMMENT '图片URL列表',
  tags JSON COMMENT '标签列表',
  topic VARCHAR(500) DEFAULT '' COMMENT '创作主题',
  category VARCHAR(50) DEFAULT '' COMMENT '分类',
  pointsCost INT DEFAULT 0 COMMENT '消耗积分',
  model VARCHAR(200) DEFAULT '' COMMENT '使用的模型标识',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_type (type),
  FOREIGN KEY (userId) REFERENCES users(id)
) ENGINE=InnoDB;

-- 积分记录表
CREATE TABLE IF NOT EXISTS point_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  amount INT NOT NULL COMMENT '积分变动（正数增加，负数扣减）',
  type VARCHAR(30) NOT NULL COMMENT 'purchase/invite_reward/register_gift/consume/admin_adjust',
  remark VARCHAR(200) DEFAULT '',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_type (type),
  FOREIGN KEY (userId) REFERENCES users(id)
) ENGINE=InnoDB;

-- 草稿表
CREATE TABLE IF NOT EXISTS drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(200) DEFAULT '',
  content MEDIUMTEXT,
  coverUrl VARCHAR(500) DEFAULT '',
  status TINYINT DEFAULT 1 COMMENT '0:已删除 1:正常',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
) ENGINE=InnoDB;

-- 封面模板表
CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT '',
  thumbnail VARCHAR(500) DEFAULT '',
  config JSON COMMENT '模板配置',
  status TINYINT DEFAULT 1 COMMENT '0:下架 1:上架',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 热门话题表
CREATE TABLE IF NOT EXISTS hot_topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keyword VARCHAR(100) NOT NULL,
  heat INT DEFAULT 0,
  category VARCHAR(50) DEFAULT '',
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 验证码表
CREATE TABLE IF NOT EXISTS verify_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expireAt DATETIME NOT NULL,
  used TINYINT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_code (email, code),
  INDEX idx_expire (expireAt)
) ENGINE=InnoDB;

-- 敏感词表
CREATE TABLE IF NOT EXISTS sensitive_words (
  id INT AUTO_INCREMENT PRIMARY KEY,
  word VARCHAR(100) NOT NULL COMMENT '违禁词',
  category VARCHAR(30) DEFAULT 'other' COMMENT 'extreme:极限用语 medical:医疗用语 cosmetic:化妆品禁用语 finance:金融用语 legal:法律风险词 vulgar:低俗用语 other:其他',
  replacements JSON COMMENT '替换词列表',
  status TINYINT DEFAULT 1 COMMENT '0:禁用 1:启用',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  configKey VARCHAR(100) NOT NULL UNIQUE,
  configValue TEXT,
  description VARCHAR(200) DEFAULT '',
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- AI 模型表
CREATE TABLE IF NOT EXISTS ai_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '模型名称（显示用）',
  icon VARCHAR(200) DEFAULT '' COMMENT '模型图标文件名',
  type VARCHAR(20) NOT NULL COMMENT 'text:文本模型 image:图片模型',
  tier VARCHAR(20) DEFAULT 'all' COMMENT 'all:不限 trial:体验包 monthly:月付 yearly:年付',
  baseUrl VARCHAR(500) NOT NULL COMMENT 'API 地址',
  apiKey VARCHAR(500) NOT NULL COMMENT 'API Key',
  model VARCHAR(200) NOT NULL COMMENT '模型标识',
  pointsCost INT DEFAULT 10 COMMENT '每次调用消耗积分',
  supportThinking TINYINT DEFAULT 0 COMMENT '0:不支持深度思考 1:支持深度思考',
  thinkingPointsCost INT DEFAULT 0 COMMENT '开启深度思考额外消耗积分',
  status TINYINT DEFAULT 1 COMMENT '0:禁用 1:启用',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 兑换码表
CREATE TABLE IF NOT EXISTS redeem_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '兑换码',
  packageId INT DEFAULT NULL COMMENT '关联套餐ID（为空则自定义积分）',
  points INT DEFAULT 0 COMMENT '自定义积分数量',
  vipDays INT DEFAULT 0 COMMENT '自定义VIP天数',
  remark VARCHAR(200) DEFAULT '' COMMENT '备注',
  usedBy INT DEFAULT NULL COMMENT '使用者ID',
  usedAt DATETIME DEFAULT NULL COMMENT '使用时间',
  expireAt DATETIME DEFAULT NULL COMMENT '过期时间',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (packageId) REFERENCES packages(id),
  FOREIGN KEY (usedBy) REFERENCES users(id)
) ENGINE=InnoDB;
