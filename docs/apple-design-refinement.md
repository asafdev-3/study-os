# StudyOS: Apple HIG audit — 13 November 2026

Sources consulted: Apple's Human Interface Guidelines, not unofficial iOS 27 mockups. User video reviewed as a visual reference for short, reversible transitions, floating controls, app continuity and low visual density. StudyOS remains React/Vite PWA; this does not turn CSS into SwiftUI/UIKit, add native system Dynamic Island, or guarantee native frame pacing.

| Guideline | Application |
| --- | --- |
| Progressive disclosure | Notes open to a quiet drawer of named covers; full notebook appears only when opened. Saving returns to drawer. Existing entries preserved. |
| Content before decoration | Cover title and area identify each saved annotation. No new backend hierarchy or migration; a cover represents an existing annotation. |
| Full-bleed backgrounds | Fixed scene extends beneath navigation with min-height:100dvh and safe-area-aware content. Distinct framing for notes, reminders and chat, shared room identity. Browser/system chrome remains controlled by iOS. |
| Functional glass | Blur restricted mainly to navigation/controls. Paper and text content remain opaque/readable. No stacked fullscreen live blurs. |
| Long text uses text views | Both Kira composers use growing multiline textarea. Return adds newline; button sends. Long drafts scroll vertically up to viewport-relative height, never horizontal clipping. |
| Keyboard accommodation | Existing visualViewport layout updated for textarea and growing editor; composer remains above keyboard. |
| Legible choices | Kira tone becomes a labeled radio group with descriptions. All native select option foreground/background and color-scheme explicitly set; paper selectors retain light palette. |
| Familiar binary controls | Settings checkbox visuals use switches while preserving native checkbox keyboard semantics. |
| Touch targets | Existing 44px actions preserved. Reminder completion target stays 44px; decorative check remains small. |
| Purposeful motion | Short tactile cover response; existing blur-only screen transition retained. No fold, no artificial wait. |
| Accessibility | Reduced motion respected; reduced transparency and increased contrast fallbacks. Focus semantics and keyboard-friendly native controls retained. |
| Real materials | Paper uses restrained adhesion shading, slight lift/shadow, no exaggerated glossy corner or pin. Covers use cloth-like matte color, spine and page edge. |
| Consistent navigation | Existing navbar routes and positions preserved; user returns explicitly to drawer. |

Sources:
- https://developer.apple.com/design/human-interface-guidelines/materials
- https://developer.apple.com/design/human-interface-guidelines/layout
- https://developer.apple.com/design/human-interface-guidelines/motion
- https://developer.apple.com/design/human-interface-guidelines/accessibility
- https://developer.apple.com/design/human-interface-guidelines/text-fields
- https://developer.apple.com/design/human-interface-guidelines/buttons
- https://developer.apple.com/design/human-interface-guidelines/tab-bars
- https://developer.apple.com/design/human-interface-guidelines/color

Verification: production build, targeted ESLint, browser mocked-account study flows at 320/414/1024 and motion/keyboard regressions at 320/414/430/1024. Screenshots reviewed for drawer, long draft and tone picker. Physical iPhone/PWA not tested here. No backend/security/payment changes.
