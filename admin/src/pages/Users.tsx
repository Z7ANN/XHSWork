import { useState, useEffect, useCallback } from 'react'
import { Table, Input, Tag, Button, message, Select, Modal, Descriptions, InputNumber, Popconfirm, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { userApi, type User, type UserDetail } from '@/api'

const TYPE_LABELS: Record<string, string> = { oneclick: '一键生成', editor: '编辑器', cover: '封面生成' }

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [vipFilter, setVipFilter] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const pageSize = 20

  const [detailVisible, setDetailVisible] = useState(false)
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [pointsModalVisible, setPointsModalVisible] = useState(false)
  const [pointsUserId, setPointsUserId] = useState(0)
  const [pointsAmount, setPointsAmount] = useState<number>(0)
  const [pointsRemark, setPointsRemark] = useState('')

  const [vipModalVisible, setVipModalVisible] = useState(false)
  const [vipUserId, setVipUserId] = useState(0)
  const [vipExpireAt, setVipExpireAt] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await userApi.list({ page, pageSize, keyword: keyword || undefined, status: statusFilter, vip: vipFilter })
      setUsers(data.list)
      setTotal(data.pagination.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, keyword, statusFilter, vipFilter])

  useEffect(() => { load() }, [load])

  const showDetail = async (id: number) => {
    setDetailVisible(true)
    setDetailLoading(true)
    try {
      const data = await userApi.detail(id)
      setDetailUser(data)
    } catch { message.error('获取详情失败') }
    setDetailLoading(false)
  }

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === 1 ? 0 : 1
    try {
      await userApi.updateStatus(user.id, newStatus)
      message.success(newStatus === 1 ? '已启用' : '已禁用')
      load()
    } catch { message.error('操作失败') }
  }

  const openPointsModal = (id: number) => {
    setPointsUserId(id)
    setPointsAmount(0)
    setPointsRemark('')
    setPointsModalVisible(true)
  }

  const submitAdjustPoints = async () => {
    if (!pointsAmount || pointsAmount === 0) return message.warning('积分数量不能为0')
    try {
      await userApi.adjustPoints(pointsUserId, pointsAmount, pointsRemark)
      message.success('积分调整成功')
      setPointsModalVisible(false)
      load()
    } catch { message.error('操作失败') }
  }

  const openVipModal = (id: number) => {
    setVipUserId(id)
    setVipExpireAt('')
    setVipModalVisible(true)
  }

  const submitAdjustVip = async () => {
    if (!vipExpireAt) return message.warning('请选择到期时间')
    try {
      await userApi.setVipExpireAt(vipUserId, vipExpireAt)
      message.success('VIP设置成功')
      setVipModalVisible(false)
      load()
    } catch { message.error('操作失败') }
  }

  const handleResetPassword = async (id: number) => {
    try {
      await userApi.resetPassword(id)
      message.success('密码已重置为 123456')
    } catch { message.error('操作失败') }
  }

  const formatDate = (v: string | null) => v ? new Date(v).toLocaleString() : '-'
  const isVip = (v: string | null) => v ? new Date(v) > new Date() : false

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    { title: '昵称', dataIndex: 'nickname', width: 90, render: (v) => v || '-' },
    { title: '积分', dataIndex: 'points', width: 65 },
    {
      title: 'VIP', width: 55,
      render: (_, r) => isVip(r.vipExpireAt)
        ? <Tag color="gold">VIP</Tag>
        : <Tag>普通</Tag>,
    },
    { title: '邀请', dataIndex: 'inviteCount', width: 55 },
    {
      title: '状态', dataIndex: 'status', width: 60,
      render: (v) => <Tag color={v === 1 ? 'green' : 'red'}>{v === 1 ? '正常' : '禁用'}</Tag>,
    },
    { title: '注册时间', dataIndex: 'createdAt', width: 95, render: (v) => new Date(v).toLocaleDateString() },
    { title: '注册IP', dataIndex: 'registerIp', width: 120, render: (v) => v || '-' },
    {
      title: '操作', width: 200, fixed: 'right',
      render: (_, record) => (
        <div className="flex gap-1 flex-wrap">
          <Button type="link" size="small" onClick={() => showDetail(record.id)}>详情</Button>
          <Button type="link" size="small" onClick={() => openPointsModal(record.id)}>积分</Button>
          <Button type="link" size="small" onClick={() => openVipModal(record.id)}>VIP</Button>
          <Popconfirm title="确认重置密码为 123456？" onConfirm={() => handleResetPassword(record.id)}>
            <Button type="link" size="small">重置密码</Button>
          </Popconfirm>
          <Button type="link" danger={record.status === 1} size="small" onClick={() => toggleStatus(record)}>
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <Input.Search
          placeholder="搜索邮箱/昵称/IP"
          allowClear
          onSearch={(v) => { setKeyword(v); setPage(1) }}
          onChange={(e) => { if (!e.target.value) { setKeyword(''); setPage(1) } }}
          className="max-w-xs"
        />
        <Select
          placeholder="状态筛选"
          allowClear
          className="w-28"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          options={[{ label: '正常', value: 1 }, { label: '禁用', value: 0 }]}
        />
        <Select
          placeholder="VIP筛选"
          allowClear
          className="w-28"
          value={vipFilter}
          onChange={(v) => { setVipFilter(v); setPage(1) }}
          options={[{ label: 'VIP', value: 1 }, { label: '普通', value: 0 }]}
        />
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{ current: page, pageSize, total, onChange: setPage, showSizeChanger: false, showTotal: (t) => `共 ${t} 位用户` }}
      />
      </div>

      {/* 用户详情弹窗 */}
      <Modal
        title="用户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
        loading={detailLoading}
      >
        {detailUser && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="ID">{detailUser.id}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{detailUser.email}</Descriptions.Item>
            <Descriptions.Item label="昵称">{detailUser.nickname || '-'}</Descriptions.Item>
            <Descriptions.Item label="角色">{detailUser.role === 'admin' ? '管理员' : '用户'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={detailUser.status === 1 ? 'green' : 'red'}>{detailUser.status === 1 ? '正常' : '禁用'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="积分">{detailUser.points}</Descriptions.Item>
            <Descriptions.Item label="VIP状态">
              {detailUser.isVip ? <Tag color="gold">VIP（到期：{formatDate(detailUser.vipExpireAt)}）</Tag> : <Tag>普通用户</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="邀请码">{detailUser.inviteCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="邀请人ID">{detailUser.invitedBy || '-'}</Descriptions.Item>
            <Descriptions.Item label="最后登录">{formatDate(detailUser.lastLoginAt)}</Descriptions.Item>
            <Descriptions.Item label="注册时间" span={2}>{formatDate(detailUser.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="生成统计" span={2}>
              {Object.entries(detailUser.stats).map(([type, count]) => (
                <Tag key={type}>{TYPE_LABELS[type] || type}: {count}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="邀请统计" span={2}>
              <Tag>邀请人数: {detailUser.inviteStats.inviteCount}</Tag>
              <Tag>付费人数: {detailUser.inviteStats.paidCount}</Tag>
              <Tag color="orange">邀请收益: {detailUser.inviteStats.totalEarned} 积分</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 积分调整弹窗 */}
      <Modal
        title="积分调整"
        open={pointsModalVisible}
        onCancel={() => setPointsModalVisible(false)}
        onOk={submitAdjustPoints}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">积分数量（正数增加，负数扣减）</label>
            <InputNumber value={pointsAmount} onChange={(v) => setPointsAmount(v || 0)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm mb-1">备注</label>
            <Input value={pointsRemark} onChange={(e) => setPointsRemark(e.target.value)} placeholder="调整原因" />
          </div>
        </div>
      </Modal>

      {/* VIP设置弹窗 */}
      <Modal
        title="设置VIP到期时间"
        open={vipModalVisible}
        onCancel={() => setVipModalVisible(false)}
        onOk={submitAdjustVip}
      >
        <div>
          <label className="block text-sm mb-1">到期时间（留空则取消VIP）</label>
          <DatePicker
            showTime
            className="w-full"
            onChange={(_, dateStr) => setVipExpireAt(dateStr as string)}
            placeholder="选择到期时间"
          />
        </div>
      </Modal>
    </div>
  )
}
