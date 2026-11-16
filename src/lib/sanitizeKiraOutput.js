// Strip presentation syntax, never digits, arithmetic or HTML-escape via innerHTML.
export function sanitizeKiraOutput(text) {
  return String(text ?? '')
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|[.,!?;:]|$)/g, '$1$2')
    .replace(/__([^\n]+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/[→•✓✗]/g, '')
    .replace(/[0-9#*]\uFE0F?\u20E3/g, '')
    .replace(/\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|\uFE0F|\u200D|\u20E3|[\u{E0020}-\u{E007F}]/gu, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
