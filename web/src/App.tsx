import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ToastProvider } from '@/components/Toast'
import DashboardLayout from '@/layouts/DashboardLayout'

const Home = lazy(() => import('@/pages/Home'))
const Login = lazy(() => import('@/pages/Login'))
const OneClick = lazy(() => import('@/pages/OneClick'))
const Editor = lazy(() => import('@/pages/Editor'))
const Cover = lazy(() => import('@/pages/Cover'))
const Viral = lazy(() => import('@/pages/Viral'))
const Pricing = lazy(() => import('@/pages/Pricing'))
const User = lazy(() => import('@/pages/User'))
const History = lazy(() => import('@/pages/History'))
const Agreement = lazy(() => import('@/pages/Agreement'))
const Contact = lazy(() => import('@/pages/Contact'))
const Feedback = lazy(() => import('@/pages/Feedback'))
const Help = lazy(() => import('@/pages/Help'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const Tutorial = lazy(() => import('@/pages/Tutorial'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/agreement" element={<Agreement />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/help" element={<Help />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route element={<DashboardLayout />}>
              <Route path="/oneclick" element={<OneClick />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/cover" element={<Cover />} />
              <Route path="/viral" element={<Viral />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/user" element={<User />} />
              <Route path="/history" element={<History />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  )
}
