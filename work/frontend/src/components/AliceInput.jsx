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

  // Инициализация Web Speech API
  const speechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  async function handleSend(cmd) {
    const value = (cmd || text).trim()
    if (!value) return
    setLoading(true)
    try {
      await axios.post('/api/command', { text: value })
      toast.success(`✓ ${value.length > 30 ? value.slice(0, 30) + '...' : value}`)
      setText('')
    } catch {
      toast.error('Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleMic() {
    if (!speechSupported) {
      toast.error('Браузер не поддерживает диктовку. Используйте Chrome или Edge.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'ru-RU'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      toast.error('Ошибка микрофона')
    }
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setText(transcript)
      // Автоотправка после диктовки
      setTimeout(() => handleSend(transcript), 100)
    }

    recognitionRef.current = recognition
    recognition.start()
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
    } catch {
      toast.error('Ошибка')
    }
  }

  // Закрыть шаблоны при клике вне
  useEffect(() => {
    if (!showTemplates) return
    const handler = (e) => {
      if (!e.target.closest('[data-templates]')) setShowTemplates(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showTemplates])

  return (
    <div className="p-4 flex flex-col gap-3">
      <p className="text-xs font-medium text-white/40 uppercase tracking-widest px-1">
        Алиса
      </p>

      {/* Поле ввода */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Скажи что-нибудь Алисе..."
          rows={3}
          className="w-full resize-none rounded-2xl px-4 py-3 pr-10 text-sm text-white/90 placeholder:text-white/30 bg-white/10 border border-white/15 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all leading-relaxed"
        />
        {/* Кнопка отправить */}
        <motion.button
          onClick={() => handleSend()}
          disabled={!text.trim() || loading}
          whileTap={{ scale: 0.9 }}
          className="absolute right-2.5 bottom-2.5 w-7 h-7 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
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
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium transition-all border ${
            listening
              ? 'bg-red-500/80 border-red-400/50 text-white'
              : 'bg-white/10 border-white/15 text-white/70 hover:bg-white/15 hover:text-white'
          }`}
        >
          {listening ? (
            <>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                <MicOff size={14} />
              </motion.div>
              Стоп
            </>
          ) : (
            <>
              <Mic size={14} />
              Диктовка
            </>
          )}
        </motion.button>

        {/* Шаблоны */}
        <div className="relative flex-1" data-templates>
          <motion.button
            onClick={() => setShowTemplates(v => !v)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium transition-all border ${
              showTemplates
                ? 'bg-purple-600/80 border-purple-400/50 text-white'
                : 'bg-white/10 border-white/15 text-white/70 hover:bg-white/15 hover:text-white'
            }`}
          >
            <LayoutTemplate size={14} />
            Шаблоны
          </motion.button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-2xl overflow-hidden"
                style={{ background: 'rgba(20,16,38,0.96)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
              >
                {TEMPLATES.map((t, i) => (
                  <motion.button
                    key={t.label}
                    onClick={() => handleTemplate(t.label)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left"
                  >
                    <span className="text-base leading-none">{t.emoji}</span>
                    {t.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Моя волна */}
        <motion.button
          onClick={handleMyWave}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-medium bg-white/10 border border-white/15 text-white/70 hover:bg-white/15 hover:text-white transition-all"
        >
          <Waves size={14} />
          Волна
        </motion.button>
      </div>

      <p className="text-xs text-white/25 px-1">Enter — отправить · Shift+Enter — новая строка</p>
    </div>
  )
}
