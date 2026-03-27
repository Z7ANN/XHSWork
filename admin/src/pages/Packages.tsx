import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, message, Space, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { packageApi, type Package } from '@/api'

const typeLabels: Record<string, string> = { trial: '体验包', monthly: '月付', yearly: '年付', topup: '积分充值' }

export const PackagesPage = () => {
  const [list, setList] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try { setList(await packageApi.list({ status: statusFilter })) } catch (e) { console.error(e) }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const openCreate = () => { form.resetFields(); setEditId(null); setOpen(true) }
  const openEdit = (pkg: Package) => {
    form.setFieldsValue({ ...pkg, featuresText: (pkg.features || []).join('\n') })
    setEditId(pkg.id)
    setOpen(true)
  }

  const save = async () => {
    const values = await form.validateFields()
    const data = { ...values, features: (values.featuresText || '').split('\n').map((s: string) => s.trim()).filter(Boolean) }
    delete data.featuresText
    try {
      if (editId) await packageApi.update(editId, data)
      else await packageApi.create(data)
      message.success(editId ? '更新成功' : '创建成功')
      setOpen(false)
      load()
    } catch (err: any) {
      message.error(err.message || '保存失败')
    }
  }

  const remove = async (id: number) => {
    Modal.confirm({
      title: '确定删除该套餐？',
      content: '已有订单关联的套餐无法删除，请改为下架。',
      onOk: async () => {
        try {
          await packageApi.remove(id)
          message.success('已删除')
          load()
        } catch (err: any) {
          message.error(err.message || '删除失败')
        }
      },
    })
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const { status } = await packageApi.toggleStatus(id)
      message.success(status === 1 ? '已上架' : '已下架')
      load()
    } catch { message.error('操作失败') }
  }

  const columns: ColumnsType<Package> = [
    { title: 'ID', dataIndex: 'id', width: 60, align: 'center' },
    {
      title: '名称', dataIndex: 'name', width: 180,
      render: (v, r) => <>{v}{r.badge && <Tag color="red" className="ml-1">{r.badge}</Tag>}</>,
    },
    { title: '类型', dataIndex: 'type', width: 90, render: (v) => typeLabels[v] || v },
    { title: '价格', dataIndex: 'price', width: 100, align: 'right', render: (v) => `¥${v}` },
    { title: '原价', dataIndex: 'originalPrice', width: 100, align: 'right', render: (v) => v > 0 ? `¥${v}` : '-' },
    { title: '积分', dataIndex: 'points', width: 90, align: 'right' },
    { title: 'VIP天数', dataIndex: 'vipDays', width: 80, align: 'center', render: (v) => v || '-' },
    { title: '并发数', dataIndex: 'imageConcurrency', width: 70, align: 'center', render: (v) => v || 1 },
    { title: '排序', dataIndex: 'sortOrder', width: 60, align: 'center' },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center',
      render: (v, r) => (
        <Switch
          checked={v === 1}
          checkedChildren="上架"
          unCheckedChildren="下架"
          onChange={() => handleToggleStatus(r.id)}
        />
      ),
    },
    {
      title: '操作', width: 90, align: 'center',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => remove(record.id)} />
        </Space>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Select
            placeholder="状态筛选"
            allowClear
            className="w-28"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ label: '上架', value: 1 }, { label: '下架', value: 0 }]}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增套餐</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={list} loading={loading} pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 个套餐` }} />
      </div>

      <Modal title={editId ? '编辑套餐' : '新增套餐'} open={open} onOk={save} onCancel={() => setOpen(false)} width={520} destroyOnHidden>
        <Form form={form} layout="vertical" initialValues={{ type: 'monthly', price: 0, originalPrice: 0, points: 0, vipDays: 0, imageConcurrency: 1, sortOrder: 0, status: 1 }}>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="类型" name="type">
              <Select options={[{ value: 'trial', label: '体验包' }, { value: 'monthly', label: '月付' }, { value: 'yearly', label: '年付' }, { value: 'topup', label: '积分充值' }]} />
            </Form.Item>
            <Form.Item label="售价 (¥)" name="price"><InputNumber className="!w-full" /></Form.Item>
            <Form.Item label="原价 (¥)" name="originalPrice"><InputNumber className="!w-full" /></Form.Item>
            <Form.Item label="赠送积分" name="points"><InputNumber className="!w-full" /></Form.Item>
            <Form.Item label="VIP天数" name="vipDays"><InputNumber className="!w-full" /></Form.Item>
            <Form.Item label="图片并发数" name="imageConcurrency"><InputNumber className="!w-full" min={1} /></Form.Item>
            <Form.Item label="角标文字" name="badge"><Input placeholder="如：新年促销" /></Form.Item>
            <Form.Item label="排序" name="sortOrder"><InputNumber className="!w-full" /></Form.Item>
            <Form.Item label="状态" name="status">
              <Select options={[{ value: 1, label: '上架' }, { value: 0, label: '下架' }]} />
            </Form.Item>
          </div>
          <Form.Item label="权益描述（每行一条）" name="featuresText">
            <Input.TextArea rows={5} placeholder="每行一条权益描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
