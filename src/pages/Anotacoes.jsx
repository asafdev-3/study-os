import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Camera, PenLine, Sparkles, ImageIcon, Bold, Italic, List, X } from 'lucide-react'

const materias = ['Tudo', 'Química', 'Cálculo', 'História', 'Inglês', 'Física']
const materiasForm = ['Química', 'Cálculo', 'História', 'Inglês', 'Física']

const coresMaterias = {
  'Química': '#A8D8D8', 'História': '#F5D08A', 'Inglês': '#C5B8E8',
  'Cálculo': '#C8E6A0', 'Física': '#F4A8A8',
}

const notas = [
  { id: 1, materia: 'QUÍMICA', cor: '#4ADE80', titulo: 'Oxirredução', preview: 'NOX, agente redutor vs oxidante. Sempre: quem perde elétron oxida…', tempo: '1d' },
  { id: 2, materia: 'HISTÓRIA', cor: '#FBBF24', titulo: 'Guerra Fria', preview: '1947–1991. Blocos. Doutrina Truman ↔ Plano Marshall.', tempo: '1d' },
  { id: 3, materia: 'INGLÊS', cor: '#A78BFA', titulo: 'Phrasal Verbs', preview: 'set aside, set out to…', tempo: '3d' },
  { id: 4, materia: 'CÁLCULO', cor: '#60A5FA', titulo: 'Regra do produto', preview: "(fg)' = f'g + fg'", tempo: 'agora' },
  { id: 5, materia: 'FÍSICA', cor: '#F87171', titulo: 'MHS', preview: 'pêndulo simples, T = 2π√(L/g)', tempo: '3d' },
]

function SheetManual({ onClose }) {
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [materia, setMateria] = useState(null)
  const [visivel, setVisivel] = useState(false)

  const [negritoAtivo, setNegritoAtivo] = useState(false)
  const [italicoAtivo, setItalicoAtivo] = useState(false)
  const [listaAtiva, setListaAtiva] = useState(false)

  const tituloRef = useRef(null)
  const editorRef = useRef(null)
  const savedSelectionRef = useRef(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setVisivel(true)
    })

    const focus = setTimeout(() => {
      tituloRef.current?.focus()
    }, 250)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(focus)
    }
  }, [])

  function fechar() {
    setVisivel(false)

    setTimeout(() => {
      onClose()
    }, 180)
  }

  function handleSalvar() {
    if (!titulo.trim() && !conteudo.trim()) return
    fechar()
  }

  function salvarSelecao() {
    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)

    if (
      editorRef.current &&
      editorRef.current.contains(range.commonAncestorContainer)
    ) {
      savedSelectionRef.current = range.cloneRange()
    }
  }

  function restaurarSelecao() {
    const selection = window.getSelection()
    const range = savedSelectionRef.current

    if (!selection || !range) return

    selection.removeAllRanges()
    selection.addRange(range)
  }

  function atualizarEstadoFormatacao() {
    if (!editorRef.current) return

    setNegritoAtivo(document.queryCommandState('bold'))
    setItalicoAtivo(document.queryCommandState('italic'))

    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) {
      return
    }

    let node = selection.anchorNode

    if (node?.nodeType === Node.TEXT_NODE) {
      node = node.parentElement
    }

    if (!node || !editorRef.current.contains(node)) {
      return
    }

    const textoLinha = node.textContent || ''

    setListaAtiva(
      textoLinha.trimStart().startsWith('- ')
    )
  }

  function aplicarComando(comando) {
    editorRef.current?.focus()
    restaurarSelecao()

    document.execCommand(comando, false, null)

    setConteudo(editorRef.current?.innerHTML || '')

    salvarSelecao()
    atualizarEstadoFormatacao()
  }

  function aplicarLista() {
    const editor = editorRef.current

    if (!editor) return

    editor.focus()
    restaurarSelecao()

    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) {
      return
    }

    const range = selection.getRangeAt(0)

    let node = range.startContainer

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement
    }

    if (!editor.contains(node)) {
      return
    }

    let linha = node

    while (
      linha &&
      linha !== editor &&
      linha.parentElement &&
      linha.parentElement !== editor
    ) {
      linha = linha.parentElement
    }

    const linhaTexto = linha?.textContent || ''

    if (linhaTexto.trimStart().startsWith('- ')) {
      setListaAtiva(false)
      salvarSelecao()
      atualizarEstadoFormatacao()
      return
    }

    const inicioLinha = document.createRange()

    inicioLinha.selectNodeContents(linha || node)
    inicioLinha.collapse(true)

    selection.removeAllRanges()
    selection.addRange(inicioLinha)

    document.execCommand(
      'insertText',
      false,
      '- '
    )

    setListaAtiva(true)

    setConteudo(editor.innerHTML)

    salvarSelecao()
    atualizarEstadoFormatacao()
  }

  function handleEditorInput(e) {
    setConteudo(e.currentTarget.innerHTML)

    salvarSelecao()
    atualizarEstadoFormatacao()
  }

  function handleEditorSelection() {
    salvarSelecao()
    atualizarEstadoFormatacao()
  }

  function handleEditorKeyDown(e) {
    if (e.key !== 'Enter') return
    if (!listaAtiva) return

    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) {
      return
    }

    const node = selection.anchorNode

    if (!node) return

    const textoAtual =
      node.textContent || ''

    const posicao =
      selection.anchorOffset

    const antesDoCursor =
      textoAtual.slice(0, posicao)

    // Enter em uma linha vazia encerra a lista
    if (
      antesDoCursor.trim() === '-'
    ) {
      e.preventDefault()

      document.execCommand(
        'delete',
        false,
        null
      )

      document.execCommand(
        'insertParagraph',
        false,
        null
      )

      setListaAtiva(false)

      setTimeout(() => {
        setConteudo(
          editorRef.current?.innerHTML || ''
        )

        atualizarEstadoFormatacao()
      }, 0)

      return
    }

    // Enter normal dentro da lista
    e.preventDefault()

    document.execCommand(
      'insertParagraph',
      false,
      null
    )

    document.execCommand(
      'insertText',
      false,
      '- '
    )

    setListaAtiva(true)

    setTimeout(() => {
      setConteudo(
        editorRef.current?.innerHTML || ''
      )

      salvarSelecao()
      atualizarEstadoFormatacao()
    }, 0)
  }

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          background: 'rgba(0,0,0,0.68)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          opacity: visivel ? 1 : 0,
          transition: 'opacity 180ms ease',
        }}
        onClick={fechar}
      />

      {/* modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div
          className="w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden pointer-events-auto"
          style={{
            background: 'rgba(22,22,27,0.97)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '28px',
            boxShadow:
              '0 30px 90px rgba(0,0,0,0.75)',
            opacity: visivel ? 1 : 0,
            transform: visivel
              ? 'translateY(0) scale(1)'
              : 'translateY(12px) scale(.965)',
            transition:
              'opacity 220ms cubic-bezier(.22,1,.36,1), transform 260ms cubic-bezier(.22,1,.36,1)',
          }}
        >

          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#26262e]">
            <button
              type="button"
              onClick={fechar}
              className="text-[#a1a1aa] text-sm"
            >
              Cancelar
            </button>

            <span className="text-xs tracking-[0.2em] text-zinc-400">
              NOVA ANOTAÇÃO
            </span>

            <button
              type="button"
              onClick={handleSalvar}
              className="text-sm font-medium transition-all"
              style={{
                color:
                  titulo.trim() || conteudo.trim()
                    ? '#8B5CF6'
                    : '#3f3f46',
              }}
            >
              Salvar
            </button>
          </div>

          {/* matérias */}
          <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-none border-b border-[#26262e]">
            {materiasForm.map(m => (
              <button
                type="button"
                key={m}
                onClick={() =>
                  setMateria(
                    materia === m ? null : m
                  )
                }
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-all"
                style={{
                  background:
                    materia === m
                      ? coresMaterias[m] + '22'
                      : 'transparent',
                  borderColor:
                    materia === m
                      ? coresMaterias[m]
                      : '#26262e',
                  color:
                    materia === m
                      ? coresMaterias[m]
                      : '#a1a1aa',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* título */}
          <div className="px-5 pt-4">
            <input
              ref={tituloRef}
              value={titulo}
              onChange={e =>
                setTitulo(e.target.value)
              }
              placeholder="Título da anotação"
              className="w-full bg-transparent font-semibold text-white outline-none placeholder-zinc-700"
              style={{
                fontSize: '16px',
              }}
            />
          </div>

          {/* editor */}
          <div className="flex-1 px-5 pt-3 overflow-y-auto">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              spellCheck="true"
              data-placeholder="Comece a escrever..."
              onInput={handleEditorInput}
              onSelect={handleEditorSelection}
              onKeyUp={handleEditorSelection}
              onMouseUp={handleEditorSelection}
              onTouchEnd={handleEditorSelection}
              onFocus={handleEditorSelection}
              onKeyDown={handleEditorKeyDown}
              className="
                w-full
                outline-none
                text-zinc-300
                leading-relaxed
                min-h-[160px]
                whitespace-pre-wrap
                empty:before:content-[attr(data-placeholder)]
                empty:before:text-zinc-700
              "
              style={{
                fontFamily:
                  'Instrument Serif, serif',
                fontSize: '16px',
                WebkitUserSelect: 'text',
                userSelect: 'text',
              }}
            />
          </div>

          {/* toolbar */}
          <div
            className="px-5 py-4 flex items-center justify-between border-t border-[#26262e]"
            style={{
              paddingBottom:
                'max(16px, env(safe-area-inset-bottom))',
            }}
          >
            <div className="flex items-center gap-3">

              {/* B */}
              <button
                type="button"
                aria-label="Negrito"
                onPointerDown={e => {
                  e.preventDefault()
                  salvarSelecao()
                }}
                onPointerUp={() => {
                  aplicarComando('bold')
                }}
                className={`
                  w-9 h-9
                  rounded-lg
                  flex items-center justify-center
                  transition-all
                  ${
                    negritoAtivo
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                      : 'text-zinc-500 border border-transparent hover:text-white'
                  }
                `}
              >
                <Bold size={16} />
              </button>

              {/* I */}
              <button
                type="button"
                aria-label="Itálico"
                onPointerDown={e => {
                  e.preventDefault()
                  salvarSelecao()
                }}
                onPointerUp={() => {
                  aplicarComando('italic')
                }}
                className={`
                  w-9 h-9
                  rounded-lg
                  flex items-center justify-center
                  transition-all
                  ${
                    italicoAtivo
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                      : 'text-zinc-500 border border-transparent hover:text-white'
                  }
                `}
              >
                <Italic size={16} />
              </button>

              {/* LISTA */}
              <button
                type="button"
                aria-label="Lista"
                onPointerDown={e => {
                  e.preventDefault()
                  salvarSelecao()
                }}
                onPointerUp={() => {
                  aplicarLista()
                }}
                className={`
                  w-9 h-9
                  rounded-lg
                  flex items-center justify-center
                  transition-all
                  ${
                    listaAtiva
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                      : 'text-zinc-500 border border-transparent hover:text-white'
                  }
                `}
              >
                <List size={16} />
              </button>
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-violet-500/30 text-violet-400"
            >
              <Sparkles size={11} />
              Kira sugere
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Anotacoes() {
  const navigate = useNavigate()
  const [ativa, setAtiva] = useState('Tudo')
  const [menuAberto, setMenuAberto] = useState(false)
  const [sheetAberto, setSheetAberto] = useState(false)

  const filtradas = ativa === 'Tudo' ? notas : notas.filter(n => n.materia.toLowerCase() === ativa.toLowerCase())

  return (
    <div className="min-h-screen bg-black text-white pb-32 px-4 max-w-sm mx-auto">

      <div className="flex items-end justify-between pt-12 pb-4">
        <h1 className="text-3xl font-semibold">Anotações</h1>
        <span className="text-[#a1a1aa] text-xs mb-1">47 no total</span>
      </div>

      <div className="flex items-center bg-[#0a0a0c] border border-[#16161b] rounded-xl px-4 py-3 gap-3 mb-5">
        <Search size={15} className="text-[#a1a1aa]" />
        <input
          placeholder="buscar em todas as anotações..."
          className="bg-transparent text-white outline-none w-full placeholder-[#a1a1aa]"
          style={{ fontSize: '16px' }}
        />
        <span className="text-[#a1a1aa] text-xs border border-[#26262e] rounded px-1.5 py-0.5">⌘K</span>
      </div>

      <p className="text-[#a1a1aa] text-[10px] tracking-widest uppercase mb-3">Capturada agora</p>
      <div className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 flex gap-4 mb-5">
        <div className="w-20 h-20 bg-[#16161b] rounded-xl flex-shrink-0 flex flex-col items-center justify-center gap-1.5 border border-[#26262e]">
          <ImageIcon size={20} className="text-[#3f3f46]" />
          <span className="text-[9px] text-[#3f3f46]">sem foto</span>
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-[#4ADE80] tracking-widest mb-1">● CÁLCULO · RECONHECIDO</p>
            <p style={{ fontFamily: 'Instrument Serif, serif' }} className="text-base italic">Regra do produto</p>
            <p style={{ fontFamily: 'Geist Mono, monospace' }} className="text-sm mt-1">(fg)' = f'g + fg'</p>
          </div>
          <p className="text-[#a1a1aa] text-xs flex items-center gap-1">
            <Sparkles size={11} /> Kira sugere 4 flashcards
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {materias.map(m => (
          <button
            key={m}
            onClick={() => setAtiva(m)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm border transition
              ${ativa === m ? 'bg-white text-black border-white' : 'bg-transparent text-[#a1a1aa] border-[#26262e]'}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="columns-2 gap-3">
        {filtradas.map(({ id, materia, cor, titulo, preview, tempo }) => (
          <div key={id} className="bg-[#0a0a0c] border border-[#16161b] rounded-2xl p-4 mb-3 break-inside-avoid">
            <p className="text-[10px] tracking-widest mb-2 flex items-center gap-1" style={{ color: cor }}>● {materia}</p>
            <p className="text-sm font-medium mb-1">{titulo}</p>
            <p className="text-[#a1a1aa] text-xs leading-relaxed">{preview}</p>
            <p className="text-[#26262e] text-[10px] mt-3">{tempo}</p>
          </div>
        ))}
      </div>

      {menuAberto && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)} />
      )}

      {/* FAB + mini-menu */}
      <div className="fixed bottom-27 right-6 z-50 flex flex-col items-end gap-3">
        {menuAberto && (
          <>
            <button
              onClick={() => { setMenuAberto(false); navigate('/nova-anotacao?modo=camera') }}
              className="flex items-center gap-3 bg-[#16161b] border border-[#26262e] rounded-2xl px-4 py-3 text-sm text-white shadow-xl"
            >
              <Camera size={15} className="text-violet-400" />
              Via câmera (OCR)
            </button>
            <button
              onClick={() => { setMenuAberto(false); setSheetAberto(true) }}
              className="flex items-center gap-3 bg-[#16161b] border border-[#26262e] rounded-2xl px-4 py-3 text-sm text-white shadow-xl"
            >
              <PenLine size={15} className="text-violet-400" />
              Escrever manualmente
            </button>
          </>
        )}
        <button
          onClick={() => setMenuAberto(prev => !prev)}
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #22D3A0)', padding: '2px' }}
          className="w-14 h-14 rounded-full"
        >
          <div
            className="w-full h-full rounded-full bg-black flex items-center justify-center transition-transform duration-200"
            style={{ transform: menuAberto ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            <Plus size={22} className="text-white" />
          </div>
        </button>
      </div>

      {sheetAberto && <SheetManual onClose={() => setSheetAberto(false)} />}
    </div>
  )
}

export default Anotacoes