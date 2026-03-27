import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export const CTASection = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-md bg-gradient-to-br from-primary to-primary-dark p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white">准备好让内容起飞了吗？</h2>
            <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">加入 50,000+ 创作者，用 AI 提升你的小红书创作效率</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/editor" className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-primary font-semibold hover:bg-white/90 transition-colors cursor-pointer">
                免费开始创作
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/60">注册即可免费体验</p>
          </div>
        </div>
      </div>
    </section>
  )
}
