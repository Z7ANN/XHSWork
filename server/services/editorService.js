const { generateTextStream } = require('../utils/ai')

const promptTemplate = require('../prompts/note_gen')
const { stripMarkdown } = require('../utils/text')

const toneMap = {
  lively: '活泼俏皮', professional: '专业干货',
  literary: '文艺清新', funny: '搞笑幽默',
  warm: '温暖治愈', sassy: '犀利毒舌',
  storytelling: '故事叙述', tutorial: '教程攻略',
  review: '测评种草', emotional: '情感共鸣',
  minimalist: '极简高级', conversational: '闺蜜聊天',
  inspirational: '励志鸡汤', suspense: '悬念反转',
  listicle: '清单盘点', debate: '观点输出',
  diary: '日记随笔', science: '科普解读',
  retro: '复古怀旧', luxury: '轻奢精致',
}

const roleMap = {
  blogger: '美妆博主', foodie: '美食达人', traveler: '旅行博主',
  fitness: '健身达人', tech: '数码科技', fashion: '时尚穿搭',
  lifestyle: '生活方式', skincare: '护肤达人', mother: '宝妈育儿',
  student: '学生党', office: '职场白领', home: '家居好物',
  pet: '萌宠博主', photography: '摄影达人', reading: '读书博主',
  diy: '手工DIY', music: '音乐博主', movie: '影视剧评',
  game: '游戏玩家', car: '汽车博主', finance: '理财达人',
  medical: '医学科普', law: '法律科普', psychology: '心理咨询',
  education: '教育培训', wedding: '婚礼策划', decoration: '装修设计',
  outdoor: '户外探险', wine: '品酒达人', garden: '园艺花艺',
}

async function generateNoteStream(res, { topic, tone, role, user, modelId, enableThinking }) {
  const roleBlock = role ? `创作角色：${roleMap[role] || role}` : ''
  const prompt = promptTemplate
    .replace('{topic}', topic)
    .replace('{tone}', toneMap[tone] || tone || '活泼俏皮')
    .replace('{roleBlock}', roleBlock)

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const stream = await generateTextStream(prompt, { temperature: 0.9, maxTokens: 2000, user, modelId, enableThinking })
    let fullText = ''

    for await (const chunk of stream) {
      if (res.destroyed) return
      const delta = chunk.choices?.[0]?.delta?.content || ''
      if (!delta) continue
      fullText += delta
      sendEvent('delta', { text: delta })
    }

    // 解析完整文本提取标题和标签
    const titleMatch = fullText.match(/【标题】(.+)/)
    const tagsMatch = fullText.match(/【标签】(.+)/)
    const title = titleMatch ? titleMatch[1].trim() : ''
    const tags = tagsMatch
      ? tagsMatch[1].match(/#([^\s#]+)/g)?.map(t => t.slice(1)) || []
      : []

    // 提取正文（标题和标签之间的内容）
    let content = fullText
    if (titleMatch) content = content.slice(fullText.indexOf(titleMatch[0]) + titleMatch[0].length)
    if (tagsMatch) content = content.slice(0, content.indexOf(tagsMatch[0]))
    content = stripMarkdown(content.trim())

    sendEvent('done', { title, content, tags })
  } catch (err) {
    sendEvent('error', { message: err.message || '生成失败' })
  }

  res.end()
}

module.exports = { generateNoteStream }
