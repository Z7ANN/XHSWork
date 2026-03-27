import { useState, useEffect } from 'react'
import { PenLine, X, QrCode, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { API_BASE } from '@/api'

const footerLinks = [
  {
    title: '产品',
    links: [
      { label: '一键生成图文', href: '/oneclick' },
      { label: '小红书编辑器', href: '/editor' },
      { label: '封面生成', href: '/cover' },
      { label: '爆款复刻', href: '/viral' },
      { label: '定价', href: 'pricing', isScroll: true },
    ],
  },
  {
    title: '支持',
    links: [
      { label: '帮助中心', href: '/help' },
      { label: '使用教程', href: '/tutorial' },
      { label: '联系我们', href: '/contact' },
      { label: '反馈建议', href: '/feedback' },
    ],
  },
  {
    title: '法律',
    links: [
      { label: '服务条款', href: '/terms' },
      { label: '隐私政策', href: '/privacy' },
      { label: '用户协议', href: '/agreement' },
    ],
  },
]

export const Footer = () => {
  const [qrModal, setQrModal] = useState<'wechat' | 'contact' | null>(null)
  const [qrCodes, setQrCodes] = useState<{ wechat: string; contact: string }>({ wechat: '', contact: '' })

  useEffect(() => {
    fetch(`${API_BASE}/pay/qrcodes`)
      .then(r => r.json())
      .then(d => { if (d.success) setQrCodes(d.data) })
      .catch(() => {})
  }, [])

  return (
    <footer className="border-t border-border bg-surface-secondary">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
                <PenLine className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">XhsWork</span>
            </Link>
            <p className="mt-4 text-sm text-text-muted leading-relaxed">
              AI 驱动的小红书创作工具，让每一篇笔记都成为爆款。
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-text-primary mb-4">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {'isScroll' in link && link.isScroll ? (
                      <button
                        onClick={() => document.getElementById(link.href)?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link to={link.href} className="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">&copy; 2026 XhsWork. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span onClick={() => setQrModal('wechat')} className="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" />微信公众号</span>
            <span onClick={() => setQrModal('contact')} className="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />联系我们</span>
          </div>
        </div>
      </div>

      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setQrModal(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl w-[340px] max-w-[90vw] p-6 text-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setQrModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors"><X className="w-4 h-4 text-text-muted" /></button>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              {qrModal === 'wechat' ? <QrCode className="w-6 h-6 text-primary" /> : <MessageCircle className="w-6 h-6 text-primary" />}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">{qrModal === 'wechat' ? '关注微信公众号' : '添加客服微信'}</h3>
            <p className="text-sm text-text-muted mb-4">{qrModal === 'wechat' ? '扫码关注，获取最新动态和使用技巧' : '扫码添加，获取一对一支持'}</p>
            {(() => {
              const qrUrl = qrModal === 'wechat' ? qrCodes.wechat : qrCodes.contact
              return qrUrl ? (
                <img src={qrUrl} alt="二维码" className="w-48 h-48 mx-auto rounded-xl object-contain" />
              ) : (
                <div className="w-48 h-48 mx-auto rounded-xl border-2 border-dashed border-border bg-surface-secondary flex flex-col items-center justify-center gap-2">
                  <QrCode className="w-12 h-12 text-text-muted/30" />
                  <p className="text-xs text-text-muted">暂未设置</p>
                </div>
              )
            })()}
            <p className="text-xs text-text-muted mt-3">{qrModal === 'wechat' ? '微信搜索「XhsWork」也可关注' : '工作日 9:00-18:00 在线'}</p>
          </div>
        </div>
      )}
    </footer>
  )
}
