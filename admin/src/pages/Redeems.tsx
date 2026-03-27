import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Tag, Modal, Form, InputNumber, Input, Select, DatePicker, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { redeemApi, packageApi, type RedeemCode, type Package } from '@/api'

export const RedeemsPage = () => {
  const [list, setList] = useState<RedeemCode[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [mode, setMode] = useState<'package' | 'custom'>('package')
  const [form] = Form.useForm()
  const [createdCodes, setCreatedCodes] = useState<{ id: number; code: string }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await redeemApi.list({ page, pageSize: 20, status: status || undefined, keyword: keyword || undefined })
      setList(res.list)
      setTotal(res.pagination.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, status, keyword])

  useEffect(() => { load() }, [load])

  const loadPackages = async () => {
    try { setPackages(await packageApi.list()) } catch { /* ignore */ }
  }

  const openCreate = () => {
    form.resetFields()
    setMode('package')
    loadPackages()
    setOpen(true)
  }

  const save = async () => {
    const values = await form.validateFields()
    setCreating(true)
    try {
      const payload: Record<string, unknown> = {
        remark: values.remark || '',
        count: values.count || 1,
        expireAt: values.expireAt?.format('YYYY-MM-DD HH:mm:ss') || undefined,
      }
      if (mode === 'package') {
        payload.packageId = values.packageId
      } else {
        payload.points = values.points || 0
        payload.vipDays = values.vipDays || 0
      }
      const codes = await redeemApi.create(payload as any)
      setCreatedCodes(codes)
      setOpen(false)
      load()
    } catch (err: any) {
      message.error(err.message || '创建失败')
    }
    setCreating(false)
  }

  const remove = (id: number) => {
    Modal.confirm({
      title: '确定删除该兑换码？',
      content: '仅可删除未使用的兑换码',
      onOk: async () => {
        try { await redeemApi.remove(id); message.success('已删除'); load() } catch (err: any) { message.error(err.message) }
      },
    })
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    message.success('已复制')
  }

  const copyAllCodes = () => {
    const text = createdCodes.map(c => c.code).join('\n')
    navigator.clipboard.writeText(text)
    message.success(`已复制 ${createdCodes.length} 个兑换码`)
  }

  const getStatus = (r: RedeemCode) => {
    if (r.usedBy) return { text: '已使用', color: 'red' }
    if (r.expireAt && new Date(r.expireAt) < new Date()) return { text: '已过期', color: 'orange' }
    return { text: '未使用', color: 'green' }
  }

  const columns: ColumnsType<RedeemCode> = [
    {
      title: '兑换码', dataIndex: 'code', width: 220,
      render: (v) => (
        <div className="flex items-center gap-1">
          <code className="text-sm">{v}</code>
          <CopyOutlined className="text-gray-400 cursor-pointer hover:text-primary" onClick={() => copyCode(v)} />
        </div>
      ),
    },
    { title: '套餐', dataIndex: 'packageName', width: 120, render: (v) => v || '-' },
    { title: '积分', dataIndex: 'points', width: 70, align: 'right' },
    { title: 'VIP天数', dataIndex: 'vipDays', width: 80, align: 'center', render: (v) => v || '-' },
    {
      title: '状态', width: 80, align: 'center',
      render: (_, r) => { const s = getStatus(r); return <Tag color={s.color}>{s.text}</Tag> },
    },
    { title: '使用者', dataIndex: 'usedByEmail', width: 160, render: (v) => v || '-' },
    { title: '使用时间', dataIndex: 'usedAt', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-' },
    { title: '过期时间', dataIndex: 'expireAt', width: 160, render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '永不过期' },
    { title: '备注', dataIndex: 'remark', width: 120, render: (v) => v || '-' },
    {
      title: '操作', width: 70, align: 'center',
      render: (_, r) => !r.usedBy && (
        <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => remove(r.id)} />
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Input.Search
            placeholder="兑换码/备注/使用者"
            allowClear
            onSearch={(v) => { setKeyword(v); setPage(1) }}
            onChange={(e) => { if (!e.target.value) { setKeyword(''); setPage(1) } }}
            className="max-w-xs"
          />
          <Select
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
            options={[
              { value: '', label: '全部状态' },
              { value: 'unused', label: '未使用' },
              { value: 'used', label: '已使用' },
              { value: 'expired', label: '已过期' },
            ]}
            className="!w-28"
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建兑换码</Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
      />
      </div>

      {/* 创建弹窗 */}
      <Modal title="创建兑换码" open={open} onOk={save} onCancel={() => setOpen(false)} confirmLoading={creating} width={480} destroyOnHidden>
        <div className="mb-4">
          <span className="mr-2">创建方式：</span>
          <Select value={mode} onChange={(v) => { setMode(v); form.resetFields() }} options={[
            { value: 'package', label: '按套餐' },
            { value: 'custom', label: '自定义' },
          ]} className="!w-28" />
        </div>
        <Form form={form} layout="vertical" initialValues={{ count: 1, points: 0, vipDays: 0 }}>
          {mode === 'package' ? (
            <Form.Item label="选择套餐" name="packageId" rules={[{ required: true, message: '请选择套餐' }]}>
              <Select placeholder="选择套餐" options={packages.map((p) => ({ value: p.id, label: `${p.name} (${p.points}积分${p.vipDays ? ` + ${p.vipDays}天VIP` : ''})` }))} />
            </Form.Item>
          ) : (
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item label="积分" name="points"><InputNumber className="!w-full" min={0} /></Form.Item>
              <Form.Item label="VIP天数" name="vipDays"><InputNumber className="!w-full" min={0} /></Form.Item>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="生成数量" name="count"><InputNumber className="!w-full" min={1} max={100} /></Form.Item>
            <Form.Item label="过期时间" name="expireAt"><DatePicker showTime className="!w-full" /></Form.Item>
          </div>
          <Form.Item label="备注" name="remark"><Input placeholder="可选备注" /></Form.Item>
        </Form>
      </Modal>

      {/* 创建成功展示 */}
      <Modal
        title={`成功创建 ${createdCodes.length} 个兑换码`}
        open={createdCodes.length > 0}
        onCancel={() => setCreatedCodes([])}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={copyAllCodes}>复制全部</Button>,
          <Button key="close" onClick={() => setCreatedCodes([])}>关闭</Button>,
        ]}
        width={400}
      >
        <div className="max-h-60 overflow-y-auto space-y-2">
          {createdCodes.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
              <code className="text-sm">{c.code}</code>
              <CopyOutlined className="text-gray-400 cursor-pointer hover:text-primary" onClick={() => copyCode(c.code)} />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
