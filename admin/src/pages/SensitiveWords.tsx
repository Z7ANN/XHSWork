import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Tag, Modal, Form, Input, Select, Switch, Space, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { sensitiveWordApi, type SensitiveWord } from '@/api'

const categoryLabels: Record<string, { label: string; color: string }> = {
  extreme: { label: '极限用语', color: 'red' },
  medical: { label: '医疗用语', color: 'orange' },
  cosmetic: { label: '化妆品禁用语', color: 'pink' },
  finance: { label: '金融用语', color: 'gold' },
  legal: { label: '法律风险词', color: 'purple' },
  vulgar: { label: '低俗用语', color: 'volcano' },
  other: { label: '其他', color: 'default' },
}

const categoryOptions = Object.entries(categoryLabels).map(([value, { label }]) => ({ value, label }))

export const SensitiveWordsPage = () => {
  const [list, setList] = useState<SensitiveWord[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterKeyword, setFilterKeyword] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterCategory) params.category = filterCategory
      if (filterKeyword) params.keyword = filterKeyword
      setList(await sensitiveWordApi.list(params))
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filterCategory, filterKeyword])

  useEffect(() => { load() }, [load])

  const openCreate = () => { form.resetFields(); setEditId(null); setOpen(true) }
  const openEdit = (w: SensitiveWord) => {
    form.setFieldsValue({ ...w, replacementsText: (w.replacements || []).join('\n') })
    setEditId(w.id)
    setOpen(true)
  }

  const save = async () => {
    const values = await form.validateFields()
    const data = {
      ...values,
      replacements: (values.replacementsText || '').split('\n').map((s: string) => s.trim()).filter(Boolean),
    }
    delete data.replacementsText
    try {
      if (editId) await sensitiveWordApi.update(editId, data)
      else await sensitiveWordApi.create(data)
      message.success(editId ? '更新成功' : '创建成功')
      setOpen(false)
      load()
    } catch (err: any) { message.error(err.message || '保存失败') }
  }

  const remove = (id: number) => {
    Modal.confirm({
      title: '确定删除？',
      onOk: async () => {
        try { await sensitiveWordApi.remove(id); message.success('已删除'); load() } catch (err: any) { message.error(err.message) }
      },
    })
  }

  const toggleStatus = async (w: SensitiveWord) => {
    try {
      await sensitiveWordApi.update(w.id, { status: w.status === 1 ? 0 : 1 })
      message.success(w.status === 1 ? '已禁用' : '已启用')
      load()
    } catch { message.error('操作失败') }
  }

  const columns: ColumnsType<SensitiveWord> = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: '违禁词', dataIndex: 'word', width: 120 },
    {
      title: '分类', dataIndex: 'category', width: 110,
      render: (v) => { const c = categoryLabels[v]; return c ? <Tag color={c.color}>{c.label}</Tag> : v },
    },
    {
      title: '替换词', dataIndex: 'replacements', width: 200,
      render: (v) => (v || []).map((r: string, i: number) => <Tag key={i} className="mb-1">{r}</Tag>),
    },
    {
      title: '状态', width: 80, align: 'center',
      render: (_, r) => <Switch checked={r.status === 1} checkedChildren="启用" unCheckedChildren="禁用" onChange={() => toggleStatus(r)} />,
    },
    {
      title: '操作', width: 90, align: 'center',
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => remove(r.id)} />
        </Space>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Select
              value={filterCategory || undefined}
              onChange={(v) => setFilterCategory(v || '')}
              placeholder="全部分类"
              allowClear
              className="w-36"
              options={categoryOptions}
            />
            <Input.Search
              placeholder="搜索违禁词"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              onSearch={load}
              className="w-48"
              allowClear
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增违禁词</Button>
        </div>
        <Table rowKey="id" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条` }} size="small" />
      </div>

      <Modal title={editId ? '编辑违禁词' : '新增违禁词'} open={open} onOk={save} onCancel={() => setOpen(false)} width={480} destroyOnHidden>
        <Form form={form} layout="vertical" initialValues={{ category: 'other', status: 1 }}>
          <Form.Item label="违禁词" name="word" rules={[{ required: true }]}><Input placeholder="输入违禁词" /></Form.Item>
          <Form.Item label="分类" name="category">
            <Select options={categoryOptions} />
          </Form.Item>
          <Form.Item label="替换词（每行一个）" name="replacementsText">
            <Input.TextArea rows={4} placeholder="每行一个替换词" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
