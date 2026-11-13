import { useLayoutEffect, useRef } from 'react'

// A growing text view: Return inserts a line; only the send button submits.
export default function PromptField({ value, fieldRef, ...props }) {
  const ownRef = useRef(null)
  const ref = fieldRef ?? ownRef
  useLayoutEffect(() => {
    const field = ref.current
    if (!field) return
    const resize = () => {
      field.style.height = '0px'
      field.style.height = `${Math.min(field.scrollHeight, Math.max(80, (window.visualViewport?.height ?? window.innerHeight) * .35))}px`
    }
    resize()
    window.visualViewport?.addEventListener('resize', resize)
    window.addEventListener('resize', resize)
    return () => { window.visualViewport?.removeEventListener('resize', resize); window.removeEventListener('resize', resize) }
  }, [value, ref])
  return <textarea {...props} ref={ref} value={value} rows={1} className="study-prompt-text" enterKeyHint="enter" />
}
