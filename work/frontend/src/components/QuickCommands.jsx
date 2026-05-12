import { motion } from 'motion/react'
import axios from 'axios'
import toast from 'react-hot-toast'

const COMMANDS = [
  { label: 'Включить подсветку', emoji: '💡', cmd: 'включи подсветку' },
  { label: 'Выключить подсветку', emoji: '🌑', cmd: 'выключи подсветку' },
  { label: 'Лава-лампа',         emoji: '🌈', cmd: 'включи лава-лампу' },
  { label: 'Свеча',              emoji: '🕯️', cmd: 'включи режим свеча' },
  { label: 'Ночник',             emoji: '🌙', cmd: 'включи ночник' },
  { label: 'Красный',            emoji: '🔴', cmd: 'включи красный' },
  { label: 'Синий',              emoji: '🔵', cmd: 'включи синий' },
  { label: 'Зелёный',            emoji: '🟢', cmd: 'включи зелёный' },
]

export default function QuickCommands() {
  async function handleCommand(cmd, label) {
    try { await axios.post('/api/command', { text: cmd }); toast.success(label) }
    catch { toast.error('Ошибка') }
  }

  return (
    <div className="g-panel rounded-3xl p-5 flex flex-col gap-2">
      <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-widest mb-1">Подсветка</p>
      {COMMANDS.map((item, i) => (
        <motion.button key={item.cmd}
          onClick={() => handleCommand(item.cmd, item.label)}
          initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
          whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
          className="g-row flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors w-full">
          <span className="text-xl leading-none w-6 text-center flex-shrink-0">{item.emoji}</span>
          <span className="text-base text-[#3a3a3c] font-medium">{item.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
