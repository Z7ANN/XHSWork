import { useState, useEffect, useCallback } from 'react'
import { Table, Tag, Input, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { pointLogApi, type PointLog } from '@/api'

const typeLabels: Record<string, { label: string; color: string }> = {
  purchase: { label: '购买充值', color: 'green' },
  consume: { label: '积分消费', color: 'red' },
  refund: { label: '失败退回', color: 'orange' },
  invite_reward: { label: '邀请奖励', color: 'blue' },
  admin_adjust: { label: '管理员调整', color: 'purple' },
}

const typeOptions = Object.entries(typeLabels).map(([value, { label }]) => ({ value, label }))

export const PointLogsPage = () => {
  const [list, setList] = useState<PointLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (filterType) params.type = filterType
      const res = await pointLogApi.list(params)
      setList(res.list)
      setTotal(res.pagination.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, keyword, filterType])

  useEffect(() => { load() }, [load])

  const columns: ColumnsType<PointLog> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '用户', width: 180,
      render: (_, r) => (
        <div>
          <div className="text-sm text-gray-800">{r.nickname || '-'}</div>
          <div className="text-xs text-gray-400">{r.email}</div>
        </div>
      ),
    },
    {
      title: '变动', dataIndex: 'amount', width: 90, align: 'center',
      render: (v) => <span className={`font-semibold ${v > 0 ? 'text-green-600' : 'text-red-500'}`}>{v > 0 ? `+${v}` : v}</span>,
    },
    {
      title: '类型', dataIndex: 'type', width: 110,
      render: (v) => { const t = typeLabels[v]; return t ? <Tag color={t.color}>{t.label}</Tag> : v },
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '时间', dataIndex: 'createdAt', width: 170,
      render: (v) => new Date(v).toLocaleString('zh-CN'),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Select
            value={filterType || undefined}
            onChange={(v) => { setFilterType(v || ''); setPage(1) }}
            placeholder="全部类型"
            allowClear
            className="w-36"
            options={typeOptions}
          />
          <Input.Search
            placeholder="搜索用户/备注"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => { setPage(1); load() }}
            className="w-56"
            allowClear
          />
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          size="small"
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </div>
    </div>
  )
}
