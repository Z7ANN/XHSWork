

import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, Loader2, QrCode, CircleCheck, Coins, Zap, X, ChevronDown, Sparkles, Clock, Gift, Image, Crown } from 'lucide-react'
import { packageListApi, orderApi, redeemApi, userApi, type PackageInfo, type OrderInfo, type UserProfile } from '@/api'

const WechatIcon = () => (
  <svg className="w-5 h-5"><use href="/icons.svg#wechat-pay" /></svg>
)

const AlipayIcon = () => (
  <svg className="w-5 h-5"><use href="/icons.svg#alipay" /></svg>
)

type PayStep = 'idle' | 'paying' | 'success'

const FAQ_LIST = [
  { q: '积分是什么？怎么使用？', a: '积分是平台的通用货币，用于生成大纲、文案、配图等 AI 功能。不同功能消耗不同积分，具体消耗量在操作前会提示。' },
  { q: '套餐到期后积分还能用吗？', a: '可以。积分不会过期，即使套餐到期，剩余积分仍然可以正常使用。' },
  { q: '可以随时升级套餐吗？', a: '可以。升级后新套餐立即生效，积分会叠加到账户中。' },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left cursor-pointer group">
        <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{q}</span>
        <ChevronDown className={`w-4 h-4 text-text-muted shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-40 pb-4' : 'max-h-0'}`}>
        <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [packages, setPackages] = useState<PackageInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [billingTab, setBillingTab] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPkg, setSelectedPkg] = useState<PackageInfo | null>(null)
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat')
  const [payStep, setPayStep] = useState<PayStep>('idle')
  const [order, setOrder] = useState<OrderInfo | null>(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState('')
  const [redeemResult, setRedeemResult] = useState<{ points: number; vipDays: number } | null>(null)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pointsRules, setPointsRules] = useState<{ text: number; image: number }>({ text: 10, image: 10 })
  const [payMethods, setPayMethods] = useState<{ wechat: boolean; alipay: boolean }>({ wechat: false, alipay: false })

  useEffect(() => {
    packageListApi.list().then(setPackages).catch(console.error).finally(() => setLoading(false))
    userApi.info().then(setProfile).catch(console.error)
    packageListApi.pointsRules().then(setPointsRules).catch(console.error)
    packageListApi.payMethods().then(setPayMethods).catch(console.error)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const trialPkg = packages.find(p => p.type === 'trial')
  const monthlyPkgs = packages.filter(p => p.type === 'monthly')
  const yearlyPkgs = packages.filter(p => p.type === 'yearly')
  const topupPkgs = packages.filter(p => p.type === 'topup')
  const displayPkgs = billingTab === 'monthly' ? monthlyPkgs : yearlyPkgs
  const recommendIndex = 1

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return
    setRedeemLoading(true)
    setRedeemError('')
    setRedeemResult(null)
    try {
      const result = await redeemApi.use(redeemCode.trim())
      setRedeemResult(result)
      setRedeemCode('')
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : '兑换失败')
    } finally {
      setRedeemLoading(false)
    }
  }

  const startPolling = useCallback((orderNo: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const updated = await orderApi.status(orderNo)
        if (updated.status === 1) {
          if (pollRef.current) clearInterval(pollRef.current)
          setOrder(updated)
          setPayStep('success')
          userApi.info().then(setProfile).catch(console.error)
        } else if (updated.status === 2) {
          if (pollRef.current) clearInterval(pollRef.current)
          setError('订单已取消')
          setPayStep('idle')
        }
      } catch { /* ignore */ }
    }, 3000)
  }, [])

  const openPayDialog = (pkg: PackageInfo) => {
    setSelectedPkg(pkg)
    setPayStep('idle')
    setOrder(null)
    setError('')
    setPayMethod(payMethods.wechat ? 'wechat' : payMethods.alipay ? 'alipay' : 'wechat')
  }

  const handlePay = async () => {
    if (!selectedPkg) return
    setPaying(true)
    setError('')
    try {
      const created = await orderApi.create(selectedPkg.id, payMethod)
      setOrder(created)
      setPayStep('paying')
      startPolling(created.orderNo)
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建订单失败')
    } finally { setPaying(false) }
  }

  const handleCancelOrder = async () => {
    if (!order) return
    try { await orderApi.cancel(order.orderNo) } catch { /* ignore */ }
    if (pollRef.current) clearInterval(pollRef.current)
    setPayStep('idle')
    setOrder(null)
  }

  const closeDialog = () => {
    if (payStep === 'paying') handleCancelOrder()
    setSelectedPkg(null)
    setPayStep('idle')
    setOrder(null)
    setError('')
  }

  const savings = (pkg: PackageInfo) => {
    if (pkg.originalPrice > 0 && pkg.originalPrice > pkg.price) return Math.round(pkg.originalPrice - pkg.price)
    return 0
  }

  const pricePerPoint = (pkg: PackageInfo) => {
    if (pkg.points > 0) return (pkg.price / pkg.points).toFixed(3)
    return '0'
  }

  if (loading) return (
    <div className="flex flex-col min-h-full animate-page-in max-w-[1400px] mx-auto w-full px-6 py-12">
      <div className="text-center mb-12">
        <div className="h-8 w-48 rounded-lg bg-surface-secondary animate-pulse mx-auto mb-3" />
        <div className="h-4 w-72 rounded bg-surface-secondary animate-pulse mx-auto" />
      </div>
      <div className="flex justify-center mb-10">
        <div className="h-11 w-56 rounded-full bg-surface-secondary animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl border border-border bg-white p-6 space-y-4">
            <div className="h-5 w-24 rounded bg-surface-secondary animate-pulse" />
            <div className="h-10 w-20 rounded bg-surface-secondary animate-pulse" />
            <div className="h-12 rounded-lg bg-surface-secondary animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 rounded bg-surface-secondary animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-surface-secondary animate-pulse" />
            </div>
            <div className="h-11 rounded-lg bg-surface-secondary animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-full animate-page-in max-w-[1400px] mx-auto w-full p-4 md:p-6 lg:p-8 relative">

      <div className="relative">

      {/* Hero Banner */}
      <div className="shadow-2xl shadow-primary/5 rounded-2xl bg-gradient-to-br from-primary/6 via-secondary to-surface p-8 lg:p-10 mb-12 relative overflow-hidden border border-primary/8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-20 w-[400px] h-[400px] bg-primary/12 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-primary/8 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white/40 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, #FF2442 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8">
          {/* 左侧文案 */}
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-primary/15 text-primary text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />AI 驱动的创作加速器
            </span>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight leading-tight">为你的创作注入灵感</h1>
            <p className="text-sm text-text-secondary mt-3 leading-relaxed max-w-md">灵活积分制，按需使用。顶尖文生图模型，企业级稳定接口，让每一次创作都高效且精彩。</p>
            <div className="flex flex-wrap gap-4 mt-6">
              <span className="flex items-center gap-1.5 text-xs text-text-muted bg-white/60 px-2.5 py-1.5 rounded-lg border border-white/80"><Clock className="w-3.5 h-3.5 text-blue-500" />积分永不过期</span>
              <span className="flex items-center gap-1.5 text-xs text-text-muted bg-white/60 px-2.5 py-1.5 rounded-lg border border-white/80"><Zap className="w-3.5 h-3.5 text-amber-500" />即时到账</span>
              <span onClick={() => { setRedeemCode(''); setRedeemError(''); setRedeemResult(null); setRedeemOpen(true) }} className="flex items-center gap-1.5 text-xs text-white font-medium bg-primary px-3.5 py-1.5 rounded-lg cursor-pointer hover:bg-primary-dark transition-colors"><Gift className="w-3.5 h-3.5" />兑换码充值</span>
            </div>
          </div>
          {/* 右侧积分面板 */}
          <div className="w-full lg:w-auto flex gap-4">
            <div className="flex-1 lg:w-48 rounded-xl bg-white border border-border/80 p-5">
              <p className="text-[11px] text-text-muted mb-2">当前余额</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-text-primary">{profile?.points ?? '-'}</span>
                <span className="text-xs text-text-muted">积分</span>
              </div>
              {profile?.subscription && (
                <div className="flex items-center gap-1 mt-3 px-2 py-1 rounded-md bg-amber-50 border border-amber-100 w-fit">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span className="text-[11px] text-amber-600 font-medium">{profile.subscription.name}</span>
                </div>
              )}
              {profile && <p className="text-[11px] text-text-muted mt-2">已使用 {profile.consumedPoints} 积分</p>}
            </div>
            <div className="flex-1 lg:w-48 rounded-xl bg-white border border-border/80 p-5">
              <p className="text-[11px] text-text-muted mb-4">积分消耗</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-purple-500" /></span>文案生成</span>
                  <span className="text-xs font-semibold text-text-primary bg-surface-secondary px-2 py-0.5 rounded">{pointsRules.text} 积分起</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center"><Image className="w-3.5 h-3.5 text-emerald-500" /></span>图片生成</span>
                  <span className="text-xs font-semibold text-text-primary bg-surface-secondary px-2 py-0.5 rounded">{pointsRules.image} 积分起</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 月付/年付切换 */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center bg-white border border-border rounded-full p-1">
          <span
            onClick={() => setBillingTab('monthly')}
            className={`px-6 py-2.5 text-sm font-medium rounded-full cursor-pointer transition-all duration-200 ${
              billingTab === 'monthly' ? 'bg-surface-secondary text-text-primary' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            月付方案
          </span>
          <span
            onClick={() => setBillingTab('yearly')}
            className={`px-6 py-2.5 text-sm font-medium rounded-full cursor-pointer transition-all duration-200 flex items-center gap-2 ${
              billingTab === 'yearly' ? 'bg-surface-secondary text-text-primary' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            年付方案
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-white font-semibold">省14%</span>
          </span>
        </div>
      </div>

      {/* 套餐卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16 px-1">
        {trialPkg && (
          <div className="relative rounded-2xl border border-border bg-white p-6 flex flex-col transition-all duration-200 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
            <h3 className="text-lg font-bold text-text-primary">{trialPkg.name}</h3>
            <div className="mt-4 flex items-baseline gap-0.5">
              <span className="text-sm text-text-muted">¥</span>
              <span className="text-4xl font-extrabold text-text-primary tracking-tight">{trialPkg.price}</span>
            </div>
            {savings(trialPkg) > 0 && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-sm text-text-muted line-through">¥{trialPkg.originalPrice}</span>
                <span className="text-xs text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">省¥{savings(trialPkg)}</span>
              </div>
            )}
            <p className="text-xs text-text-muted mt-1.5">¥{pricePerPoint(trialPkg)} / 积分</p>
            <div className="mt-5 py-3 rounded-xl bg-surface-secondary text-center">
              <span className="text-2xl font-bold text-primary">{trialPkg.points}</span>
              <span className="text-sm text-text-muted ml-1.5">积分</span>
            </div>
            <ul className="mt-5 space-y-3 flex-1">
              {(trialPkg.features || []).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button onClick={() => openPayDialog(trialPkg)} className="mt-6 w-full h-11 rounded-xl border border-border text-sm font-medium text-text-primary hover:border-primary hover:text-primary cursor-pointer transition-all duration-200">
              立即体验
            </button>
          </div>
        )}

        {displayPkgs.map((pkg, i) => {
          const isRecommend = i === recommendIndex
          const badgeText = i === 0 ? '性价比之选' : isRecommend ? '最受欢迎' : pkg.badge
          return (
            <div key={pkg.id} className={`relative rounded-2xl p-6 flex flex-col transition-all duration-200 hover:-translate-y-1 ${isRecommend ? 'border-2 border-primary bg-white shadow-lg shadow-primary/10 hover:shadow-2xl hover:shadow-primary/10' : 'border border-border bg-white hover:shadow-2xl hover:shadow-primary/5'}`}>
              {badgeText && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm ${isRecommend ? 'bg-primary text-white' : 'bg-amber-400 text-white'}`}>
                  {badgeText}
                </div>
              )}
              <h3 className="text-lg font-bold text-text-primary">{pkg.name}</h3>
              <div className="mt-4 flex items-baseline gap-0.5">
                <span className="text-sm text-text-muted">¥</span>
                <span className={`text-4xl font-extrabold tracking-tight ${isRecommend ? 'text-primary' : 'text-text-primary'}`}>{pkg.price}</span>
                <span className="text-sm text-text-muted">/{billingTab === 'monthly' ? '月' : '年'}</span>
              </div>
              {savings(pkg) > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm text-text-muted line-through">¥{pkg.originalPrice}</span>
                  <span className="text-xs text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">省¥{savings(pkg)}</span>
                </div>
              )}
              <p className="text-xs text-text-muted mt-1.5">¥{pricePerPoint(pkg)} / 积分</p>
              <div className={`mt-5 py-3 rounded-xl text-center ${isRecommend ? 'bg-primary/5' : 'bg-surface-secondary'}`}>
                <span className="text-2xl font-bold text-primary">{pkg.points.toLocaleString()}</span>
                <span className="text-sm text-text-muted ml-1.5">积分</span>
              </div>
              <ul className="mt-5 space-y-3 flex-1">
                {(pkg.features || []).map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-text-secondary">
                    {f.includes('⚡') ? <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> : <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
                    {f.replace('⚡ ', '')}
                  </li>
                ))}
              </ul>
              <button onClick={() => openPayDialog(pkg)} className={`mt-6 w-full h-11 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${isRecommend ? 'bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30' : 'border border-border text-text-primary hover:border-primary hover:text-primary'}`}>
                选择方案
              </button>
            </div>
          )
        })}
      </div>

      {/* 积分充值 */}
      {topupPkgs.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">积分充值</h2>
              <p className="text-sm text-text-muted">积分用完了？随时补充，即时到账</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-1">
            {topupPkgs.map(pkg => (
              <div key={pkg.id} onClick={() => openPayDialog(pkg)} className="relative rounded-2xl border border-border bg-white p-5 text-left transition-all duration-200 hover:border-primary hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer group">
                {pkg.badge && <div className="absolute -top-2.5 right-3 px-2.5 py-0.5 bg-primary text-white text-xs font-medium rounded-full shadow-sm">{pkg.badge}</div>}
                <div className="flex items-center gap-1.5 text-primary font-semibold"><Coins className="w-4 h-4" />{pkg.points} 积分</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-text-primary">¥{pkg.price}</span>
                  {pkg.originalPrice > 0 && pkg.originalPrice > pkg.price && <span className="text-sm text-text-muted line-through">¥{pkg.originalPrice}</span>}
                </div>
                {(pkg.features || []).filter(f => f !== '即时到账').map((f, i) => (<p key={i} className="mt-1.5 text-xs text-primary">{f}</p>))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="mb-12 max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-semibold text-text-primary text-center mb-6">常见问题</h2>
        <div className="rounded-2xl border border-border bg-white px-6">
          {FAQ_LIST.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
      </div>

      {/* 确认购买弹窗 */}
      {selectedPkg && payStep === 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeDialog}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl w-[400px] max-w-[90vw] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-text-primary">确认购买</h3>
              <button onClick={closeDialog} className="w-8 h-8 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="rounded-xl bg-surface-secondary p-4 mb-5">
              <p className="text-sm font-medium text-text-primary">{selectedPkg.name}</p>
              <p className="text-xs text-text-muted mt-1">{selectedPkg.points} 积分{selectedPkg.vipDays > 0 && ` · VIP ${selectedPkg.vipDays}天`}</p>
            </div>
            <div className="text-center mb-5">
              <span className="text-3xl font-bold text-primary">¥{selectedPkg.price}</span>
              {selectedPkg.originalPrice > 0 && selectedPkg.originalPrice > selectedPkg.price && <span className="ml-2 text-sm text-text-muted line-through">¥{selectedPkg.originalPrice}</span>}
            </div>
            <div className="flex gap-3 mb-5">
              {payMethods.wechat && (
              <button onClick={() => setPayMethod('wechat')} className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 border cursor-pointer transition-all duration-200 ${payMethod === 'wechat' ? 'border-[#07C160] text-[#07C160] bg-[#07C160]/5 shadow-sm' : 'border-border text-text-secondary hover:border-text-muted'}`}>
                <WechatIcon /><span className="text-sm font-medium">微信支付</span>
              </button>
              )}
              {payMethods.alipay && (
              <button onClick={() => setPayMethod('alipay')} className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 border cursor-pointer transition-all duration-200 ${payMethod === 'alipay' ? 'border-[#1677FF] text-[#1677FF] bg-[#1677FF]/5 shadow-sm' : 'border-border text-text-secondary hover:border-text-muted'}`}>
                <AlipayIcon /><span className="text-sm font-medium">支付宝</span>
              </button>
              )}
              {!payMethods.wechat && !payMethods.alipay && (
                <p className="text-sm text-text-muted text-center w-full py-2">暂未开通支付方式，请联系管理员</p>
              )}
            </div>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            <button onClick={handlePay} disabled={paying} className="w-full h-11 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-60 cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-primary/25">
              {paying && <Loader2 className="w-4 h-4 animate-spin" />}
              立即支付 ¥{selectedPkg.price}
            </button>
          </div>
        </div>
      )}

      {/* 扫码支付弹窗 */}
      {payStep === 'paying' && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => handleCancelOrder()}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl w-[400px] max-w-[90vw] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-text-primary">扫码支付</h3>
              <button onClick={() => handleCancelOrder()} className="w-8 h-8 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-secondary text-sm text-text-secondary">
                {payMethod === 'wechat' ? <WechatIcon /> : <AlipayIcon />}{selectedPkg?.name} · ¥{order.amount}
              </div>
              {order.qrCodeUrl ? (
                <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden border border-border">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(order.qrCodeUrl)}`} alt="支付二维码" className="w-full h-full" />
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 bg-surface-secondary">
                  <QrCode className="w-14 h-14 text-text-muted" />
                  <p className="text-xs text-text-muted">二维码生成中...</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-sm text-text-muted"><Loader2 className="w-4 h-4 animate-spin" />等待支付中...</div>
              <div className="flex gap-3">
                <button onClick={() => handleCancelOrder()} className="flex-1 h-10 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-secondary cursor-pointer transition-colors">取消订单</button>
              </div>
              <p className="text-xs text-text-muted">订单号：{order.orderNo}</p>
            </div>
          </div>
        </div>
      )}

      {/* 支付成功弹窗 */}
      {payStep === 'success' && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={closeDialog}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl w-[400px] max-w-[90vw] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center"><CircleCheck className="w-8 h-8 text-green-500" /></div>
              <div>
                <p className="text-lg font-semibold text-text-primary">支付成功</p>
                <p className="text-sm text-text-secondary mt-1">已到账 {order.pointsGranted} 积分{order.vipDaysGranted > 0 && ` + VIP ${order.vipDaysGranted}天`}</p>
              </div>
              <div className="flex gap-2 text-sm text-text-muted justify-center"><span>订单号：{order.orderNo}</span><span>·</span><span>¥{order.amount}</span></div>
              <button onClick={closeDialog} className="w-full h-11 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark cursor-pointer transition-all duration-200 shadow-md shadow-primary/25">继续使用</button>
            </div>
          </div>
        </div>
      )}

      {/* 兑换码弹窗 */}
      {redeemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setRedeemOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl w-[420px] max-w-[90vw] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">兑换码充值</h3>
              <button onClick={() => setRedeemOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <p className="text-sm text-text-muted mb-4">输入兑换码，积分即时到账</p>
            <div className="flex items-center gap-3">
              <input value={redeemCode} onChange={e => { setRedeemCode(e.target.value); setRedeemError(''); setRedeemResult(null) }} placeholder="请输入兑换码" maxLength={32} className="flex-1 h-11 px-4 rounded-xl border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
              <button onClick={handleRedeem} disabled={redeemLoading || !redeemCode.trim()} className="h-11 px-6 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1.5">{redeemLoading && <Loader2 className="w-4 h-4 animate-spin" />}兑换</button>
            </div>
            {redeemError && <p className="text-sm text-red-500 mt-3">{redeemError}</p>}
            {redeemResult && (
              <div className="flex items-center gap-2 mt-3 text-sm text-green-600">
                <CircleCheck className="w-4 h-4" />
                兑换成功，到账 {redeemResult.points} 积分{redeemResult.vipDays > 0 && ` + VIP ${redeemResult.vipDays}天`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
