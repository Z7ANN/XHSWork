import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api'
import { Sparkles, Mail, Lock, ShieldCheck, Gift, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'

type Mode = 'login' | 'code-login' | 'register'

const tabs: { key: Mode; label: string }[] = [
  { key: 'login', label: '密码登录' },
  { key: 'code-login', label: '验证码登录' },
  { key: 'register', label: '注册账号' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    const invite = searchParams?.get('invite')
    if (invite) {
      setInviteCode(invite)
      setMode('register')
    }
  }, [searchParams])

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!email || countdown > 0) return
    try {
      await authApi.sendCode(email)
      startCountdown()
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    }
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      let data
      if (mode === 'login') {
        data = await authApi.login(email, password)
      } else if (mode === 'code-login') {
        data = await authApi.loginByCode(email, code)
      } else {
        data = await authApi.register(email, password, code, inviteCode)
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/oneclick', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setCode('')
    setPassword('')
  }

  const needCode = mode === 'register' || mode === 'code-login'
  const needPassword = mode === 'login' || mode === 'register'
  const submitText = mode === 'register' ? '注册账号' : '登录'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="bg-white rounded-3xl shadow-2xl flex w-full max-w-5xl overflow-hidden relative z-10 min-h-[600px]">
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary to-rose-600 p-12 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <Sparkles className="w-8 h-8" />
              <span className="text-2xl font-bold tracking-wider">XhsWork</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-6">一键打造<br />爆款小红书图文</h1>
            <p className="text-white/80 text-lg leading-relaxed">AI 赋能内容创作，快速生成封面、文案和标签。<br />无论是美妆、穿搭还是美食，一分钟搞定高质量笔记。</p>
          </div>
          <div className="relative z-10 h-64 mt-8 flex space-x-4">
            <div className="w-1/2 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 -rotate-6 translate-y-8 shadow-xl">
              <div className="w-full h-32 rounded-xl bg-gradient-to-tr from-rose-300 to-pink-200 mb-3" />
              <div className="w-3/4 h-3 bg-white/40 rounded-full mb-2" />
              <div className="w-1/2 h-3 bg-white/20 rounded-full" />
            </div>
            <div className="w-1/2 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 rotate-[4deg] translate-y-2 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/30" />
                <div className="w-1/2 h-3 bg-white/40 rounded-full" />
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full mb-2" />
              <div className="w-full h-2 bg-white/20 rounded-full mb-2" />
              <div className="w-2/3 h-2 bg-white/20 rounded-full" />
            </div>
          </div>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-2">欢迎回来</h2>
              <p className="text-text-muted">登录账号，开始您的创作之旅</p>
            </div>
            <div className="flex gap-6 border-b border-border mb-8">
              {tabs.map((tab) => (
                <div key={tab.key} onClick={() => switchMode(tab.key)} className={`pb-3 text-base font-medium border-b-2 cursor-pointer transition-colors ${mode === tab.key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                  {tab.label}
                </div>
              ))}
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">邮箱</label>
                <div className="flex items-center gap-2.5 px-4 h-12 rounded-xl bg-gray-50 border border-transparent focus-within:bg-white focus-within:border-primary/30 transition-colors">
                  <Mail className="w-4 h-4 text-text-muted shrink-0" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱" onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted" />
                </div>
              </div>
              {needPassword && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">密码</label>
                  <div className="flex items-center gap-2.5 px-4 h-12 rounded-xl bg-gray-50 border border-transparent focus-within:bg-white focus-within:border-primary/30 transition-colors">
                    <Lock className="w-4 h-4 text-text-muted shrink-0" />
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? '至少6位密码' : '请输入密码'} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted" />
                    <div className="cursor-pointer text-text-muted hover:text-text-secondary transition-colors" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              )}
              {needCode && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">验证码</label>
                  <div className="flex gap-3">
                    <div className="flex-1 flex items-center gap-2.5 px-4 h-12 rounded-xl bg-gray-50 border border-transparent focus-within:bg-white focus-within:border-primary/30 transition-colors">
                      <ShieldCheck className="w-4 h-4 text-text-muted shrink-0" />
                      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6位验证码" maxLength={6} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted" />
                    </div>
                    <button onClick={handleSendCode} disabled={!email || countdown > 0} className="shrink-0 h-12 px-5 rounded-xl text-sm font-medium border border-border text-text-secondary hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>
              )}
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">邀请码 <span className="text-text-muted font-normal">(选填)</span></label>
                  <div className="flex items-center gap-2.5 px-4 h-12 rounded-xl bg-gray-50 border border-transparent focus-within:bg-white focus-within:border-primary/30 transition-colors">
                    <Gift className="w-4 h-4 text-text-muted shrink-0" />
                    <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="填邀请码双方获得积分" maxLength={20} className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted" />
                  </div>
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button onClick={handleSubmit} disabled={loading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{submitText}<ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
