export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')       // # 标题
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **加粗**
    .replace(/\*(.+?)\*/g, '$1')       // *斜体*
    .replace(/__(.+?)__/g, '$1')       // __加粗__
    .replace(/_(.+?)_/g, '$1')         // _斜体_
    .replace(/~~(.+?)~~/g, '$1')       // ~~删除线~~
    .replace(/`(.+?)`/g, '$1')         // `代码`
    .replace(/^\s*[-*+]\s+/gm, '')     // - * + 列表
    .replace(/^\s*>\s+/gm, '')         // > 引用
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [链接](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // ![图片](url)
}
