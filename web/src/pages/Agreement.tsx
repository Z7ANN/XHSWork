import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AgreementPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" />返回首页</Link>
        <h1 className="text-2xl font-bold text-text-primary mb-6">用户协议</h1>
        <div className="rounded-2xl border border-border bg-white p-8 text-sm text-text-secondary leading-relaxed space-y-6">
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">1. 协议范围</h2>
            <p>本协议是用户与 XhsWork 平台之间关于使用平台服务的法律协议。注册或使用本平台即表示您已阅读并同意本协议的全部条款。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">2. 用户资格</h2>
            <p>您需要具备完全民事行为能力。如果您是未成年人，请在监护人的指导下使用本平台。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">3. 用户行为规范</h2>
            <p>用户承诺：不利用平台从事违法活动；不生成侵犯他人知识产权的内容；不生成色情、暴力、歧视等不良内容；不恶意攻击或干扰平台正常运行；不利用技术手段绕过积分消耗机制。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">4. 内容责任</h2>
            <p>用户对使用本平台生成并发布的内容承担全部责任。平台提供的是 AI 辅助创作工具，不对生成内容的准确性、合法性做出保证。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">5. 账号管理</h2>
            <p>平台有权对违反本协议的账号采取警告、限制功能、封禁等措施。被封禁账号中的剩余积分不予退还。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">6. 争议解决</h2>
            <p>因本协议引起的争议，双方应友好协商解决。协商不成的，任何一方均可向平台所在地有管辖权的人民法院提起诉讼。</p>
          </section>
        </div>
      </div>
    </div>
  )
}
