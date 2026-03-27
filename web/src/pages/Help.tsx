import { useState } from 'react'
import { ChevronDown, Rocket, Sparkles, Coins, Shield, HelpCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface HelpItem { q: string; a: string }
interface HelpCategory { key: string; label: string; icon: React.ReactNode; items: HelpItem[] }

const categories: HelpCategory[] = [
  {
    key: 'start', label: '快速入门', icon: <Rocket className="w-4 h-4" />,
    items: [
      { q: '如何注册和登录？', a: '支持两种方式：\n1. 邮箱验证码登录：输入邮箱，点击发送验证码，输入收到的6位验证码即可登录（新邮箱自动注册）\n2. 密码登录：注册后可在个人中心设置密码，之后用邮箱+密码登录' },
      { q: '工作台有哪些功能？', a: '登录后进入工作台，左侧导航栏包含：\n• 一键图文 — 输入主题自动生成完整图文\n• 笔记生成 — AI 生成标题、正文、标签\n• 图片生成 — 文生图/图生图生成封面\n• 爆款复刻 — 解析爆款笔记并仿写\n• 购买套餐 — 积分充值和套餐购买\n• 个人中心 — 账户管理和积分明细\n• 历史记录 — 查看所有创作记录' },
      { q: '积分是什么？怎么获取？', a: '积分是平台的通用货币，用于生成文案和图片。获取方式：\n• 购买套餐获得积分\n• 积分充值包直接购买\n• 注册赠送积分\n• 邀请好友注册获得奖励积分\n• 使用兑换码充值' },
    ],
  },
  {
    key: 'guide', label: '功能指南', icon: <Sparkles className="w-4 h-4" />,
    items: [
      { q: '一键生成图文怎么用？', a: '1. 选择内容分类（美妆、美食、旅行等）\n2. 输入创作主题（如"成都五日游攻略"）\n3. 设置页数（3-10页），可上传参考图片\n4. 点击"生成大纲"，AI 生成每页内容大纲\n5. 可编辑或删除大纲页面\n6. 点击"生成图文"，同时生成文案和配图\n7. 在编辑器中微调内容，右侧实时手机预览' },
      { q: 'AI 笔记生成怎么用？', a: '1. 输入创作主题\n2. 选择语气风格（活泼俏皮、专业干货、文艺清新等）\n3. 可选择创作角色（美妆博主、美食达人等）\n4. 点击生成，AI 流式输出标题、正文和标签\n5. 在富文本编辑器中编辑，支持加粗、链接等格式' },
      { q: '封面图片生成怎么用？', a: '支持两种模式：\n• 文生图：输入图片描述，选择风格和尺寸，AI 生成封面\n• 图生图：上传一张参考图，AI 生成同风格的新图片\n\n支持多种尺寸：3:4（小红书标准）、1:1（方图）、4:3（横图）' },
      { q: '爆款复刻怎么用？', a: '1. 粘贴小红书笔记链接\n2. 点击"获取内容"，自动解析标题、正文、图片、标签\n3. 输入仿写需求（如"改成化妆主题，语气更活泼"）\n4. 可选择是否同时复刻图片\n5. 点击"AI 仿写"，生成仿写后的标题、正文和标签' },
      { q: '参考图片有什么用？', a: '在一键图文中上传参考图片（最多5张），AI 会分析参考图的视觉风格，生成的配图会尽量还原参考图的风格，适合想要保持统一视觉风格的系列笔记。' },
    ],
  },
  {
    key: 'points', label: '积分与套餐', icon: <Coins className="w-4 h-4" />,
    items: [
      { q: '积分消耗规则是什么？', a: '每次 AI 生成都会消耗积分：\n• 文案生成（大纲、正文、笔记、仿写等）：消耗文案积分\n• 图片生成（配图、封面、图片复刻等）：消耗图片积分\n\n具体消耗数量可在购买套餐页面查看。批量生成图片按张数计算。' },
      { q: '有哪些套餐类型？', a: '• 体验包 — 一次性购买，适合新用户体验（限购1次）\n• 月付套餐 — 按月订阅，包含积分+VIP天数\n• 年付套餐 — 按年订阅，享受折扣优惠\n• 积分充值 — 直接购买积分，即时到账' },
      { q: '兑换码怎么使用？', a: '在购买套餐页面，点击顶部的"兑换码充值"按钮，输入兑换码即可。兑换码可能包含积分和/或VIP天数，到账后立即生效。' },
      { q: '邀请奖励怎么获得？', a: '1. 在个人中心的"邀请有礼"页面复制你的专属邀请链接\n2. 分享给好友，好友通过链接注册\n3. 好友注册后会获得注册赠送积分\n4. 好友首次充值后，你将获得邀请奖励积分及充值再赠送积分' },
    ],
  },
  {
    key: 'account', label: '账号与安全', icon: <Shield className="w-4 h-4" />,
    items: [
      { q: '如何修改密码？', a: '进入个人中心 → 账号安全 → 点击密码后面的"修改"按钮。如果之前未设置过密码，会显示"设置"按钮，无需输入旧密码。' },
      { q: '如何修改邮箱？', a: '进入个人中心 → 账号安全 → 点击邮箱后面的"修改"按钮。需要输入新邮箱并验证验证码。' },
      { q: '如何修改头像和昵称？', a: '进入个人中心，左侧用户卡片：\n• 头像：鼠标悬停在头像上，点击相机图标上传\n• 昵称：点击昵称旁边的箭头图标修改' },
    ],
  },
  {
    key: 'faq', label: '常见问题', icon: <HelpCircle className="w-4 h-4" />,
    items: [
      { q: '积分不够怎么办？', a: '可以购买套餐、积分充值包、使用兑换码或邀请好友获得奖励。积分永不过期。' },
      { q: '生成失败怎么办？', a: '可能原因：积分不足、AI 模型繁忙、网络问题。请稍后重试，如持续失败请联系客服。' },
      { q: '图片质量不满意可以重试吗？', a: '可以。一键图文中每张图片都有重试按钮，封面生成也可以多次生成（会消耗积分）。' },
      { q: '套餐到期后积分还能用吗？', a: '可以。积分不会过期，但套餐到期后 VIP 特权会失效。' },
      { q: '可以随时升级套餐吗？', a: '可以。升级后新套餐立即生效，积分和VIP天数会累加。' },
    ],
  },
]

function AccordionItem({ item }: { item: HelpItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left cursor-pointer group">
        <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{item.q}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[500px] pb-4' : 'max-h-0'}`}>
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{item.a}</p>
      </div>
    </div>
  )
}

export default function HelpPage() {
  const [activeKey, setActiveKey] = useState('start')
  const activeCategory = categories.find(c => c.key === activeKey)

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-4"><ArrowLeft className="w-4 h-4" />返回首页</Link>
          <h1 className="text-2xl font-bold text-text-primary">帮助中心</h1>
          <p className="text-sm text-text-muted mt-1">了解如何使用 XhsWork 的各项功能</p>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-56 shrink-0">
            <div className="rounded-2xl border border-border bg-white p-2 flex md:flex-col gap-1 overflow-x-auto md:sticky md:top-8" style={{ scrollbarWidth: 'none' }}>
              {categories.map(cat => (
                <span key={cat.key} onClick={() => setActiveKey(cat.key)} className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm cursor-pointer transition-all whitespace-nowrap ${activeKey === cat.key ? 'bg-primary/5 text-primary font-medium' : 'text-text-secondary hover:bg-surface-secondary'}`}>
                  {cat.icon}{cat.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0 rounded-2xl border border-border bg-white p-4 md:p-6">
            {activeCategory && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-primary">{activeCategory.icon}</span>
                  <h2 className="text-base font-semibold text-text-primary">{activeCategory.label}</h2>
                  <span className="text-xs text-text-muted ml-auto">{activeCategory.items.length} 个问题</span>
                </div>
                <div>{activeCategory.items.map((item, i) => <AccordionItem key={i} item={item} />)}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
