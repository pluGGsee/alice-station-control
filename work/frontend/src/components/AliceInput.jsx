import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mic, LayoutTemplate, Waves, Send, MicOff } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const TEMPLATES = [
  { label: 'Расскажи анекдот', emoji: '😄' },
  { label: 'Какая погода?', emoji: '🌤' },
  { label: 'Включи джаз', emoji: '🎷' },
  { label: 'Доброе утро', emoji: '☀️' },
  { label: 'Включи красный', emoji: '🔴' },
  { label: 'Выключи подсветку', emoji: '💡' },
  { label: 'Сделай тише', emoji: '🤫' },
  { label: 'Сколько времени?', emoji: '🕐' },
]

export default function AliceInput() {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [loading, setLoading] = useState(false)
  const recognitionRef = useRef(null)
  const textareaRef = useRef(null)

  const speechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  async function handleSend(cmd) {
    const value = (cmd || text).trim()
    if (!value) return
    setLoading(true)
    try {
      await axios.post('/api/command', { text: value })
      toast.success(`✓ ${value.length > 32 ? value.slice(0, 32) + '…' : value}`)
      setText('')
    } catch {
      toast.error('Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleMic() {
    if (!speechSupported) {
      toast.error('Диктовка работает только в Chrome/Edge')
      return
    }
    if (listening) { recognitionRef.current?.stop(); return }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const r = new SR()
    r.lang = 'ru-RU'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onerror = () => { setListening(false); toast.error('Ошибка микрофона') }
    r.onresult = (e) => {
      const t = e.results[0][0].transcript
      setText(t)
      setTimeout(() => handleSend(t), 100)
    }
    recognitionRef.current = r
    r.start()
  }

  function handleTemplate(label) {
    setText(label)
    setShowTemplates(false)
    textareaRef.current?.focus()
  }

  async function handleMyWave() {
    try {
      await axios.post('/api/command', { text: 'включи мою волну' })
      toast.success('🌊 Моя волна')
    } catch { toast.error('Ошибка') }
  }

  useEffect(() => {
    if (!showTemplates) return
    const h = (e) => { if (!e.target.closest('[data-templates]')) setShowTemplates(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showTemplates])

  return (
    <div className="p-5 flex flex-col gap-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Алиса</p>

      {/* Поле ввода */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Напиши или надиктуй команду Алисе..."
          rows={3}
          className="w-full resize-none rounded-2xl px-4 py-3 pr-11 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed transition-all focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.65)',
          }}
          onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.65)'; e.target.style.borderColor = 'rgba(124,58,237,0.4)' }}
          onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.45)'; e.target.style.borderColor = 'rgba(255,255,255,0.65)' }}
        />
        <motion.button
          onClick={() => handleSend()}
          disabled={!text.trim() || loading}
          whileTap={{ scale: 0.9 }}
          className="absolute right-2.5 bottom-2.5 w-7 h-7 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-md shadow-purple-200"
        >
          {loading
            ? <motion.div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
            : <Send size={12} className="text-white ml-0.5" />
          }
        </motion.button>
      </div>

      {/* 3 кнопки */}
      <div className="flex gap-2">
        {/* Микрофон */}
        <motion.button
          onClick={handleMic}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium transition-all border ${
            listening
              ? 'bg-red-500 border-red-400 text-white shadow-md shadow-red-200'
              : 'bg-white/50 border-white/70 text-slate-600 hover:bg-white/70 hover:text-slate-800'
          }`}
        >
          {listening ? (
            <><motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><MicOff size={13} /></motion.div> Стоп</>
          ) : (
            <><Mic size={13} /> Диктовка</>
          )}
        </motion.button>

        {/* Шаблоны */}
        <div className="relative flex-1" data-templates>
          <motion.button
            onClick={() => setShowTemplates(v => !v)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium transition-all border ${
              showTemplates
                ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-200'
                : 'bg-white/50 border-white/70 text-slate-600 hover:bg-white/70 hover:text-slate-800'
            }`}
          >
            <LayoutTemplate size={13} /> Шаблоны
          </motion.button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.95)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.16)',
                }}
              >
                {TEMPLATES.map((t, i) => (
                  <motion.button
                    key={t.label}
                    onClick={() => handleTemplate(t.label)}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors text-left"
                  >
                    <span className="text-sm">{t.emoji}</span> {t.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Моя волна */}
        <motion.button
          onClick={handleMyWave}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium bg-white/50 border border-white/70 text-slate-600 hover:bg-white/70 hover:text-slate-800 transition-all"
        >
          <Waves size={13} /> Волна
        </motion.button>
      </div>

      <p className="text-xs text-slate-400 px-0.5">Enter — отправить · Shift+Enter — строка</p>
    </div>
  )
}
