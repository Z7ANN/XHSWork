import { Outlet, useNavigate } from 'react-router-dom'
import { Layout as AntLayout, Menu, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  CreditCardOutlined,
  SettingOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  BellOutlined,
  GiftOutlined,
  FileTextOutlined,
  RobotOutlined,
  StopOutlined,
  AccountBookOutlined,
} from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const { Sider, Header, Content } = AntLayout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/models', icon: <RobotOutlined />, label: '模型管理' },
  { key: '/packages', icon: <CreditCardOutlined />, label: '套餐管理' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
  { key: '/redeems', icon: <GiftOutlined />, label: '兑换码管理' },
  { key: '/generations', icon: <FileTextOutlined />, label: '生成记录' },
  { key: '/sensitive-words', icon: <StopOutlined />, label: '违禁词管理' },
  { key: '/point-logs', icon: <AccountBookOutlined />, label: '积分记录' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
]

export const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [admin, setAdmin] = useState<{ nickname?: string; email?: string } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_user')
      if (stored) setAdmin(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/login', { replace: true })
  }

  const pageTitle: Record<string, string> = {
    '/': '数据看板',
    '/users': '用户管理',
    '/packages': '套餐管理',
    '/orders': '订单管理',
    '/redeems': '兑换码管理',
    '/generations': '生成记录',
    '/sensitive-words': '违禁词管理',
    '/point-logs': '积分记录',
    '/models': '模型管理',
    '/settings': '系统设置',
  }

  return (
    <AntLayout className="h-screen">
      <Sider width={200} theme="dark" className="!bg-sidebar">
        <div className="h-full flex flex-col">
          <div className="h-14 flex items-center px-5 border-b border-white/10 shrink-0">
            <span className="text-white font-semibold text-lg">管理后台</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              className="!bg-sidebar !border-none [&_.ant-menu-item-selected]:!bg-sidebar-active"
            />
          </div>
        </div>
      </Sider>
      <AntLayout>
        <Header className="!bg-white !px-6 h-14 flex items-center justify-between border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">{pageTitle[location.pathname] || ''}</h1>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
              <BellOutlined className="text-lg" />
            </button>
            <Dropdown
              menu={{
                items: [
                  { key: 'settings', icon: <SettingOutlined />, label: '系统设置', onClick: () => navigate('/settings') },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
                ],
              }}
              placement="bottomRight"
            >
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar size={32} style={{ backgroundColor: '#FF2442' }}>
                  {(admin?.nickname || admin?.email || 'A').charAt(0).toUpperCase()}
                </Avatar>
                <span className="text-sm text-gray-700">{admin?.nickname || admin?.email || '管理员'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="bg-gray-50 overflow-auto">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
