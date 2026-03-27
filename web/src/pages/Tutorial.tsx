import { Link } from 'react-router-dom'
import { ArrowLeft, Zap, PenLine, Image, TrendingUp } from 'lucide-react'

const tutorials = [
  {
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    title: '一键生成图文',
    steps: ['选择分类，输入创作主题', '可上传参考图片指定风格', '点击生成大纲，AI 生成每页内容', '编辑大纲，调整页面内容', '点击生成图文，同时生成文案和配图', '在编辑器中微调，右侧实时预览', '复制内容发布到小红书'],
  },
  {
    icon: <PenLine className="w-5 h-5 text-primary" />,
    title: 'AI 笔记生成',
    steps: ['输入创作主题', '选择语气风格和创作角色', '点击生成，AI 流式输出内容', '在富文本编辑器中编辑', '自动生成标题和话题标签', '复制内容发布'],
  },
  {
    icon: <Image className="w-5 h-5 text-accent" />,
    title: '封面图片生成',
    steps: ['选择文生图或图生图模式', '输入图片描述或上传参考图', '选择风格和尺寸', '点击生成，等待 AI 出图', '不满意可重新生成'],
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
    title: '爆款复刻',
    steps: ['粘贴小红书笔记链接', '点击获取内容，自动解析', '输入仿写需求', '可选择是否复刻图片', '点击 AI 仿写，生成新内容', '右侧手机预览查看效果'],
  },
]

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" />返回首页</Link>
        <h1 className="text-2xl font-bold text-text-primary mb-2">使用教程</h1>
        <p className="text-sm text-text-muted mb-8">快速了解 XhsWork 各功能的使用方法</p>
        <div className="space-y-6">
          {tutorials.map(t => (
            <div key={t.title} className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center">{t.icon}</div>
                <h2 className="text-base font-semibold text-text-primary">{t.title}</h2>
              </div>
              <div className="space-y-3 pl-2">
                {t.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-text-secondary">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
