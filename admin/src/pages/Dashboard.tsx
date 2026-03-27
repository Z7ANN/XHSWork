import { useState, useEffect } from 'react'
import { Card, Statistic, Spin, Row, Col, Progress } from 'antd'
import {
  UserOutlined, RiseOutlined, FileTextOutlined,
  DollarOutlined, ShoppingCartOutlined, GiftOutlined,
  ThunderboltOutlined, CreditCardOutlined,
} from '@ant-design/icons'
import { dashboardApi, type DashboardStats } from '@/api'

const TYPE_LABELS: Record<string, string> = {
  oneclick: '一键生成',
  editor: '编辑器',
  cover: '封面生成',
  viral: '爆款复刻',
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.stats().then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 flex justify-center"><Spin size="large" /></div>
  if (!stats) return <div className="p-8 text-red-500">加载失败</div>

  const byTypeEntries = Object.entries(stats.generations.byType)
  const todayByTypeEntries = Object.entries(stats.generations.todayByType)
  const maxCount = byTypeEntries.length > 0 ? Math.max(...byTypeEntries.map(([, c]) => c)) : 1
  const todayMax = todayByTypeEntries.length > 0 ? Math.max(...todayByTypeEntries.map(([, c]) => c)) : 1

  return (
    <div className="p-8 space-y-6">
      {/* 用户 & 收入 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="用户总数" value={stats.users.total} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="今日新增用户" value={stats.users.today} prefix={<RiseOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="总收入" value={stats.orders.totalRevenue} prefix={<DollarOutlined />} precision={2} suffix="元" valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="今日收入" value={stats.orders.todayRevenue} prefix={<DollarOutlined />} precision={2} suffix="元" valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
      </Row>

      {/* 生成 & 订单 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="生成总数" value={stats.generations.total} prefix={<FileTextOutlined />} valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日生成"
              value={todayByTypeEntries.reduce((s, [, c]) => s + c, 0)}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="订单总数" value={stats.orders.totalOrders} prefix={<ShoppingCartOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="今日订单" value={stats.orders.todayOrders} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      {/* 积分 & 兑换码 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="积分总充值" value={stats.points.totalAdded} prefix={<CreditCardOutlined />} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="积分总消耗" value={stats.points.totalConsumed} prefix={<CreditCardOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="兑换码总数" value={stats.redeems.total} prefix={<GiftOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="已使用兑换码" value={stats.redeems.used} prefix={<GiftOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="生成次数统计（总计）">
            {byTypeEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {byTypeEntries.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-20">{TYPE_LABELS[type] || type}</span>
                    <Progress percent={Math.round((count / maxCount) * 100)} format={() => `${count} 次`} className="flex-1" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="今日生成统计">
            {todayByTypeEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {todayByTypeEntries.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-20">{TYPE_LABELS[type] || type}</span>
                    <Progress percent={Math.round((count / todayMax) * 100)} format={() => `${count} 次`} className="flex-1" strokeColor="#722ed1" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
