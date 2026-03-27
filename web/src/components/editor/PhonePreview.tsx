import { useState, useRef } from 'react'
import type { Value } from 'platejs'

interface PhonePreviewProps {
  title?: string
  tags?: string[]
  editorValue?: Value
  coverImage?: string
  coverImages?: string[]
  coverLoading?: boolean
}

function highlightTopics(text: string): string {
  return text.replace(/#[^\s#]+/g, '<span style="color:#13386c">$&</span>')
}

function serializeNodes(nodes: Value): string {
  return nodes
    .map((node: any) => {
      const text = highlightTopics(
        (node.children || [])
          .map((child: any) => child.text ?? '')
          .join('')
      )
      if (!text) return ''
      switch (node.type) {
        case 'h1':
          return `<h1 class="text-[15px] font-bold mb-2">${text}</h1>`
        case 'h2':
          return `<h2 class="text-[14px] font-bold mb-1.5">${text}</h2>`
        case 'h3':
          return `<h3 class="text-[13px] font-semibold mb-1">${text}</h3>`
        case 'blockquote':
          return `<blockquote class="border-l-2 border-gray-300 pl-2 text-gray-500 my-1 text-[13px]">${text}</blockquote>`
        default:
          return `<p class="text-[13px] leading-relaxed mb-1">${text}</p>`
      }
    })
    .filter(Boolean)
    .join('')
}

function FeedCard({ coverImage, title, author, likes, height, highlight }: {
  coverImage?: string
  title: string
  author: string
  likes: string
  height?: string
  highlight?: boolean
}) {
  return (
    <div className={`bg-white rounded-md overflow-hidden break-inside-avoid ${highlight ? 'ring-1 ring-red-300' : ''}`}>
      {coverImage ? (
        <img src={coverImage} alt={title} className="w-full h-auto object-cover" />
      ) : (
        <div className={`w-full bg-gray-200 ${height || 'h-32'}`} />
      )}
      <div className="p-2">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-300 rounded-full" />
            <span className="text-xs text-gray-500">{author}</span>
          </div>
          <span className="text-xs text-gray-400">{likes}</span>
        </div>
      </div>
    </div>
  )
}

export function PhonePreview({ title, tags = [], editorValue, coverImage, coverImages = [], coverLoading }: PhonePreviewProps) {
  const [mode, setMode] = useState<'detail' | 'discover'>('detail')
  const [slideIndex, setSlideIndex] = useState(0)
  const startXRef = useRef(0)
  const contentHtml = editorValue ? serializeNodes(editorValue) : ''

  // 合并 coverImage 和 coverImages（兼容编辑器页面传单张的情况）
  const allImages = coverImages.length > 0 ? coverImages : coverImage ? [coverImage] : []
  const currentSlide = Math.min(slideIndex, Math.max(allImages.length - 1, 0))

  const handleDragStart = (x: number) => { startXRef.current = x }
  const handleDragEnd = (x: number) => {
    const diff = x - startXRef.current
    if (diff < -30 && currentSlide < allImages.length - 1) setSlideIndex(currentSlide + 1)
    else if (diff > 30 && currentSlide > 0) setSlideIndex(currentSlide - 1)
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex flex-col items-center h-full">
      {/* Tab switcher */}
      <div className="flex items-center bg-gray-100 rounded-full p-1 mb-4 text-sm w-full max-w-[280px]">
        <button
          onClick={() => setMode('detail')}
          className={`flex-1 py-1.5 rounded-full text-center transition-all cursor-pointer ${mode === 'detail' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-400 hover:text-gray-600'}`}
        >
          笔记预览
        </button>
        <button
          onClick={() => setMode('discover')}
          className={`flex-1 py-1.5 rounded-full text-center transition-all cursor-pointer ${mode === 'discover' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-400 hover:text-gray-600'}`}
        >
          封面预览
        </button>
      </div>

      {/* Phone shell */}
      <div className="w-[360px] h-[720px] bg-black rounded-[2rem] p-2 shadow-xl mx-auto">
        <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden flex flex-col">

          {/* Status bar */}
          <div className="bg-white -mt-1.5 shrink-0">
            <img alt="状态栏" className="w-full object-contain" src="/phone/top.jpg" />
          </div>

          {/* Header - switches based on mode */}
          {mode === 'detail' ? (
            <div className="h-10 bg-white flex items-center justify-between px-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 1024 1024" width="14" height="14" fill="currentColor"><path d="M792.8 944c16.8 16.8 16.8 43.2 0 60-16.8 16.8-43.2 16.8-59.2 0L231.2 544c-8.8-8.8-12.8-20.8-12-32-0.8-11.2 3.2-23.2 12-32L732.8 20C749.6 3.2 776 3.2 792 20c16.8 16.8 16.8 43.2 0 60L320.8 512l472 432z"/></svg>
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 5v1h16v-1c0-2-2-5-8-5z"/></svg>
                </div>
                <span className="text-sm text-gray-900 font-medium">小红书</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-0.5 rounded-full border border-blue-500 text-blue-500 text-xs cursor-pointer">关注</span>
                <svg className="icon" viewBox="0 0 1024 1024" width="14" height="14"><path d="M922.026667 439.04l-267.221334-282.368v185.258667h-85.333333c-250.325333 0-455.253333 181.504-481.322667 413.44 115.157333-133.674667 291.925333-218.922667 480.682667-218.922667h85.077333l0.554667 185.173333 267.52-282.581333z m-438.528 189.44C268.8 662.570667 87.04 821.76 47.232 1024A529.664 529.664 0 0 1 0 805.461333C0 502.272 254.976 256.597333 569.472 256.597333V40.96a35.242667 35.242667 0 0 1 10.368-30.208 39.68 39.68 0 0 1 54.4 0l378.794667 400.298667a35.298667 35.298667 0 0 1 10.88 27.861333 35.498667 35.498667 0 0 1-10.88 27.904l-376.704 398.08a37.973333 37.973333 0 0 1-56.448 2.133333 35.114667 35.114667 0 0 1-10.410667-30.208l-0.64-215.082666c-26.88 0-53.546667 2.005333-79.701333 5.845333l-5.632 0.853333z" fill="#515151"></path></svg>
              </div>
            </div>
          ) : (
            <div className="h-10 bg-white flex items-center justify-between px-3 border-b border-gray-100 shrink-0">
              <svg viewBox="0 0 1024 1024" width="20" height="20" fill="#333"><path d="M128 256h768v64H128v-64zm0 320h768v64H128v-64zm0 320h768v64H128v-64z"/></svg>
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-400">关注</span>
                <span className="text-sm font-medium text-red-500 relative">推荐<span className="absolute -bottom-1 left-0 w-full h-[2px] bg-red-500 rounded-full" /></span>
                <span className="text-sm text-gray-400">附近</span>
              </div>
              <svg viewBox="0 0 1024 1024" width="20" height="20" fill="#333"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0 0 11.6 0l43.6-43.5a8.2 8.2 0 0 0 0-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"/></svg>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {mode === 'detail' ? (
              <>
                {/* Banner / cover images carousel */}
                {allImages.length > 0 ? (
                  <div
                    className="relative w-full aspect-[3/4] overflow-hidden select-none cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX) }}
                    onMouseUp={(e) => handleDragEnd(e.clientX)}
                    onMouseLeave={(e) => { if (e.buttons === 1) handleDragEnd(e.clientX) }}
                    onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                    onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
                  >
                    <div
                      className="flex h-full transition-transform duration-300 ease-out"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {allImages.map((img, i) => (
                        <img key={i} src={img} alt={`第${i + 1}页`} className="w-full h-full object-cover shrink-0" />
                      ))}
                    </div>
                    {/* 指示器 */}
                    {allImages.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {allImages.map((_, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentSlide ? 'bg-white w-3' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : coverLoading ? (
                  <div className="w-full aspect-[3/4] bg-gray-100 flex flex-col items-center justify-center gap-2 animate-pulse">
                    <svg className="w-8 h-8 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <span className="text-xs text-gray-400">图片生成中...</span>
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] bg-gray-200 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21z"/></svg>
                  </div>
                )}

                {/* Text content */}
                <div className="px-2.5 py-3">
                  {title && (
                    <h1 className="text-lg font-bold text-gray-900 leading-snug mb-2">{title}</h1>
                  )}

                  {contentHtml ? (
                    <div className="text-[15px] leading-8 tracking-[0.02em] whitespace-pre-wrap break-words text-gray-800" dangerouslySetInnerHTML={{ __html: contentHtml }} />
                  ) : (
                    !title && (
                      <div className="space-y-2 py-2">
                        <div className="h-3 w-full bg-gray-100 rounded" />
                        <div className="h-3 w-5/6 bg-gray-100 rounded" />
                        <div className="h-3 w-4/6 bg-gray-100 rounded" />
                      </div>
                    )
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tags.map((tag) => (
                        <span key={tag} className="text-[13px]" style={{ color: '#13386c' }}>#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span>编辑于 刚刚</span>
                  </div>
                </div>

                <div className="border-b border-gray-200" />

                {/* Empty comments */}
                <div className="py-10 flex flex-col items-center text-gray-400">
                  <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zM12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"/></svg>
                  <div className="mt-3 text-xs">
                    这是一片荒地 <span className="text-blue-500 cursor-pointer">点击评论</span>
                  </div>
                </div>
              </>
            ) : (
              /* Discover mode - XHS home feed */
              <div className="bg-gray-100">
                {/* Category tabs */}
                <div className="h-8 bg-white flex items-center border-b border-gray-100 px-4">
                  <div className="flex items-center gap-5 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">推荐</span>
                    <span className="text-xs text-gray-400">直播</span>
                    <span className="text-xs text-gray-400">短剧</span>
                    <span className="text-xs text-gray-400">美食</span>
                    <span className="text-xs text-gray-400">穿搭</span>
                    <span className="text-xs text-gray-400">家装</span>
                    <span className="text-xs text-gray-400">旅行</span>
                  </div>
                </div>

                {/* Waterfall grid */}
                <div className="px-2 py-2">
                  <div className="columns-2 gap-2 space-y-2">
                    {/* User's card - highlighted */}
                    <FeedCard
                      coverImage={allImages[0]}
                      title={title || '笔记标题'}
                      author="我的笔记"
                      likes="0"
                      highlight
                    />
                    <FeedCard title="美食探店" author="美食达人" likes="2.1k" height="h-28" />
                    <FeedCard title="穿搭分享" author="时尚博主" likes="1.8k" height="h-44" />
                    <FeedCard title="旅行日记" author="旅行者" likes="3.2k" height="h-36" />
                    <FeedCard title="健身打卡" author="健身达人" likes="1.5k" height="h-44" />
                    <FeedCard title="护肤心得" author="美妆博主" likes="2.8k" height="h-36" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="bg-white border-t border-gray-200 shrink-0">
            <img
              alt="底部栏"
              className="w-full object-contain -mt-[2px]"
              src={mode === 'detail' ? '/phone/bootom2.jpg' : '/phone/bootom.jpg'}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
