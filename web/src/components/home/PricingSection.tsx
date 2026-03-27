import { useState, useEffect } from 'react'
import { Check, Coins, Crown, Zap } from 'lucide-react'
import { packageListApi, type PackageInfo } from '@/api'

export const PricingSection = () => {
  const [packages, setPackages] = useState<PackageInfo[]>([])
  const [tab, setTab] = useState('monthly')

  useEffect(() => {
    packageListApi.list().then(setPackages).catch(() => {})
  }, [])

  const trialPkg = packages.find(p => p.type === 'trial')
  const monthlyPkgs = packages.filter(p => p.type === 'monthly')
  const yearlyPkgs = packages.filter(p => p.type === 'yearly')

  const handleClick = () => {
    const isLoggedIn = !!localStorage.getItem('token')
    window.location.href = isLoggedIn ? '/pricing' : '/login'
  }

  const renderCard = (pkg: PackageInfo, highlight = false) => (
    <div
      key={pkg.id}
      className={`relative rounded-md border p-8 transition-all duration-300 ${
        highlight
          ? 'border-primary bg-white shadow-xl shadow-primary/10 scale-[1.02]'
          : 'border-border bg-white hover:border-border-hover hover:shadow-lg hover:shadow-primary/5'
      }`}
    >
      {pkg.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-medium rounded-full whitespace-nowrap">
          {pkg.badge}
        </div>
      )}
      <div className="text-sm font-medium text-text-secondary">{pkg.name}</div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-sm text-text-muted">¥</span>
        <span className="text-4xl font-bold text-text-primary">{pkg.price}</span>
        {pkg.type === 'monthly' && <span className="text-sm text-text-muted">/月</span>}
        {pkg.type === 'yearly' && <span className="text-sm text-text-muted">/年</span>}
      </div>
      {pkg.originalPrice > 0 && pkg.originalPrice > pkg.price && (
        <div className="mt-1 text-sm text-text-muted line-through">¥{pkg.originalPrice}</div>
      )}
      <div className="mt-3 flex items-center gap-1.5 text-sm text-primary font-medium">
        <Coins className="w-4 h-4" />
        {pkg.points} 积分
        {pkg.vipDays > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
            <Crown className="w-3.5 h-3.5" />VIP {pkg.vipDays}天
          </span>
        )}
      </div>
      <button onClick={handleClick} className={`mt-6 w-full h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${highlight ? 'bg-primary text-white hover:bg-primary-dark' : 'border border-border text-text-primary hover:border-primary hover:text-primary'}`}>
        选择方案
      </button>
      <ul className="mt-8 space-y-3">
        {(pkg.features || []).map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
            {f.includes('⚡') ? <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> : <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />}
            {f.replace('⚡ ', '')}
          </li>
        ))}
      </ul>
    </div>
  )

  const currentPkgs = tab === 'monthly' ? monthlyPkgs : yearlyPkgs

  return (
    <section id="pricing" className="py-24 px-4 bg-surface-secondary">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-primary bg-secondary px-4 py-1.5 rounded-full">定价方案</span>
          <h2 className="mt-6 text-3xl md:text-4xl font-bold text-text-primary">选择适合你的方案</h2>
          <p className="mt-4 text-text-secondary">按需购买积分，VIP享极速通道</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center bg-white rounded-lg p-1 border border-border mb-8">
            <span onClick={() => setTab('monthly')} className={`px-5 py-2 text-sm font-medium rounded-md cursor-pointer transition-all ${tab === 'monthly' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>月付</span>
            <span onClick={() => setTab('yearly')} className={`px-5 py-2 text-sm font-medium rounded-md cursor-pointer transition-all ${tab === 'yearly' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>年付<span className="ml-1.5 text-xs opacity-80">省14%</span></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {trialPkg && renderCard(trialPkg)}
            {currentPkgs.map((pkg, i) => renderCard(pkg, i === 1))}
          </div>
        </div>
      </div>
    </section>
  )
}
