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

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } }
}

export default function QuickCommands() {
  async function handleCommand(cmd, label) {
    try { await axios.post('/api/command', { text: cmd }); toast.success(label) }
    catch { toast.error('Ошибка') }
  }

  return (
    <div className="g-panel rounded-3xl p-5 flex flex-col gap-2">
      <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-widest mb-1">Подсветка</p>
      <motion.div variants={listVariants} initial="hidden" animate="visible" className="flex flex-col gap-0.5">
        {COMMANDS.map((item) => (
          <motion.button key={item.cmd}
            variants={itemVariants}
            onClick={() => handleCommand(item.cmd, item.label)}
            whileHover={{ x: 5, backgroundColor: 'rgba(0,0,0,0.06)' }}
            whileTap={{ scale: 0.97, x: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="g-row flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left w-full">
            <motion.span
              className="text-xl leading-none w-6 text-center flex-shrink-0"
              whileHover={{ scale: 1.3, rotate: [-5, 5, 0] }}
              transition={{ duration: 0.3 }}
            >
              {item.emoji}
            </motion.span>
            <span className="text-base text-[#3a3a3c] font-medium">{item.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
