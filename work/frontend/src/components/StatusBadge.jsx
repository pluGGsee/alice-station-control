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
                className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </>
          ) : (
            <motion.span
              key="offline"
              className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </AnimatePresence>
      </div>
      <span className="text-xs font-medium text-slate-600">
        {online ? (aliceState === 'IDLE' ? 'Онлайн' : 'Слушает...') : 'Офлайн'}
      </span>
    </div>
  )
}
