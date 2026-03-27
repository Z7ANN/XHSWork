import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" />返回首页</Link>
        <h1 className="text-2xl font-bold text-text-primary mb-6">联系我们</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><Mail className="w-5 h-5 text-primary" /></div>
            <h3 className="text-base font-semibold text-text-primary mb-1">邮件支持</h3>
            <p className="text-sm text-text-muted mb-3">工作日 9:00-18:00，通常 24 小时内回复</p>
            <a href="mailto:support@xhswork.com" className="text-sm text-primary hover:text-primary-dark transition-colors">support@xhswork.com</a>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4"><MessageCircle className="w-5 h-5 text-emerald-500" /></div>
            <h3 className="text-base font-semibold text-text-primary mb-1">微信客服</h3>
            <p className="text-sm text-text-muted mb-3">添加微信客服，获取一对一支持</p>
            <p className="text-sm text-text-primary font-mono">WTM30124</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6 mt-4">
          <h3 className="text-base font-semibold text-text-primary mb-2">常见问题</h3>
          <p className="text-sm text-text-secondary">在联系我们之前，建议先查看 <Link to="/help" className="text-primary hover:text-primary-dark transition-colors">帮助中心</Link>，大部分问题都能找到答案。</p>
        </div>
      </div>
    </div>
  )
}
