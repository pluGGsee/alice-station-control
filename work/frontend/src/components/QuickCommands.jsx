import { motion } from 'motion/react'
import axios from 'axios'
import toast from 'react-hot-toast'

const COMMANDS = [
  { label: 'Включи джаз',       emoji: '🎷', cmd: 'включи джаз' },
  { label: 'Моя волна',         emoji: '🌊', cmd: 'включи мою волну' },
  { label: 'Анекдот',           emoji: '😄', cmd: 'расскажи анекдот' },
  { label: 'Погода',            emoji: '🌤', cmd: 'какая погода' },
  { label: 'Красный свет',      emoji: '🔴', cmd: 'включи красный' },
  { label: 'Без подсветки',     emoji: '💡', cmd: 'выключи подсветку' },
  { label: 'Доброе утро',       emoji: '☀️', cmd: 'доброе утро' },
  { label: 'Тихий режим',       emoji: '🤫', cmd: 'сделай тише' },
]

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
    <motion.div
      className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="font-semibold text-slate-700 text-sm">Быстрые команды</h3>
      <div className="grid grid-cols-4 gap-2">
        {COMMANDS.map((item, i) => (
          <motion.button
            key={item.cmd}
            onClick={() => handleCommand(item.cmd, item.label)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/70 hover:bg-purple-50 border border-white/60 hover:border-purple-200 text-slate-700 hover:text-purple-700 transition-all shadow-sm"
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs font-medium leading-tight text-center">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
