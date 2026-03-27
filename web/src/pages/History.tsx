

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Trash2, ExternalLink, Zap, PenLine, Image as ImageIcon, Sparkles, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { editorApi, type GenerationRecord } from '@/api'
import { toast } from '@/components/Toast'

const typeConfig: Record<string, { label: string; icon: React.ReactNode; gradient: string }> = {
  oneclick: { label: '一键图文', icon: <Zap className="w-3 h-3" />, gradient: 'from-rose-500 to-pink-400' },
  editor: { label: '笔记生成', icon: <PenLine className="w-3 h-3" />, gradient: 'from-rose-400 to-red-400' },
  cover: { label: '图片生成', icon: <ImageIcon className="w-3 h-3" />, gradient: 'from-pink-400 to-rose-500' },
}

const typeRouteMap: Record<string, string> = {
  oneclick: '/oneclick',
  editor: '/editor',
  cover: '/cover',
}

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'oneclick', label: '一键图文' },
  { key: 'editor', label: '笔记生成' },
  { key: 'cover', label: '图片生成' },
]

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return d.toLocaleDateString('zh-CN')
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<GenerationRecord[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [detail, setDetail] = useState<GenerationRecord | null>(null)
  const pageSize = 20

  const fetchList = useCallback(async (p: number, type?: string) => {
    setLoading(true)
    try {
      const res = await editorApi.history(p, type === 'all' ? undefined : type)
      setList(res.list)
      setTotal(res.pagination.total)
      setPage(p)
    } catch (err: any) {
      toast.error(err.message || '获取历史记录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList(1, activeTab)
  }, [activeTab, fetchList])

  const handleDelete = async (id: number) => {
    try {
      await editorApi.historyDelete(id)
      toast.success('已删除')
      if (detail?.id === id) setDetail(null)
      fetchList(page, activeTab)
    } catch (err: any) {
      toast.error(err.message || '删除失败')
    }
  }

  const handleLoadToEditor = (record: GenerationRecord) => {
    const route = typeRouteMap[record.type] || '/editor'
    navigate(`${route}?historyId=${record.id}`)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="animate-page-in max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8 min-h-[calc(100dvh-4rem)]">
      <div className="flex items-center justify-between py-5">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">历史记录</h1>
          <p className="text-xs text-text-muted mt-0.5">共 {total} 条创作记录</p>
        </div>
        <div className="flex items-center bg-surface-secondary rounded-lg p-0.5">
          {tabs.map(tab => (
            <span
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1) }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-all ${
                activeTab === tab.key ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {list.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-text-muted/40" />
            </div>
            <p className="text-sm text-text-muted">暂无创作记录</p>
            <p className="text-xs text-text-muted/60 mt-1">开始创作后，记录会出现在这里</p>
          </div>
        ) : (
          <>
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
              {list.map((record) => (
                <RecordCard key={record.id} record={record} onPreview={() => setDetail(record)} onDelete={handleDelete} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-8">
                <button
                  onClick={() => fetchList(page - 1, activeTab)}
                  disabled={page <= 1}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | string)[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    typeof p === 'string' ? (
                      <span key={`dot-${i}`} className="px-1 text-text-muted">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => fetchList(p, activeTab)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                          p === page ? 'bg-primary text-white' : 'border border-border text-text-secondary hover:border-primary hover:text-primary'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => fetchList(page + 1, activeTab)}
                  disabled={page >= totalPages}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors"
              onClick={() => setDetail(null)}
            >
              <X className="w-4 h-4 text-white" />
            </div>
            <DetailView record={detail} onLoad={handleLoadToEditor} onDelete={(id) => { handleDelete(id); setDetail(null) }} />
          </div>
        </div>
      )}
    </div>
  )
}

function RecordCard({ record, onPreview, onDelete }: {
  record: GenerationRecord
  onPreview: () => void
  onDelete: (id: number) => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const confirmRef = useRef<HTMLDivElement>(null)
  const config = typeConfig[record.type] || { label: record.type, icon: null, gradient: 'from-gray-500 to-gray-400' }
  const hasImages = record.images?.length > 0
  const firstImage = hasImages ? record.images[0] : null

  useEffect(() => {
    if (!confirmOpen) return
    const handler = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) setConfirmOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [confirmOpen])

  const deleteBtn = (
    <div className="relative" ref={confirmRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setConfirmOpen(true) }}
        className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>
      {confirmOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-border p-3 z-20 w-36" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-text-primary mb-2">确定删除？</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmOpen(false)} className="flex-1 h-7 text-xs rounded-md border border-border text-text-secondary hover:bg-surface-secondary cursor-pointer transition-colors">取消</button>
            <button onClick={() => { onDelete(record.id); setConfirmOpen(false) }} className="flex-1 h-7 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 cursor-pointer transition-colors">删除</button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div
      className="break-inside-avoid bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-border group"
      onClick={onPreview}
    >
      {firstImage ? (
        <div className="relative">
          <img src={firstImage} alt="" className="w-full object-cover" style={{ maxHeight: 280 }} />
          {record.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {record.images.length}图
            </div>
          )}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {deleteBtn}
          </div>
        </div>
      ) : (
        <div className={`relative bg-gradient-to-br ${config.gradient} p-5 min-h-28`}>
          <div className="text-white/90 text-sm font-medium line-clamp-3 leading-relaxed">
            {record.title || record.content?.slice(0, 80) || '无标题'}
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {deleteBtn}
          </div>
        </div>
      )}

      <div className="p-3">
        <p className="text-sm font-medium text-text-primary line-clamp-2 leading-snug">
          {record.title || '无标题'}
        </p>
        {record.content && hasImages && (
          <p className="text-xs text-text-muted mt-1.5 line-clamp-2">{record.content}</p>
        )}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[10px] text-white bg-primary/90 px-1.5 py-0.5 rounded">{config.label}</span>
          <span className="text-[11px] text-text-muted">{formatTime(record.createdAt)}</span>
        </div>
        {record.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {record.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-primary bg-primary/8 px-1.5 py-0.5 rounded">#{tag}</span>
            ))}
            {record.tags.length > 3 && <span className="text-[10px] text-text-muted">+{record.tags.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailView({ record, onLoad, onDelete }: {
  record: GenerationRecord
  onLoad: (record: GenerationRecord) => void
  onDelete: (id: number) => void
}) {
  const [currentImg, setCurrentImg] = useState(0)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const confirmRef = useRef<HTMLDivElement>(null)
  const config = typeConfig[record.type] || { label: record.type, icon: null, gradient: '' }
  const hasImages = record.images?.length > 0

  const PANEL_WIDTH = 380
  const MAX_H = window.innerHeight * 0.85

  const imgDisplayWidth = imgSize ? Math.round((imgSize.w / imgSize.h) * MAX_H) : 500
  const totalWidth = hasImages ? Math.min(imgDisplayWidth + PANEL_WIDTH, window.innerWidth * 0.95) : 600

  useEffect(() => {
    if (!confirmOpen) return
    const handler = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) setConfirmOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [confirmOpen])

  return (
    <div className="flex flex-row" style={{ width: totalWidth, height: MAX_H }}>
      {hasImages && (
        <div className="flex-1 bg-white flex items-center justify-center relative overflow-hidden min-w-0">
          <img
            src={record.images[currentImg]}
            alt=""
            className="max-w-full max-h-full object-contain"
            onLoad={(e) => {
              const img = e.currentTarget
              setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
            }}
          />
          {record.images.length > 1 && (
            <>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {record.images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full cursor-pointer transition-all ${i === currentImg ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`}
                    onClick={() => setCurrentImg(i)}
                  />
                ))}
              </div>
              {currentImg > 0 && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors text-white text-lg" onClick={() => setCurrentImg(c => c - 1)}>‹</div>
              )}
              {currentImg < record.images.length - 1 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors text-white text-lg" onClick={() => setCurrentImg(c => c + 1)}>›</div>
              )}
              <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                {currentImg + 1}/{record.images.length}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col min-h-0 shrink-0 border-l border-border" style={{ width: hasImages ? PANEL_WIDTH : '100%' }}>
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{config.label}</span>
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(record.createdAt)}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-text-primary leading-snug">{record.title || '无标题'}</h2>

          {record.content && (
            <p className="text-sm text-text-secondary leading-loose whitespace-pre-wrap mt-4">{record.content}</p>
          )}

          {record.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {record.tags.map((tag) => (
                <span key={tag} className="text-xs text-primary bg-primary/8 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {(record.topic || record.category) && (
            <div className="mt-4 pt-4 border-t border-border text-xs text-text-muted space-y-1">
              {record.topic && <p>主题：{record.topic}</p>}
              {record.category && <p>分类：{record.category}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <div className="relative" ref={confirmRef}>
            <button
              onClick={() => setConfirmOpen(true)}
              className="h-9 px-4 rounded-lg border border-red-200 text-red-500 text-sm font-medium flex items-center gap-1.5 hover:bg-red-50 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />删除
            </button>
            {confirmOpen && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-border p-3 z-20 w-40">
                <p className="text-xs text-text-primary mb-2">确定删除？</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmOpen(false)} className="flex-1 h-7 text-xs rounded-md border border-border text-text-secondary hover:bg-surface-secondary cursor-pointer transition-colors">取消</button>
                  <button onClick={() => onDelete(record.id)} className="flex-1 h-7 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 cursor-pointer transition-colors">删除</button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => onLoad(record)}
            className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-1.5 hover:bg-primary-dark cursor-pointer transition-colors"
          >
            <ExternalLink className="w-4 h-4" />加载到编辑器
          </button>
        </div>
      </div>
    </div>
  )
}
