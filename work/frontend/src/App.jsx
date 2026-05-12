import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'

import StatusBadge from '@/components/StatusBadge'
import PlayerCard from '@/components/PlayerCard'
import SearchBlock from '@/components/SearchBlock'
import AliceInput from '@/components/AliceInput'
import PlaylistPanel from '@/components/PlaylistPanel'
import QuickCommands from '@/components/QuickCommands'

// Варианты для stagger-анимации панелей
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
}

const panelVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 28 }
  }
}

const headerVariants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
}

export default function App() {
  const [status, setStatus] = useState({
    online: false, playing: false, volume: 0, aliceState: 'IDLE', track: null
  })

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/status')
      setStatus(data)
    } catch {
      setStatus(s => ({ ...s, online: false }))
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const volumeValue = Math.round((status.volume ?? 0) * 10)

  const handleVolumeChange = useCallback((v) => {
    setStatus(s => ({ ...s, volume: v / 10 }))
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#b8b8bc' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: 'rgba(230,230,235,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.7)',
            color: '#1c1c1e',
            fontSize: '13px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          },
        }}
      />

      {/* Шапка */}
      <motion.header
        className="g-header px-6 py-3 flex items-center justify-between sticky top-0 z-10"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 rounded-xl g-btn-dark flex items-center justify-center text-white text-sm font-semibold"
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            А
          </motion.div>
          <div>
            <h1 className="text-sm font-semibold text-[#1c1c1e] leading-none tracking-tight">Alice Station</h1>
            <p className="text-sm text-[#555558] mt-0.5">Яндекс Станция Миди</p>
          </div>
        </div>
        <StatusBadge online={status.online} aliceState={status.aliceState} />
      </motion.header>

      {/* 2 колонки */}
      <div className="flex-1 flex gap-4 p-4 min-h-0">

        {/* Левая */}
        <motion.div
          className="flex-1 flex flex-col gap-4 overflow-y-auto min-w-0 min-h-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={panelVariants} className="g-panel rounded-3xl overflow-hidden flex-shrink-0">
            <AliceInput />
          </motion.div>
          <motion.div variants={panelVariants} className="flex-shrink-0">
            <PlayerCard
              status={status}
              track={status.track}
              volumeValue={volumeValue}
              onVolumeChange={handleVolumeChange}
            />
          </motion.div>
          <motion.div variants={panelVariants} className="flex-shrink-0">
            <SearchBlock />
          </motion.div>
        </motion.div>

        {/* Правая */}
        <motion.div
          className="flex-1 flex flex-col gap-4 overflow-y-auto min-w-0 min-h-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={panelVariants} className="flex-shrink-0">
            <QuickCommands />
          </motion.div>
          <motion.div variants={panelVariants} className="flex-shrink-0">
            <PlaylistPanel />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
