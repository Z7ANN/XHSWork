import { PenLine, Image, TrendingUp, Zap, Coins, History } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: '一键生成图文',
    desc: '输入主题，AI 自动生成大纲、正文、配图。支持上传参考图片，还原风格批量出图。',
    color: 'bg-amber-500/10 text-amber-600',
    to: '/oneclick',
  },
  {
    icon: <PenLine className="w-5 h-5" />,
    title: 'AI 笔记生成',
    desc: '输入灵感或需求，AI 生成小红书标题和正文文案，支持多种语气风格，自动生成话题标签。',
    color: 'bg-primary/10 text-primary',
    to: '/editor',
  },
  {
    icon: <Image className="w-5 h-5" />,
    title: '封面图片生成',
    desc: '文生图和图生图两种模式，输入描述或上传参考图，AI 生成高质量小红书封面。',
    color: 'bg-accent/10 text-accent',
    to: '/cover',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: '爆款复刻',
    desc: '粘贴小红书笔记链接，自动解析标题、正文、图片，AI 仿写同类型爆款内容。',
    color: 'bg-emerald-500/10 text-emerald-600',
    to: '/viral',
  },
  {
    icon: <Coins className="w-5 h-5" />,
    title: '灵活积分制',
    desc: '按需购买积分，文案和图片独立计费。体验包、月付、年付多种套餐，积分永不过期。',
    color: 'bg-violet-500/10 text-violet-600',
    to: '/pricing',
  },
  {
    icon: <History className="w-5 h-5" />,
    title: '创作记录管理',
    desc: '所有生成的大纲、文案、图片自动保存，随时查看历史记录，支持重新编辑和导出。',
    color: 'bg-rose-500/10 text-rose-600',
    to: '/history',
  },
]

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-primary bg-secondary px-4 py-1.5 rounded-full">核心功能</span>
          <h2 className="mt-6 text-3xl md:text-4xl font-bold text-text-primary">
            一站式小红书创作工具箱
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            从文案撰写到封面设计，从爆款分析到内容优化，覆盖小红书创作全流程
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Link key={f.title} to={f.to}>
              <div className="group rounded-sm border border-border bg-white p-8 hover:border-border-hover hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer h-full">
                <div className={`w-12 h-12 rounded-sm ${f.color} flex items-center justify-center mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
