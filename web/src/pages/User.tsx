

import { useState, useEffect, useRef } from 'react'
import { Camera, Copy, Check, Gift, FileText, Users, Coins, Zap, X, Crown, Shield, ChevronRight, TrendingUp, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  userApi, orderApi, authApi, API_BASE,
  type UserProfile, type OrderInfo, type PointLog, type InviteRecord, type InviteStats,
} from '@/api'

const orderStatusLabels: Record<number, { text: string; cls: string }> = {
  0: { text: '待支付', cls: 'bg-amber-50 text-amber-600' },
  1: { text: '已支付', cls: 'bg-green-50 text-green-600' },
  2: { text: '已取消', cls: 'bg-gray-100 text-gray-500' },
  3: { text: '已退款', cls: 'bg-red-50 text-red-500' },
}

const pointTypeLabels: Record<string, string> = {
  purchase: '购买充值',
  invite_reward: '邀请奖励',
  consume: '积分消费',
  refund: '失败退回',
  admin_adjust: '管理员调整',
}

const subscriptionLabels: Record<string, string> = {
  trial: '体验版', monthly: '月度会员', yearly: '年度会员', vip: 'VIP 会员',
}

const navItems = [
  { key: 'overview', label: '账户总览', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'points', label: '积分明细', icon: <Coins className="w-4 h-4" /> },
  { key: 'orders', label: '订单记录', icon: <FileText className="w-4 h-4" /> },
  { key: 'invite', label: '邀请有礼', icon: <Gift className="w-4 h-4" /> },
  { key: 'security', label: '账号安全', icon: <Shield className="w-4 h-4" /> },
]

export default function UserPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<OrderInfo[]>([])
  const [pointLogs, setPointLogs] = useState<PointLog[]>([])
  const [invites, setInvites] = useState<InviteRecord[]>([])
  const [inviteStats, setInviteStats] = useState<InviteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bindCode, setBindCode] = useState('')
  const [bindLoading, setBindLoading] = useState(false)
  const [bindError, setBindError] = useState('')
  const [pwOld, setPwOld] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwOpen, setPwOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailCodeSending, setEmailCodeSending] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [pointsPage, setPointsPage] = useState(1)
  const [pointsTotal, setPointsTotal] = useState(0)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotal, setOrdersTotal] = useState(0)
  const [invitesPage, setInvitesPage] = useState(1)
  const [invitesTotal, setInvitesTotal] = useState(0)

  useEffect(() => {
    Promise.all([
      userApi.info().then(setProfile),
      orderApi.list(1).then(d => { setOrders(d.list); setOrdersTotal(d.pagination.total) }),
      userApi.pointLogs(1).then(d => { setPointLogs(d.list); setPointsTotal(d.pagination.total) }),
      userApi.inviteList(1).then(d => { setInvites(d.list); setInvitesTotal(d.pagination.total) }),
      userApi.inviteStats().then(setInviteStats),
    ]).catch(console.error).finally(() => setLoading(false))
  }, [])

  const loadPointsPage = async (p: number) => { const d = await userApi.pointLogs(p); setPointLogs(d.list); setPointsTotal(d.pagination.total); setPointsPage(p) }
  const loadOrdersPage = async (p: number) => { const d = await orderApi.list(p); setOrders(d.list); setOrdersTotal(d.pagination.total); setOrdersPage(p) }
  const loadInvitesPage = async (p: number) => { const d = await userApi.inviteList(p); setInvites(d.list); setInvitesTotal(d.pagination.total); setInvitesPage(p) }

  const PAGE_SIZE = 10

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const updated = await userApi.uploadAvatar(file)
      setProfile(updated)
      localStorage.setItem('user', JSON.stringify({ id: updated.id, email: updated.email, nickname: updated.nickname, avatar: updated.avatar, role: updated.role }))
    } catch (err) { console.error(err) }
  }

  const handleSaveProfile = async () => {
    if (!editNickname.trim()) return
    setSaving(true)
    try {
      const updated = await userApi.update({ nickname: editNickname.trim() })
      setProfile(updated)
      localStorage.setItem('user', JSON.stringify({ id: updated.id, email: updated.email, nickname: updated.nickname, avatar: updated.avatar, role: updated.role }))
      setEditOpen(false)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleCopyInviteCode = async () => {
    if (!profile?.inviteCode) return
    await navigator.clipboard.writeText(`${window.location.origin}/login?invite=${profile.inviteCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBindInvite = async () => {
    if (!bindCode.trim()) return
    setBindLoading(true); setBindError('')
    try { await userApi.bindInvite(bindCode.trim()); setProfile(await userApi.info()); setBindCode('') }
    catch (err) { setBindError(err instanceof Error ? err.message : '绑定失败') }
    finally { setBindLoading(false) }
  }

  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess('')
    if (!pwNew || pwNew.length < 6) { setPwError('新密码至少6位'); return }
    if (pwNew !== pwConfirm) { setPwError('两次密码不一致'); return }
    setPwSaving(true)
    try { await userApi.changePassword(pwOld, pwNew); setPwSuccess('密码修改成功'); setPwOld(''); setPwNew(''); setPwConfirm(''); setProfile(await userApi.info()) }
    catch (err) { setPwError(err instanceof Error ? err.message : '修改失败') }
    finally { setPwSaving(false) }
  }

  const handleSendEmailCode = async () => {
    if (!newEmail.trim()) return
    setEmailCodeSending(true); setEmailError('')
    try { await authApi.sendCode(newEmail.trim()) }
    catch (err) { setEmailError(err instanceof Error ? err.message : '发送失败') }
    finally { setEmailCodeSending(false) }
  }

  const handleChangeEmail = async () => {
    setEmailError('')
    if (!newEmail.trim() || !emailCode.trim()) { setEmailError('请填写完整'); return }
    setEmailSaving(true)
    try {
      const updated = await userApi.changeEmail(newEmail.trim(), emailCode.trim())
      setProfile(updated)
      localStorage.setItem('user', JSON.stringify({ id: updated.id, email: updated.email, nickname: updated.nickname, avatar: updated.avatar, role: updated.role }))
      setNewEmail(''); setEmailCode(''); setEmailOpen(false)
    } catch (err) { setEmailError(err instanceof Error ? err.message : '修改失败') }
    finally { setEmailSaving(false) }
  }

  const avatarSrc = profile?.avatar ? (profile.avatar.startsWith('http') ? profile.avatar : `${API_BASE.replace('/api', '')}${profile.avatar}`) : ''
  const totalCreations = profile ? (profile.stats.oneclick + profile.stats.editor + profile.stats.cover) : 0

  if (loading) return (
    <div className="animate-page-in max-w-6xl mx-auto w-full px-4 py-5">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="rounded-lg border border-border bg-white p-6"><div className="flex flex-col items-center gap-3"><div className="w-20 h-20 rounded-full bg-surface-secondary animate-pulse" /><div className="h-5 w-24 rounded bg-surface-secondary animate-pulse" /><div className="h-4 w-32 rounded bg-surface-secondary animate-pulse" /></div></div>
          <div className="rounded-lg border border-border bg-white p-3 space-y-1">{[1,2,3,4,5].map(i => <div key={i} className="h-9 rounded-lg bg-surface-secondary animate-pulse" />)}</div>
        </div>
        <div className="flex-1 rounded-lg border border-border bg-white p-6 space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-lg bg-surface-secondary animate-pulse" />)}</div>
      </div>
    </div>
  )
  if (!profile) return <div className="text-red-500 p-8">加载失败</div>

  const renderContent = () => {
    switch (activeNav) {
      case 'overview':
        return (
          <>
            <h3 className="text-base font-semibold text-text-primary mb-4">账户总览</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                <div className="flex items-center gap-2 mb-2"><Coins className="w-4 h-4 text-primary" /><span className="text-xs text-text-muted">积分余额</span></div>
                <p className="text-2xl font-bold text-text-primary">{profile.points}</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 p-4">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-amber-500" /><span className="text-xs text-text-muted">已使用积分</span></div>
                <p className="text-2xl font-bold text-text-primary">{profile.consumedPoints}</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
                <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-blue-500" /><span className="text-xs text-text-muted">创作总数</span></div>
                <p className="text-2xl font-bold text-text-primary">{totalCreations}</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
                <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-emerald-500" /><span className="text-xs text-text-muted">邀请人数</span></div>
                <p className="text-2xl font-bold text-text-primary">{inviteStats?.inviteCount || 0}</p>
              </div>
            </div>
            {/* 会员状态 */}
            <div className="rounded-xl border border-border p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.subscription ? 'bg-amber-50' : 'bg-surface-secondary'}`}>
                  <Crown className={`w-5 h-5 ${profile.subscription ? 'text-amber-500' : 'text-text-muted'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{profile.subscription ? (subscriptionLabels[profile.subscription.type] || profile.subscription.name) : '免费用户'}</p>
                  <p className="text-xs text-text-muted">{profile.isVip && profile.vipExpireAt ? `VIP 到期：${new Date(profile.vipExpireAt).toLocaleDateString('zh-CN')}` : '升级会员享更多权益'}</p>
                </div>
              </div>
              {!profile.subscription && (
                <span onClick={() => navigate('/pricing')} className="text-xs text-primary font-medium hover:text-primary-dark cursor-pointer transition-colors flex items-center gap-1">升级会员<ChevronRight className="w-3 h-3" /></span>
              )}
            </div>

            <h4 className="text-sm font-medium text-text-primary mb-3">创作统计</h4>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[{ label: '一键图文', count: profile.stats.oneclick, color: 'text-primary' }, { label: '笔记生成', count: profile.stats.editor, color: 'text-blue-500' }, { label: '封面生成', count: profile.stats.cover, color: 'text-purple-500' }].map(s => (
                <div key={s.label} className="rounded-lg border border-border p-4 flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{s.label}</span>
                  <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
                </div>
              ))}
            </div>
            <h4 className="text-sm font-medium text-text-primary mb-3">最近订单</h4>
            {orders.length === 0 ? (
              <div className="text-center py-10"><FileText className="w-8 h-8 text-text-muted/20 mx-auto mb-2" /><p className="text-sm text-text-muted">暂无订单</p></div>
            ) : (
              <div className="space-y-0">{orders.slice(0, 5).map(o => (
                <div key={o.orderNo} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div><p className="text-sm font-medium text-text-primary">{o.packageName}</p><p className="text-xs text-text-muted mt-0.5">{new Date(o.createdAt).toLocaleString('zh-CN')}</p></div>
                  <div className="flex items-center gap-2"><span className="text-sm font-medium text-text-primary">¥{o.amount}</span><span className={`text-xs px-2 py-0.5 rounded-full ${orderStatusLabels[o.status]?.cls}`}>{orderStatusLabels[o.status]?.text}</span></div>
                </div>
              ))}</div>
            )}
            {orders.length > 5 && <span onClick={() => setActiveNav('orders')} className="text-xs text-primary hover:text-primary-dark cursor-pointer mt-2 inline-flex items-center gap-0.5">查看全部<ChevronRight className="w-3 h-3" /></span>}
          </>
        )

      case 'points':
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-text-primary">积分明细</h3>
              <div className="flex gap-2">
                <span onClick={() => navigate('/pricing')} className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-1.5 hover:bg-primary-dark cursor-pointer transition-colors"><Zap className="w-3.5 h-3.5" />充值</span>
              </div>
            </div>
            <div className="flex gap-3 mb-6">
              <div className="flex-1 rounded-lg bg-surface-secondary p-4"><p className="text-xs text-text-muted mb-1">当前余额</p><p className="text-xl font-bold text-primary">{profile.points}</p></div>
              <div className="flex-1 rounded-lg bg-surface-secondary p-4"><p className="text-xs text-text-muted mb-1">累计消耗</p><p className="text-xl font-bold text-text-primary">{profile.consumedPoints}</p></div>
            </div>
            {pointLogs.length === 0 ? (
              <div className="text-center py-16"><Coins className="w-10 h-10 text-text-muted/20 mx-auto mb-3" /><p className="text-sm text-text-muted">暂无积分记录</p></div>
            ) : (
              <>
              <div className="space-y-0">{pointLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                  <div><p className="text-sm font-medium text-text-primary">{pointTypeLabels[log.type] || log.type}</p><p className="text-xs text-text-muted mt-0.5">{log.remark || '-'}</p></div>
                  <div className="text-right"><p className={`text-sm font-semibold ${log.amount > 0 ? 'text-primary' : 'text-text-primary'}`}>{log.amount > 0 ? '+' : ''}{log.amount}</p><p className="text-xs text-text-muted mt-0.5">{new Date(log.createdAt).toLocaleString('zh-CN')}</p></div>
                </div>
              ))}</div>
              {pointsTotal > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-text-muted">共 {pointsTotal} 条</span>
                  {Math.ceil(pointsTotal / PAGE_SIZE) > 1 && (
                  <div className="flex items-center gap-2">
                    <span onClick={() => pointsPage > 1 && loadPointsPage(pointsPage - 1)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${pointsPage > 1 ? 'text-text-secondary hover:bg-surface-secondary' : 'text-text-muted pointer-events-none'}`}>上一页</span>
                    <span className="text-xs text-text-muted">{pointsPage} / {Math.ceil(pointsTotal / PAGE_SIZE)}</span>
                    <span onClick={() => pointsPage < Math.ceil(pointsTotal / PAGE_SIZE) && loadPointsPage(pointsPage + 1)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${pointsPage < Math.ceil(pointsTotal / PAGE_SIZE) ? 'text-text-secondary hover:bg-surface-secondary' : 'text-text-muted pointer-events-none'}`}>下一页</span>
                  </div>
                  )}
                </div>
              )}
              </>
            )}
          </>
        )

      case 'orders':
        return (
          <>
            <h3 className="text-base font-semibold text-text-primary mb-4">订单记录</h3>
            {orders.length === 0 ? (
              <div className="text-center py-16"><FileText className="w-10 h-10 text-text-muted/20 mx-auto mb-3" /><p className="text-sm text-text-muted">暂无订单记录</p></div>
            ) : (
              <>
              <div className="space-y-0">{orders.map(o => (
                <div key={o.orderNo} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                  <div><p className="text-sm font-medium text-text-primary">{o.packageName}</p><p className="text-xs text-text-muted mt-0.5">{o.orderNo} · {new Date(o.createdAt).toLocaleString('zh-CN')}</p></div>
                  <div className="flex items-center gap-3"><span className="text-sm font-medium text-text-primary">¥{o.amount}</span><span className={`text-xs px-2 py-0.5 rounded-full ${orderStatusLabels[o.status]?.cls || 'bg-gray-100 text-gray-500'}`}>{orderStatusLabels[o.status]?.text || '未知'}</span></div>
                </div>
              ))}</div>
              {ordersTotal > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-text-muted">共 {ordersTotal} 条</span>
                  {Math.ceil(ordersTotal / PAGE_SIZE) > 1 && (
                  <div className="flex items-center gap-2">
                    <span onClick={() => ordersPage > 1 && loadOrdersPage(ordersPage - 1)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${ordersPage > 1 ? 'text-text-secondary hover:bg-surface-secondary' : 'text-text-muted pointer-events-none'}`}>上一页</span>
                    <span className="text-xs text-text-muted">{ordersPage} / {Math.ceil(ordersTotal / PAGE_SIZE)}</span>
                    <span onClick={() => ordersPage < Math.ceil(ordersTotal / PAGE_SIZE) && loadOrdersPage(ordersPage + 1)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${ordersPage < Math.ceil(ordersTotal / PAGE_SIZE) ? 'text-text-secondary hover:bg-surface-secondary' : 'text-text-muted pointer-events-none'}`}>下一页</span>
                  </div>
                  )}
                </div>
              )}
              </>
            )}
          </>
        )

      case 'invite':
        return (
          <>
            <h3 className="text-base font-semibold text-text-primary mb-4">邀请有礼</h3>
            <div className="rounded-lg bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-5 mb-6">
              <h4 className="text-sm font-semibold text-text-primary mb-1">邀请好友，获得积分奖励</h4>
              <p className="text-xs text-text-muted mb-4">分享你的专属邀请链接，好友注册或充值后你将获得积分奖励</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 px-3 rounded-lg bg-white border border-border flex items-center text-sm text-text-secondary truncate">{profile.inviteCode ? `${window.location.origin}/login?invite=${profile.inviteCode}` : '暂无邀请码'}</div>
                <span onClick={handleCopyInviteCode} className={`h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-1.5 hover:bg-primary-dark cursor-pointer transition-colors ${!profile.inviteCode ? 'opacity-50 pointer-events-none' : ''}`}>{copied ? <><Check className="w-4 h-4" />已复制</> : <><Copy className="w-4 h-4" />复制链接</>}</span>
              </div>
              {inviteStats?.config && (
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-primary/10">
                  <span className="text-xs text-text-muted">邀请人奖励 <span className="font-medium text-primary">{inviteStats.config.inviterReward}</span> 积分（{inviteStats.config.rewardMode === 'register' ? '好友注册后发放' : '好友首次充值后发放'}）</span>
                  {inviteStats.config.inviteeReward > 0 && <span className="text-xs text-text-muted">被邀请人奖励 <span className="font-medium text-primary">{inviteStats.config.inviteeReward}</span> 积分</span>}
                  {inviteStats.config.rechargeBonusRate > 0 && <span className="text-xs text-text-muted">好友充值赠送 <span className="font-medium text-primary">{inviteStats.config.rechargeBonusRate}%</span>（{inviteStats.config.rechargeBonusMode === 'every' ? '每次充值' : '仅首次'}）</span>}
                </div>
              )}
            </div>
            {!profile.invitedBy && (
              <div className="rounded-lg border border-dashed border-border p-5 mb-6">
                <h4 className="text-sm font-semibold text-text-primary mb-1">填写邀请码</h4>
                <p className="text-xs text-text-muted mb-3">通过好友推荐注册的，填写邀请码双方可获得积分奖励</p>
                <div className="flex items-center gap-2">
                  <input value={bindCode} onChange={e => { setBindCode(e.target.value); setBindError('') }} placeholder="输入好友的邀请码" maxLength={20} className="flex-1 h-10 px-3 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
                  <span onClick={handleBindInvite} className={`h-10 px-5 rounded-lg bg-primary text-white text-sm font-medium inline-flex items-center cursor-pointer hover:bg-primary-dark transition-colors ${bindLoading || !bindCode.trim() ? 'opacity-50 pointer-events-none' : ''}`}>{bindLoading ? '绑定中...' : '绑定'}</span>
                </div>
                {bindError && <p className="text-xs text-red-500 mt-2">{bindError}</p>}
              </div>
            )}
            {inviteStats && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-lg border border-border p-4"><p className="text-xs text-text-muted mb-1">邀请人数</p><p className="text-2xl font-bold text-text-primary">{inviteStats.inviteCount}</p></div>
                <div className="rounded-lg border border-border p-4"><p className="text-xs text-text-muted mb-1">已充值人数</p><p className="text-2xl font-bold text-text-primary">{inviteStats.paidCount}</p></div>
                <div className="rounded-lg border border-border p-4"><p className="text-xs text-text-muted mb-1">获得积分</p><p className="text-2xl font-bold text-primary">{inviteStats.totalEarned}</p></div>
              </div>
            )}
            <h4 className="text-sm font-medium text-text-primary mb-3">邀请记录（{invites.length}人）</h4>
            {invites.length === 0 ? (
              <div className="text-center py-12"><Users className="w-8 h-8 text-text-muted/20 mx-auto mb-2" /><p className="text-sm text-text-muted">暂无邀请记录</p></div>
            ) : (
              <>
              <div className="space-y-0">{invites.map(inv => {
                const invAvatar = inv.avatar ? (inv.avatar.startsWith('http') ? inv.avatar : `${API_BASE.replace('/api', '')}${inv.avatar}`) : ''
                return (
                  <div key={inv.id} className="flex items-center gap-3 py-3.5 border-b border-border last:border-0">
                    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold text-white overflow-hidden" style={{ backgroundColor: invAvatar ? undefined : '#FF2442' }}>{invAvatar ? <img src={invAvatar} alt="" className="w-full h-full object-cover" /> : (inv.nickname || inv.email).charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-text-primary truncate">{inv.nickname || inv.email}</p><p className="text-xs text-text-muted">{new Date(inv.createdAt).toLocaleString('zh-CN')}</p></div>
                  </div>
                )
              })}</div>
              {invitesTotal > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-text-muted">共 {invitesTotal} 条</span>
                  {Math.ceil(invitesTotal / PAGE_SIZE) > 1 && (
                  <div className="flex items-center gap-2">
                    <span onClick={() => invitesPage > 1 && loadInvitesPage(invitesPage - 1)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${invitesPage > 1 ? 'text-text-secondary hover:bg-surface-secondary' : 'text-text-muted pointer-events-none'}`}>上一页</span>
                    <span className="text-xs text-text-muted">{invitesPage} / {Math.ceil(invitesTotal / PAGE_SIZE)}</span>
                    <span onClick={() => invitesPage < Math.ceil(invitesTotal / PAGE_SIZE) && loadInvitesPage(invitesPage + 1)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${invitesPage < Math.ceil(invitesTotal / PAGE_SIZE) ? 'text-text-secondary hover:bg-surface-secondary' : 'text-text-muted pointer-events-none'}`}>下一页</span>
                  </div>
                  )}
                </div>
              )}
              </>
            )}
          </>
        )

      case 'security':
        return (
          <>
            <h3 className="text-base font-semibold text-text-primary mb-4">账号安全</h3>
            <div className="space-y-0">
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div><p className="text-sm font-medium text-text-primary">登录邮箱</p><p className="text-xs text-text-muted mt-0.5">{profile.email}</p></div>
                <span onClick={() => { setNewEmail(''); setEmailCode(''); setEmailError(''); setEmailOpen(true) }} className="text-sm text-primary hover:text-primary-dark cursor-pointer transition-colors">修改</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div><p className="text-sm font-medium text-text-primary">登录密码</p><p className="text-xs text-text-muted mt-0.5">{profile.hasPassword ? '已设置密码' : '未设置密码，当前使用验证码登录'}</p></div>
                <span onClick={() => { setPwOld(''); setPwNew(''); setPwConfirm(''); setPwError(''); setPwSuccess(''); setPwOpen(true) }} className="text-sm text-primary hover:text-primary-dark cursor-pointer transition-colors">{profile.hasPassword ? '修改' : '设置'}</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div><p className="text-sm font-medium text-text-primary">上次登录</p><p className="text-xs text-text-muted mt-0.5">{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString('zh-CN') : '首次登录'}</p></div>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div><p className="text-sm font-medium text-text-primary">注册时间</p><p className="text-xs text-text-muted mt-0.5">{new Date(profile.createdAt).toLocaleString('zh-CN')}</p></div>
              </div>
              <div className="flex items-center justify-between py-4">
                <div><p className="text-sm font-medium text-text-primary">账号状态</p></div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${profile.status === 1 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{profile.status === 1 ? '正常' : '已禁用'}</span>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="animate-page-in max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between py-5">
        <div><h1 className="text-lg font-semibold text-text-primary">个人中心</h1><p className="text-xs text-text-muted mt-0.5">管理你的账户信息和积分</p></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 左侧边栏 */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          {/* 用户卡片 */}
          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex flex-col items-center">
              <div className="relative group mb-3">
                <div className="w-20 h-20 rounded-full border-2 border-border overflow-hidden flex items-center justify-center" style={{ backgroundColor: avatarSrc ? undefined : '#FF2442' }}>
                  {avatarSrc ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-white">{(profile.nickname || profile.email).charAt(0).toUpperCase()}</span>}
                </div>
                <span onClick={() => fileRef.current?.click()} className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity" aria-label="更换头像"><Camera className="w-4 h-4 text-white" /></span>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="text-base font-semibold text-text-primary">{profile.nickname || '未设置昵称'}</h2>
                <span onClick={() => { setEditNickname(profile.nickname); setEditOpen(true) }} className="text-text-muted hover:text-primary cursor-pointer transition-colors"><ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
              <p className="text-xs text-text-muted mb-3">{profile.email}</p>
              {profile.subscription ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium"><Crown className="w-3.5 h-3.5" />{subscriptionLabels[profile.subscription.type] || profile.subscription.name}</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-secondary text-text-muted text-xs font-medium">免费用户</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
              <div className="text-center"><p className="text-lg font-bold text-primary">{profile.points}</p><p className="text-[11px] text-text-muted">积分余额</p></div>
              <div className="text-center"><p className="text-lg font-bold text-text-primary">{profile.consumedPoints}</p><p className="text-[11px] text-text-muted">已使用</p></div>
            </div>
          </div>

          {/* 导航 */}
          <div className="rounded-lg border border-border bg-white p-2 flex lg:flex-col gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {navItems.map(item => (
              <span key={item.key} onClick={() => setActiveNav(item.key)} className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg text-sm cursor-pointer transition-all whitespace-nowrap ${activeNav === item.key ? 'bg-primary/5 text-primary font-medium' : 'text-text-secondary hover:bg-surface-secondary'}`}>
                {item.icon}{item.label}
              </span>
            ))}
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 min-w-0 lg:min-h-[600px] rounded-2xl border border-border bg-white p-4 md:p-6">
          {renderContent()}
        </div>
      </div>

      {/* 编辑昵称弹窗 */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-lg w-[400px] max-w-[90vw] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-text-primary">编辑昵称</h3><span onClick={() => setEditOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors"><X className="w-4 h-4 text-text-muted" /></span></div>
            <div className="py-2"><label className="block text-sm text-text-secondary mb-1.5">昵称</label><input value={editNickname} onChange={e => setEditNickname(e.target.value)} placeholder="请输入昵称" maxLength={20} className="w-full h-10 px-3 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" /></div>
            <div className="flex justify-end gap-3 mt-6">
              <span onClick={() => setEditOpen(false)} className="h-9 px-4 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-secondary cursor-pointer transition-colors inline-flex items-center">取消</span>
              <span onClick={handleSaveProfile} className={`h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark cursor-pointer transition-colors inline-flex items-center ${saving ? 'opacity-60 pointer-events-none' : ''}`}>{saving ? '保存中...' : '保存'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 修改密码弹窗 */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPwOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-lg w-[400px] max-w-[90vw] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-text-primary">{profile.hasPassword ? '修改密码' : '设置密码'}</h3><span onClick={() => setPwOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors"><X className="w-4 h-4 text-text-muted" /></span></div>
            <div className="space-y-3">
              {profile.hasPassword && <div><label className="block text-sm text-text-secondary mb-1.5">当前密码</label><input type="password" value={pwOld} onChange={e => { setPwOld(e.target.value); setPwError('') }} placeholder="请输入当前密码" className="w-full h-10 px-3 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" /></div>}
              <div><label className="block text-sm text-text-secondary mb-1.5">新密码</label><input type="password" value={pwNew} onChange={e => { setPwNew(e.target.value); setPwError('') }} placeholder="至少6位" className="w-full h-10 px-3 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" /></div>
              <div><label className="block text-sm text-text-secondary mb-1.5">确认新密码</label><input type="password" value={pwConfirm} onChange={e => { setPwConfirm(e.target.value); setPwError('') }} placeholder="再次输入新密码" className="w-full h-10 px-3 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" /></div>
              {pwError && <p className="text-xs text-red-500">{pwError}</p>}
              {pwSuccess && <p className="text-xs text-green-600">{pwSuccess}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <span onClick={() => setPwOpen(false)} className="h-9 px-4 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-secondary cursor-pointer transition-colors inline-flex items-center">取消</span>
              <span onClick={handleChangePassword} className={`h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark cursor-pointer transition-colors inline-flex items-center ${pwSaving ? 'opacity-60 pointer-events-none' : ''}`}>{pwSaving ? '保存中...' : '确认'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 修改邮箱弹窗 */}
      {emailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEmailOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-lg w-[400px] max-w-[90vw] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-text-primary">修改邮箱</h3><span onClick={() => setEmailOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-colors"><X className="w-4 h-4 text-text-muted" /></span></div>
            <div className="space-y-3">
              <div><label className="block text-sm text-text-secondary mb-1.5">新邮箱</label><input value={newEmail} onChange={e => { setNewEmail(e.target.value); setEmailError('') }} placeholder="请输入新邮箱" className="w-full h-10 px-3 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" /></div>
              <div><label className="block text-sm text-text-secondary mb-1.5">验证码</label><div className="flex gap-2"><input value={emailCode} onChange={e => { setEmailCode(e.target.value); setEmailError('') }} placeholder="输入验证码" maxLength={6} className="flex-1 h-10 px-3 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" /><span onClick={handleSendEmailCode} className={`h-10 px-4 rounded-lg border border-border text-sm text-text-secondary hover:border-primary hover:text-primary cursor-pointer transition-colors inline-flex items-center shrink-0 ${emailCodeSending || !newEmail.trim() ? 'opacity-50 pointer-events-none' : ''}`}>{emailCodeSending ? '发送中...' : '发送验证码'}</span></div></div>
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <span onClick={() => setEmailOpen(false)} className="h-9 px-4 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-secondary cursor-pointer transition-colors inline-flex items-center">取消</span>
              <span onClick={handleChangeEmail} className={`h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark cursor-pointer transition-colors inline-flex items-center ${emailSaving || !newEmail.trim() || !emailCode.trim() ? 'opacity-60 pointer-events-none' : ''}`}>{emailSaving ? '保存中...' : '确认'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
