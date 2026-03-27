import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { PenLine, Image, TrendingUp, User, Menu, Zap, LogOut, CreditCard, History } from 'lucide-react'

const sidebarLinks = [
  { to: '/oneclick', icon: <Zap className="w-5 h-5" />, label: '一键图文' },
  { to: '/editor', icon: <PenLine className="w-5 h-5" />, label: '笔记生成' },
  { to: '/cover', icon: <Image className="w-5 h-5" />, label: '图片生成' },
  { to: '/viral', icon: <TrendingUp className="w-5 h-5" />, label: '爆款复刻' },
  { to: '/pricing', icon: <CreditCard className="w-5 h-5" />, label: '购买套餐' },
  { to: '/user', icon: <User className="w-5 h-5" />, label: '个人中心' },
]

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [userInfo, setUserInfo] = useState<{ nickname?: string; email?: string; avatar?: string; role?: string } | null>(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login', { replace: true })
    } else {
      setAuthed(true)
      try {
        const stored = localStorage.getItem('user')
        if (stored) setUserInfo(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  if (!authed) return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )

  const isHistoryActive = pathname === '/history'

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full z-50 bg-white border-r border-border flex flex-col transition-all duration-300 w-56 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-14 flex items-center px-3 border-b border-border shrink-0">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <PenLine className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-text-primary">XhsWork</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? 'bg-primary/8 text-primary' : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'}`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />}
                {link.icon}
                <span>{link.label}</span>
              </Link>
            )
          })}

          <div className="pt-3 mt-3 border-t border-border">
            <Link
              to="/history"
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-4 px-4 py-3.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isHistoryActive ? 'bg-primary/8 text-primary' : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'}`}
            >
              {isHistoryActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />}
              <History className="w-5 h-5" />
              <span>历史记录</span>
            </Link>
          </div>
        </nav>

        <div className="hidden lg:block border-t border-border px-2 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(userInfo?.nickname || userInfo?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{userInfo?.nickname || userInfo?.email || '用户'}</p>
                <span className="text-[11px] text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded">{userInfo?.role === 'admin' ? '管理员' : '普通用户'}</span>
              </div>
              <button onClick={handleLogout} className="shrink-0 p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer" aria-label="退出登录">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col transition-all duration-300 lg:ml-56">
        <header className="lg:hidden h-14 bg-white border-b border-border flex items-center px-4 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="-ml-2 p-2 rounded-md hover:bg-surface-secondary transition-colors cursor-pointer" aria-label="打开菜单">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 text-sm font-semibold text-text-primary">XhsWork</span>
        </header>

        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="w-full flex-1 flex flex-col"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
