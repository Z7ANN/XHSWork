import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" />返回首页</Link>
        <h1 className="text-2xl font-bold text-text-primary mb-6">服务条款</h1>
        <div className="rounded-2xl border border-border bg-white p-8 text-sm text-text-secondary leading-relaxed space-y-6">
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">1. 服务说明</h2>
            <p>XhsWork 是一款基于 AI 技术的小红书内容创作辅助工具，提供文案生成、图片生成、爆款复刻等功能。本平台生成的内容仅供参考，用户需自行审核后使用。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">2. 账号注册</h2>
            <p>用户需使用真实有效的邮箱注册账号。每个邮箱仅可注册一个账号。用户应妥善保管账号信息，因账号泄露造成的损失由用户自行承担。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">3. 积分与付费</h2>
            <p>平台采用积分制，用户通过购买套餐或充值获得积分。积分用于消耗 AI 生成服务，不同功能消耗不同数量的积分。已购买的积分不支持退款，积分永不过期。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">4. 使用规范</h2>
            <p>用户不得利用本平台生成违反法律法规、侵犯他人权益、传播不良信息的内容。平台有权对违规账号进行封禁处理。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">5. 知识产权</h2>
            <p>用户通过本平台生成的文案和图片，其使用权归用户所有。但平台保留对生成内容进行匿名化分析以改进服务的权利。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">6. 免责声明</h2>
            <p>AI 生成的内容可能存在不准确或不完善之处，用户应自行审核。因使用生成内容造成的任何损失，平台不承担责任。平台不保证服务的不间断性。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">7. 条款修改</h2>
            <p>平台有权根据需要修改本服务条款，修改后的条款将在平台上公布。继续使用本平台即视为同意修改后的条款。</p>
          </section>
        </div>
      </div>
    </div>
  )
}
