import { useState, useEffect, useCallback, useRef } from 'react'
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, Switch, Space, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { Camera } from 'lucide-react'
import { aiModelApi, type AiModel } from '@/api'

const API_BASE = import.meta.env.DEV ? 'http://localhost:3200' : ''

const typeLabels: Record<string, { label: string; color: string }> = {
  text: { label: '文本', color: 'blue' },
  image: { label: '图片', color: 'purple' },
}

const tierLabels: Record<string, { label: string; color: string }> = {
  all: { label: '不限', color: 'default' },
  trial: { label: '体验包', color: 'cyan' },
  monthly: { label: '月付', color: 'blue' },
  yearly: { label: '年付', color: 'gold' },
}

const PRESET_ICONS = [
  { key: 'doubao', label: '豆包' },
  { key: 'deepseek', label: 'DeepSeek' },
  { key: 'qwen', label: '通义千问' },
  { key: 'zhipu', label: '智谱' },
  { key: 'chatglm', label: 'ChatGLM' },
  { key: 'minimax', label: 'MiniMax' },
  { key: 'hunyuan', label: '混元' },
  { key: 'kling', label: '可灵' },
  { key: 'openai', label: 'OpenAI' },
  { key: 'claude', label: 'Claude' },
  { key: 'gemini', label: 'Gemini' },
  { key: 'grok', label: 'Grok' },
  { key: 'midjourney', label: 'Midjourney' },
  { key: 'google', label: 'Google' },
  { key: 'qingyan', label: '青言' },
]

function getIconSrc(icon: string) {
  if (!icon) return ''
  if (icon.startsWith('/api/')) return `${API_BASE}${icon}`
  return `${import.meta.env.BASE_URL}model-icons/${icon}.svg`
}

function ModelIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const src = getIconSrc(icon)
  if (!src) return <div className="rounded-full bg-gray-100 shrink-0" style={{ width: size, height: size }} />
  return <img src={src} alt="" className="rounded-full object-contain shrink-0" style={{ width: size, height: size }} />
}

function IconPickerField({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  const [popOpen, setPopOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!popOpen) return
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setPopOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popOpen])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('icon', file)
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch(`${API_BASE}/api/admin/ai-models/upload-icon`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const json = await res.json()
      if (!json.success) { message.error(json.error?.message || '上传失败'); return }
      onChange?.(json.data.url)
      setPopOpen(false)
    } catch { message.error('上传失败') }
    finally { setUploading(false) }
  }

  const iconSrc = getIconSrc(value || '')

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 大圆形预览 */}
      <div className="relative">
        <div
          onClick={() => setPopOpen(!popOpen)}
          className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
        >
          {iconSrc ? (
            <img src={iconSrc} alt="" className="w-12 h-12 object-contain" />
          ) : (
            <span className="text-3xl text-gray-300 font-light">?</span>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
          <Camera className="w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Popover */}
        {popOpen && (
          <div ref={popRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-72">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_ICONS.map(p => (
                <div
                  key={p.key}
                  onClick={() => { onChange?.(p.key); setPopOpen(false) }}
                  className={`w-11 h-11 rounded-lg flex items-center justify-center cursor-pointer transition-all border-2 ${value === p.key ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                  title={p.label}
                >
                  <img src={`${import.meta.env.BASE_URL}model-icons/${p.key}.svg`} alt={p.label} className="w-6 h-6" />
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full h-8 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors flex items-center justify-center gap-1"
            >
              {uploading ? '上传中...' : '上传自定义图标'}
            </button>
          </div>
        )}
      </div>
      <span className="text-xs text-gray-400">点击选择图标</span>
    </div>
  )
}

export const ModelsPage = () => {
  const [list, setList] = useState<AiModel[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try { setList(await aiModelApi.list()) } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { form.resetFields(); setEditId(null); setOpen(true) }
  const openEdit = (m: AiModel) => { form.setFieldsValue({ ...m, supportThinking: m.supportThinking === 1 }); setEditId(m.id); setOpen(true) }

  const save = async () => {
    const values = await form.validateFields()
    values.supportThinking = values.supportThinking ? 1 : 0
    try {
      if (editId) await aiModelApi.update(editId, values)
      else await aiModelApi.create(values)
      message.success(editId ? '更新成功' : '创建成功')
      setOpen(false)
      load()
    } catch (err: any) { message.error(err.message || '保存失败') }
  }

  const remove = (id: number) => {
    Modal.confirm({
      title: '确定删除该模型？',
      onOk: async () => {
        try { await aiModelApi.remove(id); message.success('已删除'); load() } catch (err: any) { message.error(err.message) }
      },
    })
  }

  const toggleStatus = async (m: AiModel) => {
    try {
      await aiModelApi.update(m.id, { status: m.status === 1 ? 0 : 1 })
      message.success(m.status === 1 ? '已禁用' : '已启用')
      load()
    } catch { message.error('操作失败') }
  }

  const columns: ColumnsType<AiModel> = [
    { title: 'ID', dataIndex: 'id', width: 50, align: 'center' },
    {
      title: '名称', dataIndex: 'name', width: 200,
      render: (v, r) => (
        <div className="flex items-center gap-2">
          <ModelIcon icon={r.icon} size={22} />
          <span className="truncate">{v}</span>
        </div>
      ),
    },
    {
      title: '类型', dataIndex: 'type', width: 70, align: 'center',
      render: (v) => { const t = typeLabels[v]; return t ? <Tag color={t.color}>{t.label}</Tag> : v },
    },
    {
      title: '等级', dataIndex: 'tier', width: 70, align: 'center',
      render: (v) => { const t = tierLabels[v]; return t ? <Tag color={t.color}>{t.label}</Tag> : v },
    },
    { title: '模型标识', dataIndex: 'model', ellipsis: true, render: (v) => <code className="text-sm">{v}</code> },
    { title: '积分/次', dataIndex: 'pointsCost', width: 100, align: 'center' },
    { title: 'API 地址', dataIndex: 'baseUrl', width: 540, ellipsis: true },
    {
      title: '状态', width: 80, align: 'center',
      render: (_, r) => <Switch checked={r.status === 1} checkedChildren="启用" unCheckedChildren="禁用" onChange={() => toggleStatus(r)} />,
    },
    {
      title: '操作', width: 80, align: 'center',
      render: (_, r) => (
        <Space size={0}>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => remove(r.id)} />
        </Space>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-500">同类型的模型之间自动轮询，按套餐类型匹配模型等级，「不限」对所有用户生效</div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增模型</Button>
        </div>
        <Table rowKey="id" columns={columns} dataSource={list} loading={loading} pagination={false} />
      </div>

      <Modal title={editId ? '编辑模型' : '新增模型'} open={open} onOk={save} onCancel={() => setOpen(false)} width={560} destroyOnHidden>
        <Form form={form} layout="vertical" initialValues={{ type: 'text', tier: 'all', pointsCost: 10, supportThinking: false, thinkingPointsCost: 0, status: 1 }}>
          <Form.Item name="icon"><IconPickerField /></Form.Item>
          <Form.Item label="名称" name="name" rules={[{ required: true }]}><Input placeholder="如：豆包文本-普通" /></Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="类型" name="type" rules={[{ required: true }]}>
              <Select options={[{ value: 'text', label: '文本模型' }, { value: 'image', label: '图片模型' }]} />
            </Form.Item>
            <Form.Item label="等级" name="tier">
              <Select options={[{ value: 'all', label: '不限（所有用户）' }, { value: 'trial', label: '体验包' }, { value: 'monthly', label: '月付' }, { value: 'yearly', label: '年付' }]} />
            </Form.Item>
          </div>
          <Form.Item label="API 地址" name="baseUrl" rules={[{ required: true }]}><Input placeholder="https://ark.cn-beijing.volces.com/api/v3" /></Form.Item>
          <Form.Item label="API Key" name="apiKey" rules={[{ required: true }]}><Input.Password placeholder="API Key" /></Form.Item>
          <Form.Item label="模型标识" name="model" rules={[{ required: true }]}><Input placeholder="如：doubao-seed-2-0-lite-260215" /></Form.Item>
          <Form.Item label="每次消耗积分" name="pointsCost"><InputNumber className="!w-full" min={0} placeholder="10" /></Form.Item>
          <Form.Item label="支持深度思考" name="supportThinking" valuePropName="checked">
            <Switch checkedChildren="支持" unCheckedChildren="不支持" />
          </Form.Item>
          <Form.Item label="深度思考额外积分" name="thinkingPointsCost"><InputNumber className="!w-full" min={0} placeholder="0" /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
