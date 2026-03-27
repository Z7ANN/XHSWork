import { useState, useEffect, useRef } from 'react'
import { PenLine, Menu, X, User, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const navLinks = [
  { label: '功能介绍', target: 'features' },
  { label: '使用流程', target: 'how-it-works' },
  { label: '定价', target: 'pricing' },
]

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

interface UserInfo {
  id: number
  email: string
  nickname: string
  avatar: string
}

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const navigate = useNavigate()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-6xl">
      <div className="rounded-md border border-border bg-white/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <PenLine className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary">XhsWork</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <span key={link.target} onClick={() => scrollTo(link.target)} className="text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors">
              {link.label}
            </span>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/oneclick" className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer">
                进入工作台
              </Link>
              <div className="relative" ref={dropdownRef}>
                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold cursor-pointer"
                >
                  {(user.nickname || user.email).charAt(0).toUpperCase()}
                </div>
                {dropdownOpen && (
                  <div className="absolute right-0 top-10 w-40 bg-white rounded-lg border border-border shadow-lg py-1 z-50">
                    <Link to="/user" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
                      <User className="w-4 h-4" />个人中心
                    </Link>
                    <div className="border-t border-border my-1" />
                    <div onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                      <LogOut className="w-4 h-4" />退出登录
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="px-4 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-secondary transition-colors cursor-pointer">登录</Link>
              <Link to="/login" className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer">免费开始</Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 rounded-md hover:bg-surface-secondary transition-colors cursor-pointer" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden mt-2 rounded-md border border-border bg-white/95 backdrop-blur-xl p-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <span key={link.target} onClick={() => { scrollTo(link.target); setMobileOpen(false) }} className="text-sm text-text-secondary hover:text-text-primary cursor-pointer py-1">
              {link.label}
            </span>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            {user ? (
              <>
                <Link to="/oneclick" onClick={() => setMobileOpen(false)} className="w-full text-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">进入工作台</Link>
                <button onClick={handleLogout} className="w-full px-4 py-2 rounded-lg border border-border text-sm text-text-secondary cursor-pointer">退出登录</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full text-center px-4 py-2 rounded-lg border border-border text-sm text-text-secondary">登录</Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full text-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">免费开始</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
