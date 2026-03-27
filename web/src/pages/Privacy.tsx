import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" />返回首页</Link>
        <h1 className="text-2xl font-bold text-text-primary mb-6">隐私政策</h1>
        <div className="rounded-2xl border border-border bg-white p-8 text-sm text-text-secondary leading-relaxed space-y-6">
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">1. 信息收集</h2>
            <p>我们收集的信息包括：注册时提供的邮箱地址、昵称、头像；使用服务时产生的创作记录、积分变动记录、订单信息；以及设备信息和访问日志。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">2. 信息使用</h2>
            <p>收集的信息用于：提供和改进服务、处理支付和订单、发送服务通知、防止欺诈和滥用、进行匿名化数据分析以优化产品体验。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">3. 信息存储</h2>
            <p>用户数据存储在安全的服务器上，采用加密传输和存储。密码使用 bcrypt 加密存储，我们无法获取用户的明文密码。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">4. 信息共享</h2>
            <p>我们不会将用户个人信息出售给第三方。仅在以下情况下可能共享：获得用户明确同意、法律法规要求、保护平台和用户的合法权益。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">5. AI 生成内容</h2>
            <p>用户输入的创作主题和生成的内容会发送至 AI 服务提供商进行处理。我们不会将用户的创作内容用于训练 AI 模型。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">6. 用户权利</h2>
            <p>用户有权访问、修改、删除自己的个人信息。如需删除账号及所有数据，请联系客服处理。</p>
          </section>
        </div>
      </div>
    </div>
  )
}
