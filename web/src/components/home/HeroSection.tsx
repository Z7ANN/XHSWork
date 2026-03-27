import { useState, useEffect } from 'react'
import { ArrowRight, Sparkles, TrendingUp, Zap, Check, Star, PenLine, Hash, Copy, Image, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

const typingTexts = ['种草好物推荐', '秋冬穿搭攻略', '平价护肤测评', '探店美食分享', '减脂健身教程']

export const HeroSection = () => {
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const current = typingTexts[textIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < current.length) setCharIndex(charIndex + 1)
        else setTimeout(() => setIsDeleting(true), 1500)
      } else {
        if (charIndex > 0) setCharIndex(charIndex - 1)
        else { setIsDeleting(false); setTextIndex((textIndex + 1) % typingTexts.length) }
      }
    }, isDeleting ? 60 : 120)
    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, textIndex])

  useEffect(() => {
    const interval = setInterval(() => setActiveTab((p) => (p + 1) % 4), 8000)
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { label: '一键图文', icon: <Zap className="w-3.5 h-3.5" /> },
    { label: 'AI 文案', icon: <PenLine className="w-3.5 h-3.5" /> },
    { label: '封面生成', icon: <Image className="w-3.5 h-3.5" /> },
    { label: '爆款复刻', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ]

  return (
    <section className="relative pt-32 pb-24 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-primary/8 via-primary/3 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-16 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-48 -left-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/4 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, #FF2442 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="hidden xl:flex absolute items-center gap-2 px-3 py-2 rounded-md bg-white/90 border border-border shadow-lg backdrop-blur-sm z-10 top-[15%] left-[5%]" style={{ transform: 'rotate(-3deg)', animation: 'float 6s ease-in-out infinite' }}>
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center"><Heart className="w-3.5 h-3.5 text-primary" /></div>
        <div><div className="text-xs font-medium text-text-primary">今日穿搭 OOTD</div><div className="text-[10px] text-text-muted">2.3万 赞</div></div>
      </div>
      <div className="hidden xl:flex absolute items-center gap-2 px-3 py-2 rounded-md bg-white/90 border border-border shadow-lg backdrop-blur-sm z-10 top-[60%] right-[3%]" style={{ transform: 'rotate(2deg)', animation: 'float 6s ease-in-out infinite 1s' }}>
        <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center"><Star className="w-3.5 h-3.5 text-amber-500" /></div>
        <div><div className="text-xs font-medium text-text-primary">平价好物合集</div><div className="text-[10px] text-text-muted">1.8万 赞</div></div>
      </div>
      <div className="hidden xl:flex absolute items-center gap-2 px-3 py-2 rounded-md bg-white/90 border border-border shadow-lg backdrop-blur-sm z-10 bottom-[10%] left-[8%]" style={{ transform: 'rotate(-2deg)', animation: 'float 6s ease-in-out infinite 2s' }}>
        <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /></div>
        <div><div className="text-xs font-medium text-text-primary">一周减脂餐</div><div className="text-[10px] text-text-muted">3.1万 赞</div></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border-hover mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-sm text-primary font-medium">AI 驱动的小红书创作工具</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-text-primary leading-[1.15] tracking-tight">
              让每一篇笔记
              <br />
              都成为
              <span className="relative inline-block">
                <span className="text-primary">爆款</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 120 8" fill="none">
                  <path d="M2 6C30 2 90 2 118 6" stroke="#FF2442" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 text-lg text-text-secondary max-w-lg mx-auto lg:mx-0 leading-relaxed">
              输入一个主题，AI 自动生成标题、正文、配图。一键生成完整图文，让小红书创作简单到只需一句话。
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
              <Link to="/oneclick" className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors cursor-pointer">
                一键生成图文
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 rounded-lg border border-border text-text-secondary font-medium hover:bg-surface-secondary transition-colors cursor-pointer">
                了解更多
              </button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2">
              {['新用户免费体验', '注册即可使用', '30秒快速上手'].map((text) => (
                <span key={text} className="flex items-center gap-1.5 text-sm text-text-muted">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  {text}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-md blur-2xl pointer-events-none" />
            <div className="relative rounded-md border border-border bg-white shadow-2xl shadow-primary/5 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-secondary">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white border border-border text-xs text-text-muted">XhsWork.com</div>
                </div>
              </div>
              <div className="flex border-b border-border">
                {tabs.map((tab, i) => (
                  <button key={tab.label} onClick={() => setActiveTab(i)} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 cursor-pointer transition-colors ${activeTab === i ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text-secondary'}`}>
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>
              <div className="p-5 relative">
                <div className="grid [&>div]:col-start-1 [&>div]:row-start-1">
                  <div className={`transition-opacity duration-500 ${activeTab === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="space-y-3">
                      <div className="rounded-md border border-border bg-surface-secondary p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-medium text-text-primary">输入你的创作主题</span>
                        </div>
                        <div className="h-9 flex items-center">
                          <span className="text-sm text-text-primary">秋冬必备的平价穿搭公式</span>
                        </div>
                      </div>
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <span className="text-xs font-medium text-amber-600 block mb-1">AI 自动生成中...</span>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" />标题</span>
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" />正文</span>
                          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" />配图</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['封面', '第1页', '第2页'].map((label) => (
                          <div key={label} className="aspect-[3/4] rounded-md bg-gradient-to-br from-primary/10 to-accent/5 border border-border flex items-center justify-center">
                            <span className="text-[10px] text-text-muted">{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-emerald-700">一句话输入，完整图文自动生成</span>
                      </div>
                    </div>
                  </div>

                  <div className={`transition-opacity duration-500 ${activeTab === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="space-y-3">
                      <div className="rounded-md border border-border bg-surface-secondary p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-text-primary">输入你的灵感或需求</span>
                        </div>
                        <div className="h-9 flex items-center">
                          <span className="text-sm text-text-primary">{typingTexts[textIndex].slice(0, charIndex)}</span>
                          <span className="w-0.5 h-5 bg-primary animate-pulse ml-0.5" />
                        </div>
                      </div>
                      <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-primary">AI 生成标题</span>
                          <span className="text-xs text-text-muted flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"><Copy className="w-3 h-3" />复制</span>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">天花板级别的护肤好物，后悔没早发现！</p>
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <span className="text-xs font-medium text-text-primary mb-1 block">AI 生成正文</span>
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">姐妹们！今天必须安利这几个回购无数次的好物 ✨ 精华液用了一个月皮肤又嫩又滑，面霜是干皮救星...</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Hash className="w-3.5 h-3.5 text-primary" />
                        {['护肤好物', '好物分享', '平价护肤'].map((tag) => (
                          <span key={tag} className="px-2.5 py-1 rounded-full bg-secondary text-xs text-primary font-medium">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`transition-opacity duration-500 ${activeTab === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="space-y-3">
                      <div className="rounded-md border border-border bg-surface-secondary p-3">
                        <span className="text-xs font-medium text-text-primary block mb-1.5">文生图</span>
                        <p className="text-xs text-text-muted">输入描述，AI 生成小红书风格封面图</p>
                      </div>
                      <div className="rounded-md border border-border bg-surface-secondary p-3">
                        <span className="text-xs font-medium text-text-primary block mb-1.5">图生图</span>
                        <p className="text-xs text-text-muted">上传参考图，AI 生成同风格新图片</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { bg: 'from-primary/20 to-primary/5', label: '小红书风' },
                          { bg: 'from-amber-500/20 to-amber-500/5', label: '简约文字' },
                          { bg: 'from-violet-500/20 to-violet-500/5', label: '拼图对比' },
                        ].map((t) => (
                          <div key={t.label} className={`aspect-square rounded-md bg-gradient-to-br ${t.bg} flex flex-col items-center justify-center gap-1.5 cursor-pointer border border-border hover:border-primary/30 transition-colors`}>
                            <Image className="w-5 h-5 text-text-muted" />
                            <span className="text-[10px] text-text-secondary">{t.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-emerald-700">支持文生图 & 图生图两种模式</span>
                      </div>
                    </div>
                  </div>

                  <div className={`transition-opacity duration-500 ${activeTab === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="space-y-3">
                      <div className="rounded-md border border-border bg-surface-secondary p-3">
                        <span className="text-xs font-medium text-text-primary block mb-1">粘贴爆款笔记链接</span>
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white border border-border">
                          <span className="text-xs text-text-muted truncate">https://www.xiaohongshu.com/explore/...</span>
                        </div>
                      </div>
                      <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                        <span className="text-xs font-medium text-primary block mb-1">已获取笔记内容</span>
                        <p className="text-xs text-text-secondary line-clamp-2">原标题：后悔没早知道的5个护肤技巧...</p>
                      </div>
                      <div className="rounded-md border border-border p-3">
                        <span className="text-xs font-medium text-text-primary block mb-1">提出你的仿写需求</span>
                        <p className="text-xs text-text-muted">例如：改成美妆主题，语气更活泼...</p>
                      </div>
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-amber-700">AI 仿写标题 + 正文，一键生成</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 px-3 py-2 rounded-md bg-white border border-border shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-text-primary">3秒生成</span>
            </div>
            <div className="absolute -bottom-3 -left-3 px-3 py-2 rounded-md bg-white border border-border shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-text-primary">爆款率 +85%</span>
            </div>
          </div>
        </div>

        <div className="mt-20 rounded-md border border-border bg-white/80 backdrop-blur-sm p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '50,000+', label: '创作者使用', icon: <PenLine className="w-5 h-5 text-primary" /> },
              { value: '200万+', label: '笔记已生成', icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
              { value: '95%', label: '用户好评率', icon: <Star className="w-5 h-5 text-emerald-500" /> },
              { value: '3秒', label: '平均生成速度', icon: <Zap className="w-5 h-5 text-violet-500" /> },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-md bg-surface-secondary flex items-center justify-center shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-text-primary">{stat.value}</div>
                  <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
