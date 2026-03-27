import { useState, useEffect, useCallback } from 'react'
import { Table, Tag, Select, Input, Modal, Button, DatePicker, Image, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { generationApi, type Generation } from '@/api'

const typeLabels: Record<string, { label: string; color: string }> = {
  oneclick: { label: '一键图文', color: 'magenta' },
  editor: { label: '笔记生成', color: 'blue' },
  cover: { label: '图片生成', color: 'purple' },
  viral: { label: '爆款复刻', color: 'orange' },
}

export const GenerationsPage = () => {
  const [list, setList] = useState<Generation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Generation | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const loadCategories = async () => {
    try {
      const data = await generationApi.stats()
      setCategories(data.categories)
    } catch (e) { console.error(e) }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await generationApi.list({
        page, pageSize: 20,
        type: type || undefined,
        keyword: keyword || undefined,
        category: category || undefined,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      })
      setList(res.list)
      setTotal(res.pagination.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, type, category, keyword, dateRange])

  useEffect(() => { loadCategories() }, [])
  useEffect(() => { load() }, [load])

  const handleSearch = (v: string) => { setKeyword(v); setPage(1) }

  const remove = (id: number) => {
    Modal.confirm({
      title: '确定删除该记录？',
      onOk: async () => {
        try { await generationApi.remove(id); message.success('已删除'); load() } catch (err: any) { message.error(err.message) }
      },
    })
  }

  const batchRemove = () => {
    if (!selectedIds.length) return message.warning('请先选择记录')
    Modal.confirm({
      title: `确定删除选中的 ${selectedIds.length} 条记录？`,
      onOk: async () => {
        try {
          await generationApi.batchRemove(selectedIds)
          message.success(`已删除 ${selectedIds.length} 条`)
          setSelectedIds([])
          load()
        } catch (err: any) { message.error(err.message) }
      },
    })
  }

  const exportCSV = () => {
    if (!list.length) return message.warning('暂无数据可导出')
    const headers = ['ID', '用户邮箱', '昵称', '类型', '分类', '标题', '主题', '图片数', '积分消耗', '创建时间']
    const rows = list.map(r => [
      r.id, r.email, r.nickname || '', typeLabels[r.type]?.label || r.type, r.category || '',
      `"${(r.title || '').replace(/"/g, '""')}"`, `"${(r.topic || '').replace(/"/g, '""')}"`,
      r.images?.length || 0, r.pointsCost, r.createdAt,
    ])
    const bom = '\uFEFF'
    const csv = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `生成记录_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: ColumnsType<Generation> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户', width: 160, render: (_, r) => (
      <div>
        <div className="text-sm">{r.nickname || '-'}</div>
        <div className="text-xs text-gray-400">{r.email}</div>
      </div>
    )},
    {
      title: '类型', dataIndex: 'type', width: 100,
      render: (v) => { const t = typeLabels[v]; return t ? <Tag color={t.color}>{t.label}</Tag> : v },
    },
    { title: '分类', dataIndex: 'category', width: 90, render: (v) => v || <span className="text-gray-300">-</span> },
    { title: '标题', dataIndex: 'title', ellipsis: true, render: (v) => v || <span className="text-gray-300">无标题</span> },
    { title: '主题', dataIndex: 'topic', width: 150, ellipsis: true, render: (v) => v || <span className="text-gray-300">-</span> },
    { title: '图片', width: 60, align: 'center', render: (_, r) => r.images?.length || 0 },
    { title: '积分', dataIndex: 'pointsCost', width: 60, align: 'center' },
    { title: '模型', dataIndex: 'model', width: 150, ellipsis: true, render: (v: string) => v ? <code className="text-xs">{v}</code> : <span className="text-gray-300">-</span> },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '操作', width: 90, align: 'center',
      render: (_, r) => (
        <div className="flex gap-1 justify-center">
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => setDetail(r)} />
          <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => remove(r.id)} />
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <Input.Search
          placeholder="搜索用户/标题"
          allowClear
          onSearch={handleSearch}
          onChange={(e) => { if (!e.target.value) handleSearch('') }}
          className="max-w-xs"
        />
        <Select
          value={type}
          onChange={(v) => { setType(v); setPage(1) }}
          options={[
            { value: '', label: '全部类型' },
            { value: 'oneclick', label: '一键图文' },
            { value: 'editor', label: '笔记生成' },
            { value: 'cover', label: '图片生成' },
            { value: 'viral', label: '爆款复刻' },
          ]}
          className="w-28"
        />
        <Select
          value={category}
          onChange={(v) => { setCategory(v); setPage(1) }}
          options={[
            { value: '', label: '全部分类' },
            ...categories.map(c => ({ value: c, label: c })),
          ]}
          className="w-28"
        />
        <DatePicker.RangePicker
          onChange={(v) => { setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null); setPage(1) }}
          placeholder={['开始日期', '结束日期']}
        />
        <div className="flex-1" />
        <Button icon={<DownloadOutlined />} onClick={exportCSV}>导出</Button>
        {selectedIds.length > 0 && (
          <Button danger icon={<DeleteOutlined />} onClick={batchRemove}>删除 ({selectedIds.length})</Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as number[]),
        }}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
      />
      </div>

      <Modal
        title="生成记录详情"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        {detail && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-2 flex-wrap">
              {typeLabels[detail.type] && <Tag color={typeLabels[detail.type].color}>{typeLabels[detail.type].label}</Tag>}
              {detail.category && <Tag>{detail.category}</Tag>}
              <span className="text-sm text-gray-600">{detail.nickname || '-'}</span>
              <span className="text-sm text-gray-400">({detail.email})</span>
              <span className="text-xs text-gray-400 ml-auto">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">积分消耗：<span className="text-purple-600 font-medium">{detail.pointsCost}</span></span>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">标题</div>
              <div className="text-sm font-medium">{detail.title || '无标题'}</div>
            </div>
            {detail.topic && (
              <div>
                <div className="text-xs text-gray-400 mb-1">主题</div>
                <div className="text-sm">{detail.topic}</div>
              </div>
            )}
            {detail.content && (
              <div>
                <div className="text-xs text-gray-400 mb-1">内容</div>
                <div className="text-sm whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">{detail.content}</div>
              </div>
            )}
            {detail.images?.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-1">图片 ({detail.images.length})</div>
                <Image.PreviewGroup>
                  <div className="flex flex-wrap gap-2">
                    {detail.images.map((img, i) => (
                      <Image key={i} src={img} alt={`图${i + 1}`} width={80} height={80} className="object-cover rounded-lg" />
                    ))}
                  </div>
                </Image.PreviewGroup>
              </div>
            )}
            {detail.tags?.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-1">标签</div>
                <div className="flex flex-wrap gap-1">
                  {detail.tags.map((tag) => <Tag key={tag}>#{tag}</Tag>)}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
