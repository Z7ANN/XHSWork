import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from '@/components/AuthGuard'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/pages/Login'
import { DashboardPage } from '@/pages/Dashboard'
import { UsersPage } from '@/pages/Users'
import { PackagesPage } from '@/pages/Packages'
import { OrdersPage } from '@/pages/Orders'
import { SettingsPage } from '@/pages/Settings'
import { RedeemsPage } from '@/pages/Redeems'
import { ModelsPage } from '@/pages/Models'
import { GenerationsPage } from '@/pages/Generations'
import { SensitiveWordsPage } from '@/pages/SensitiveWords'
import { PointLogsPage } from '@/pages/PointLogs'

const App = () => (
  <BrowserRouter basename="/admin">
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="redeems" element={<RedeemsPage />} />
          <Route path="generations" element={<GenerationsPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="sensitive-words" element={<SensitiveWordsPage />} />
          <Route path="point-logs" element={<PointLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
)

export default App
