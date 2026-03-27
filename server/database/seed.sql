USE xhswork;

-- 默认管理员（密码: admin）
INSERT INTO users (email, password, nickname, role) VALUES
('admin@xhswork.com', '$2b$10$.idQgjMr9Dj7CzXSGWhjXe2CJrhVe70LEuBLb4ubFmjF0dRCYWgGW', '管理员', 'admin');

-- 套餐数据（积分制）
-- type: trial=体验包, monthly=月付, yearly=年付, topup=积分充值
INSERT INTO packages (name, type, price, originalPrice, points, vipDays, features, badge, imageConcurrency, sortOrder, status) VALUES
-- 体验包（一次性，无VIP，0.15元/积分）
('体验包', 'trial', 9.9, 19.9, 66, 0,
 '["有效期 30 天", "标准生成速度", "支持 1 张图片并发", "可生成约 13 张图片 或 66 篇文案", "可创作约 2 篇完整图文", "限购1次"]',
 '', 1, 1, 1),
-- 月付套餐（含VIP）
('创作者版', 'monthly', 29.9, 49.9, 230, 30,
 '["权益有效期 30 天", "⚡ VIP 极速生成通道", "支持 2 张图片并发", "可生成约 46 张图片 或 230 篇文案", "可创作约 8-9 篇完整图文"]',
 '入门之选', 2, 2, 1),
('进阶版', 'monthly', 59.9, 99.9, 500, 30,
 '["权益有效期 30 天", "⚡ VIP 极速生成通道", "支持 3 张图片并发", "可生成约 100 张图片 或 500 篇文案", "可创作约 18-20 篇完整图文"]',
 '推荐', 3, 3, 1),
('专业版', 'monthly', 99.9, 169.9, 900, 30,
 '["权益有效期 30 天", "⚡ VIP 极速生成通道", "支持 5 张图片并发", "可生成约 180 张图片 或 900 篇文案", "可创作约 33-36 篇完整图文"]',
 '', 5, 4, 1),
-- 年付套餐（含VIP，月付6折）
('创作者版', 'yearly', 215, 358.8, 2760, 365,
 '["权益有效期 365 天", "⚡ VIP 极速生成通道", "支持 2 张图片并发", "可生成约 552 张图片 或 2760 篇文案", "可创作约 100-110 篇完整图文", "年付享6折"]',
 '6折', 2, 5, 1),
('进阶版', 'yearly', 431, 718.8, 6000, 365,
 '["权益有效期 365 天", "⚡ VIP 极速生成通道", "支持 3 张图片并发", "可生成约 1200 张图片 或 6000 篇文案", "可创作约 220-240 篇完整图文", "年付享6折"]',
 '6折', 3, 6, 1),
('专业版', 'yearly', 719, 1198.8, 10800, 365,
 '["权益有效期 365 天", "⚡ VIP 极速生成通道", "支持 5 张图片并发", "可生成约 2160 张图片 或 10800 篇文案", "可创作约 400-430 篇完整图文", "年付享6折"]',
 '6折', 5, 7, 1),
-- 积分充值包（无VIP，0.13元/积分）
('30积分', 'topup', 3.9, 0, 30, 0, '["即时到账", "可生成约 6 张图片 或 30 篇文案"]', '', 1, 10, 1),
('100积分', 'topup', 12.9, 15, 100, 0, '["即时到账", "可生成约 20 张图片 或 100 篇文案"]', '', 1, 11, 1),
('300积分', 'topup', 35.9, 45, 300, 0, '["即时到账", "可生成约 60 张图片 或 300 篇文案"]', '热门', 1, 12, 1),
('500积分', 'topup', 54.9, 75, 500, 0, '["即时到账", "可生成约 100 张图片 或 500 篇文案"]', '', 1, 13, 1);

-- 系统配置初始数据
INSERT INTO system_configs (configKey, configValue, description) VALUES
('points_per_publish', '1', '一键发布消耗积分'),
('pay_wechat_enabled', '0', '微信支付开关 0:关闭 1:开启'),
('pay_wechat_appid', '', '微信支付 AppID'),
('pay_wechat_mchid', '', '微信支付商户号'),
('pay_wechat_api_key', '', '微信支付 API 密钥'),
('pay_wechat_notify_url', '', '微信支付回调地址'),
('pay_alipay_enabled', '0', '支付宝开关 0:关闭 1:开启'),
('pay_alipay_appid', '', '支付宝 AppID'),
('pay_alipay_private_key', '', '支付宝应用私钥'),
('pay_alipay_public_key', '', '支付宝公钥'),
('pay_alipay_notify_url', '', '支付宝回调地址'),
('invite_reward_points', '100', '邀请人奖励积分'),
('invitee_reward_points', '50', '被邀请人奖励积分'),
('invite_reward_mode', 'paid', '邀请奖励模式：register=注册即奖励 paid=充值后奖励'),
('invite_recharge_bonus_rate', '10', '好友充值赠送比例（百分比）'),
('invite_recharge_bonus_mode', 'first', '充值奖励次数：first=仅首次 every=每次充值'),
('qr_wechat', '', '微信公众号二维码图片URL'),
('qr_contact', '', '客服微信二维码图片URL'),
('smtp_host', 'smtp.163.com', 'SMTP 服务器地址'),
('smtp_port', '465', 'SMTP 端口'),
('smtp_user', '', 'SMTP 邮箱账号'),
('smtp_pass', '', 'SMTP 邮箱授权码'),
('smtp_from_name', '小红书AI创作助手', '发件人名称'),
('output_clean_days', '7', '生成图片自动清理天数（0=不清理）');

-- 默认 AI 模型
INSERT INTO ai_models (name, type, tier, baseUrl, apiKey, model, pointsCost) VALUES
('豆包文本-通用', 'text', 'all', 'https://ark.cn-beijing.volces.com/api/v3', '', 'doubao-seed-2-0-lite-260215', 10),
('豆包图片-通用', 'image', 'all', 'https://ark.cn-beijing.volces.com/api/v3', '', 'doubao-seedream-5-0-260128', 10);


-- 预设违禁词
INSERT INTO sensitive_words (word, category, replacements) VALUES
-- 极限用语
('最好', 'extreme', '["很好","非常好","超赞"]'),
('最佳', 'extreme', '["优质","出色","推荐"]'),
('第一', 'extreme', '["领先","前列","优选"]'),
('最强', 'extreme', '["超强","强力","高效"]'),
('最低价', 'extreme', '["超值价","优惠价","特惠"]'),
('绝对', 'extreme', '["非常","相当","十分"]'),
('100%', 'extreme', '["高概率","大部分","绝大多数"]'),
('永远', 'extreme', '["持久","长效","长期"]'),
('万能', 'extreme', '["多功能","多用途","全能型"]'),
('史上最', 'extreme', '["超级","非常","极其"]'),
-- 医疗用语
('治疗', 'medical', '["改善","调理","呵护"]'),
('药效', 'medical', '["效果","作用","功效"]'),
('根治', 'medical', '["改善","缓解","调理"]'),
('疗效', 'medical', '["效果","体验","感受"]'),
('处方', 'medical', '["方案","搭配","组合"]'),
('治愈', 'medical', '["改善","好转","恢复"]'),
('药物', 'medical', '["产品","成分","配方"]'),
-- 化妆品禁用语
('美白', 'cosmetic', '["提亮","焕亮","匀净"]'),
('祛斑', 'cosmetic', '["淡化","匀净","提亮"]'),
('抗衰老', 'cosmetic', '["抗初老","紧致","焕活"]'),
('除皱', 'cosmetic', '["淡纹","平滑","紧致"]'),
('脱毛', 'cosmetic', '["净毛","柔滑","光滑"]'),
('祛痘', 'cosmetic', '["净痘","控痘","舒缓"]'),
-- 金融用语
('保本', 'finance', '["稳健","低风险","安心"]'),
('稳赚', 'finance', '["收益可期","潜力","机会"]'),
('零风险', 'finance', '["低风险","风险可控","稳健"]'),
('暴利', 'finance', '["高收益","回报丰厚","潜力大"]'),
-- 法律风险词
('假货', 'legal', '["仿品","平替","类似款"]'),
('山寨', 'legal', '["平替","国产替代","同款"]'),
('正品保证', 'legal', '["品质保障","质量可靠","放心购"]'),
('官方授权', 'legal', '["正规渠道","品牌合作","授权经销"]');
