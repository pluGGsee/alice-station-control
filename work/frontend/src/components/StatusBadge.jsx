import { motion, AnimatePresence } from 'motion/react'

export default function StatusBadge({ online, aliceState }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-2.5 h-2.5">
        <AnimatePresence mode="wait">
          {online ? (
            <>
              <motion.span
                key="ping"
                className="absolute inline-flex h-full w-full rounded-full bg-[#34c759] opacity-60"
                animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34c759]" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8e8e93]" />
          )}
        </AnimatePresence>
      </div>
      <span className="text-xs font-medium text-[#6e6e73]">
        {online ? (aliceState === 'IDLE' ? 'Онлайн' : 'Слушает...') : 'Офлайн'}
      </span>
    </div>
  )
}
