import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'

export default function FeedbackPage() {
  const [type, setType] = useState('suggestion')
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!content.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors mb-6"><ArrowLeft className="w-4 h-4" />返回首页</Link>
        <h1 className="text-2xl font-bold text-text-primary mb-6">反馈建议</h1>
        <div className="rounded-2xl border border-border bg-white p-6">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4"><Send className="w-6 h-6 text-green-500" /></div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">感谢你的反馈</h3>
              <p className="text-sm text-text-muted">我们会认真阅读每一条反馈，持续改进产品体验。</p>
              <span onClick={() => { setSubmitted(false); setContent(''); setContact('') }} className="inline-flex items-center mt-4 text-sm text-primary hover:text-primary-dark cursor-pointer transition-colors">继续反馈</span>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">反馈类型</label>
                <div className="flex gap-2">
                  {[{ value: 'suggestion', label: '功能建议' }, { value: 'bug', label: '问题反馈' }, { value: 'other', label: '其他' }].map(t => (
                    <span key={t.value} onClick={() => setType(t.value)} className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors ${type === t.value ? 'bg-primary/10 text-primary font-medium' : 'bg-surface-secondary text-text-secondary hover:text-text-primary'}`}>{t.label}</span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">详细描述</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="请详细描述你的建议或遇到的问题..." rows={6} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">联系方式（选填）</label>
                <input value={contact} onChange={e => setContact(e.target.value)} placeholder="邮箱或微信，方便我们回复你" className="w-full h-10 px-3 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
              </div>
              <button onClick={handleSubmit} disabled={!content.trim()} className="h-10 px-6 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors flex items-center gap-1.5"><Send className="w-4 h-4" />提交反馈</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
