import { useState, useEffect, useCallback } from 'react'
import { Table, Tag, Input, Select, DatePicker, Modal, Descriptions, Popconfirm, Button, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { orderApi, type Order } from '@/api'

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待支付', color: 'orange' },
  1: { text: '已支付', color: 'green' },
  2: { text: '已取消', color: 'default' },
  3: { text: '已退款', color: 'red' },
}

const payMethodLabels: Record<string, string> = { wechat: '微信', alipay: '支付宝' }

export const OrdersPage = () => {
  const [list, setList] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [keyword, setKeyword] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [detail, setDetail] = useState<Order | null>(null)
  const pageSize = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await orderApi.list({
        page, pageSize,
        status: statusFilter,
        keyword: keyword || undefined,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      })
      setList(data.list)
      setTotal(data.pagination.total)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, statusFilter, keyword, dateRange])

  useEffect(() => { load() }, [load])

  const handleCancel = async (orderNo: string) => {
    try {
      await orderApi.cancel(orderNo)
      message.success('已取消')
      load()
    } catch (err: any) { message.error(err.message || '操作失败') }
  }

  const handleComplete = async (orderNo: string) => {
    try {
      await orderApi.complete(orderNo)
      message.success('已完成')
      load()
    } catch (err: any) { message.error(err.message || '操作失败') }
  }

  const columns: ColumnsType<Order> = [
    { title: '订单号', dataIndex: 'orderNo', width: 200, render: (v) => <span className="font-mono text-sm">{v}</span> },
    {
      title: '用户', width: 180,
      render: (_, r) => <div><div className="text-sm">{r.nickname || '-'}</div><div className="text-xs text-gray-400">{r.email}</div></div>,
    },
    { title: '套餐', dataIndex: 'packageName', width: 120 },
    { title: '金额', dataIndex: 'amount', width: 100, align: 'right', render: (v) => `¥${v}` },
    { title: '支付方式', dataIndex: 'payMethod', width: 90, align: 'center', render: (v) => payMethodLabels[v] || v },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center',
      render: (v) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || '未知'}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '操作', width: 160,
      render: (_, r) => (
        <div className="flex gap-1 flex-wrap">
          <Button type="link" size="small" onClick={() => setDetail(r)}>详情</Button>
          {r.status === 0 && (
            <>
              <Popconfirm title="确认完成该订单？将发放积分和VIP。" onConfirm={() => handleComplete(r.orderNo)}>
                <Button type="link" size="small">完成</Button>
              </Popconfirm>
              <Popconfirm title="确认取消该订单？" onConfirm={() => handleCancel(r.orderNo)}>
                <Button type="link" danger size="small">取消</Button>
              </Popconfirm>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <Input.Search
          placeholder="订单号/邮箱/昵称"
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
          options={[
            { label: '待支付', value: 0 },
            { label: '已支付', value: 1 },
            { label: '已取消', value: 2 },
            { label: '已退款', value: 3 },
          ]}
        />
        <DatePicker.RangePicker
          onChange={(v) => { setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null); setPage(1) }}
          placeholder={['开始日期', '结束日期']}
        />
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage, showSizeChanger: false, showTotal: (t) => `共 ${t} 条` }}
      />
      </div>

      <Modal title="订单详情" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={600}>
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="订单号"><span className="font-mono">{detail.orderNo}</span></Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text}</Tag></Descriptions.Item>
            <Descriptions.Item label="用户">{detail.nickname || '-'} ({detail.email})</Descriptions.Item>
            <Descriptions.Item label="套餐">{detail.packageName}</Descriptions.Item>
            <Descriptions.Item label="支付金额">¥{detail.amount}</Descriptions.Item>
            <Descriptions.Item label="支付方式">{payMethodLabels[detail.payMethod] || detail.payMethod}</Descriptions.Item>
            <Descriptions.Item label="到账积分">{detail.pointsGranted}</Descriptions.Item>
            <Descriptions.Item label="到账VIP">{detail.vipDaysGranted > 0 ? `${detail.vipDaysGranted} 天` : '-'}</Descriptions.Item>
            <Descriptions.Item label="支付流水号"><span className="font-mono">{detail.payTradeNo || '-'}</span></Descriptions.Item>
            <Descriptions.Item label="支付时间">{detail.paidAt ? dayjs(detail.paidAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="过期时间">{dayjs(detail.expireAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
