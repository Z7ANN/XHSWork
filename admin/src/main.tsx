import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import './index.css'
import App from './App'

dayjs.locale('zh-cn')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#FF2442',
          borderRadius: 8,
          fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
