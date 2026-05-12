import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Mic, LayoutTemplate, Waves, Send, MicOff } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const TEMPLATES = [
  { label: 'Расскажи анекдот', emoji: '😄' },
  { label: 'Какая погода?',    emoji: '🌤' },
  { label: 'Включи джаз',     emoji: '🎷' },
  { label: 'Доброе утро',     emoji: '☀️' },
  { label: 'Включи красный',  emoji: '🔴' },
  { label: 'Выключи подсветку',emoji: '💡' },
  { label: 'Сделай тише',     emoji: '🤫' },
  { label: 'Сколько времени?', emoji: '🕐' },
]

const PLACEHOLDERS = [
  'Напиши команду Алисе...',
  'Включи лава-лампу...',
  'Расскажи анекдот...',
  'Какая погода сегодня?',
  'Включи мою волну...',
  'Поставь будильник на 8 утра...',
  'Сколько сейчас времени?',
]

function useTypewriter(texts, { typingSpeed = 60, deleteSpeed = 30, pauseTime = 2200 } = {}) {
  const [displayed, setDisplayed] = useState('')
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('typing') // typing | pause | deleting

  useEffect(() => {
    const current = texts[idx]
    let timeout

    if (phase === 'typing') {
      if (displayed.length < current.length) {
        timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), typingSpeed)
      } else {
        timeout = setTimeout(() => setPhase('pause'), pauseTime)
      }
    } else if (phase === 'pause') {
      setPhase('deleting')
    } else if (phase === 'deleting') {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), deleteSpeed)
      } else {
        setIdx(i => (i + 1) % texts.length)
        setPhase('typing')
      }
    }

    return () => clearTimeout(timeout)
  }, [displayed, phase, idx, texts, typingSpeed, deleteSpeed, pauseTime])

  return displayed
}

export default function AliceInput() {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [listening, setListening] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const recognitionRef = useRef(null)
  const typedPlaceholder = useTypewriter(PLACEHOLDERS, { typingSpeed: 55, deleteSpeed: 25, pauseTime: 2000 })
  const textareaRef = useRef(null)
  const templateBtnRef = useRef(null)

  const speechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  async function handleSend(cmd) {
    const value = (cmd || text).trim()
    if (!value) return
    setLoading(true)
    try {
      await axios.post('/api/command', { text: value })
      toast.success(value.length > 32 ? value.slice(0, 32) + '…' : value)
      setText('')
    } catch { toast.error('Ошибка') } finally { setLoading(false) }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleMic() {
    if (!speechSupported) { toast.error('Нужен Chrome или Edge'); return }
    if (listening) { recognitionRef.current?.stop(); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = 'ru-RU'; r.interimResults = false; r.maxAlternatives = 1
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onerror = () => { setListening(false); toast.error('Ошибка микрофона') }
    r.onresult = (e) => { const t = e.results[0][0].transcript; setText(t); setTimeout(() => handleSend(t), 100) }
    recognitionRef.current = r; r.start()
  }

  function handleTemplate(label) { setText(label); setShowTemplates(false); textareaRef.current?.focus() }

  async function handleMyWave() {
    try { await axios.post('/api/command', { text: 'включи мою волну' }); toast.success('Моя волна') }
    catch { toast.error('Ошибка') }
  }

  useEffect(() => {
    if (!showTemplates) return
    const h = (e) => {
      // Закрываем если клик не по кнопке и не по dropdown
      if (!e.target.closest('[data-templates]') && e.target !== templateBtnRef.current && !templateBtnRef.current?.contains(e.target)) {
        setShowTemplates(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showTemplates])

  return (
    <div className="p-5 flex flex-col gap-3">
      <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-widest">Алиса</p>

      <div className="relative">
        {/* Анимированный placeholder — виден только когда поле пустое и не в фокусе */}
        <AnimatePresence>
          {!text && !focused && (
            <motion.div
              className="absolute top-0 left-0 right-0 px-4 pr-11 pointer-events-none select-none"
              style={{ paddingTop: '8px', paddingBottom: '8px' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-sm leading-relaxed" style={{ color: 'rgba(60,60,67,0.45)' }}>
                {typedPlaceholder}
              </span>
              {/* Мигающий курсор */}
              <motion.span
                className="inline-block w-0.5 h-4 ml-0.5 align-middle rounded-full"
                style={{ background: 'rgba(60,60,67,0.45)', marginBottom: '1px' }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'steps(1)' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=""
          rows={5}
          style={{ paddingTop: '8px', paddingBottom: '8px' }}
          className="g-input w-full resize-none rounded-2xl px-4 pr-11 text-sm leading-relaxed"
        />
        <motion.button
          onClick={() => handleSend()}
          disabled={!text.trim() || loading}
          whileTap={{ scale: 0.9 }}
          className="g-btn-dark absolute right-2.5 bottom-2.5 w-7 h-7 rounded-xl disabled:opacity-30 flex items-center justify-center"
        >
          {loading
            ? <motion.div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
            : <Send size={12} className="text-[#f0f0f0] ml-0.5" />
          }
        </motion.button>
      </div>

      <div className="flex gap-2">
        {/* Микрофон */}
        <motion.button onClick={handleMic} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium ${
            listening ? 'g-btn-dark' : 'g-btn'
          }`}>
          {listening
            ? <><motion.div animate={{ scale: [1,1.3,1] }} transition={{ duration: 0.8, repeat: Infinity }}><MicOff size={13}/></motion.div> Стоп</>
            : <><Mic size={13}/> Диктовка</>}
        </motion.button>

        {/* Шаблоны */}
        <div className="relative flex-1" data-templates>
          <motion.button
            ref={templateBtnRef}
            onClick={() => {
              if (!showTemplates && templateBtnRef.current) {
                const r = templateBtnRef.current.getBoundingClientRect()
                setDropdownPos({ top: r.bottom + 8, left: r.left })
              }
              setShowTemplates(v => !v)
            }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium ${showTemplates ? 'g-btn-dark' : 'g-btn'}`}>
            <LayoutTemplate size={13}/> Шаблоны
          </motion.button>
        </div>

        {/* Волна */}
        <motion.button onClick={handleMyWave} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium g-btn">
          <Waves size={13}/> Волна
        </motion.button>
      </div>

      <p className="text-sm text-[#8e8e93] px-0.5">Enter — отправить · Shift+Enter — строка</p>

      {/* Dropdown через portal — рендерится поверх всего */}
      {createPortal(
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              data-templates
              className="fixed z-[100] rounded-2xl"
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                minWidth: '220px',
                background: 'rgba(225,225,230,0.96)',
                backdropFilter: 'blur(48px)',
                WebkitBackdropFilter: 'blur(48px)',
                border: '1px solid rgba(255,255,255,0.75)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
              }}
            >
              {TEMPLATES.map((t, i) => (
                <motion.button key={t.label} onClick={() => handleTemplate(t.label)}
                  initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#1c1c1e] hover:bg-black/6 transition-colors text-left rounded-2xl">
                  <span className="text-sm">{t.emoji}</span> {t.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
