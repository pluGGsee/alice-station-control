import { motion } from 'motion/react'
import axios from 'axios'
import toast from 'react-hot-toast'

const COMMANDS = [
  { label: 'Включи джаз',      emoji: '🎷', cmd: 'включи джаз' },
  { label: 'Моя волна',        emoji: '🌊', cmd: 'включи мою волну' },
  { label: 'Расскажи анекдот', emoji: '😄', cmd: 'расскажи анекдот' },
  { label: 'Какая погода?',    emoji: '🌤', cmd: 'какая погода' },
  { label: 'Красный свет',     emoji: '🔴', cmd: 'включи красный' },
  { label: 'Без подсветки',    emoji: '💡', cmd: 'выключи подсветку' },
  { label: 'Доброе утро',      emoji: '☀️', cmd: 'доброе утро' },
  { label: 'Тихий режим',      emoji: '🤫', cmd: 'сделай тише' },
]

const panelStyle = {
  background: 'rgba(255,255,255,0.58)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.75)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
}

export default function QuickCommands() {
  async function handleCommand(cmd, label) {
    try {
      await axios.post('/api/command', { text: cmd })
      toast.success(label)
    } catch {
      toast.error('Ошибка команды')
    }
  }

  return (
    <div className="rounded-3xl p-5 flex flex-col gap-3" style={panelStyle}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Быстрые команды</p>
      <div className="flex flex-col gap-1">
        {COMMANDS.map((item, i) => (
          <motion.button
            key={item.cmd}
            onClick={() => handleCommand(item.cmd, item.label)}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ x: 4, backgroundColor: 'rgba(124,58,237,0.06)' }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors group"
          >
            <span className="text-lg leading-none w-6 text-center flex-shrink-0">{item.emoji}</span>
            <span className="text-sm text-slate-700 group-hover:text-purple-700 transition-colors font-medium">
              {item.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
