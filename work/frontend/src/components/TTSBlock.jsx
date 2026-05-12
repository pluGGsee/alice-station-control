import { useState } from 'react'
import { motion } from 'motion/react'
import { Send, Mic } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function TTSBlock() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSay() {
    if (!text.trim()) return
    setLoading(true)
    try {
      await axios.post('/api/say', { text: text.trim() })
      toast.success('Алиса говорит!')
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
      handleSay()
    }
  }

  return (
    <motion.div
      className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex items-center gap-2">
        <Mic size={18} className="text-purple-500" />
        <h3 className="font-semibold text-slate-700 text-sm">Сказать Алисе</h3>
      </div>

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Введи текст — Алиса озвучит на колонке..."
          rows={2}
          className="flex-1 resize-none rounded-2xl border border-white/60 bg-white/50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
        />
        <motion.button
          onClick={handleSay}
          disabled={!text.trim() || loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-full min-h-[72px] rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center shadow-lg shadow-purple-200 transition-colors flex-shrink-0"
        >
          {loading ? (
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <Send size={16} />
          )}
        </motion.button>
      </div>
      <p className="text-xs text-slate-400">Enter — отправить, Shift+Enter — новая строка</p>
    </motion.div>
  )
}
