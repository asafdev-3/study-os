export function kiraMessageMotion(role, reduced, restored = false) {
  return {
    initial: reduced || restored ? false : { opacity: 0, y: role === 'user' ? 10 : 0 },
    animate: { opacity: 1, y: 0 },
    transition: reduced ? { duration: 0 } : role === 'assistant'
      ? { duration: .24, delay: .15, ease: [.22, 1, .36, 1] }
      : { type: 'spring', stiffness: 300, damping: 30 },
  }
}
