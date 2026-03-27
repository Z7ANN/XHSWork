import { Quote } from 'lucide-react'

const testimonials = [
  { content: '以前写一篇笔记要 2 小时，现在 10 分钟搞定，而且数据比之前好太多了。', name: '小美', role: '美妆博主 · 5万粉丝' },
  { content: '爆款复刻功能太好用了，直接拆解竞品爆款的套路，改个主题就能发。', name: '阿杰', role: '数码测评 · 12万粉丝' },
  { content: '封面生成省了我请设计师的钱，模板质量很高，改改文字就能用。', name: '小鹿', role: '生活方式 · 3万粉丝' },
]

export const ShowcaseSection = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-primary bg-secondary px-4 py-1.5 rounded-full">用户评价</span>
          <h2 className="mt-6 text-3xl md:text-4xl font-bold text-text-primary">创作者们都在用</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-md border border-border bg-white p-8 hover:border-border-hover hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <Quote className="w-8 h-8 text-primary/20 mb-4" />
              <p className="text-text-primary leading-relaxed">{t.content}</p>
              <div className="mt-6 pt-6 border-t border-border">
                <div className="font-semibold text-text-primary">{t.name}</div>
                <div className="text-sm text-text-muted mt-0.5">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
