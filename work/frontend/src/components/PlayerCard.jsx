import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react'
import { SkipBack, SkipForward, Play, Pause, Volume2, Music2 } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function PlayerCard({ status, track, onVolumeChange, volumeValue }) {
  const volume = volumeValue ?? Math.round((status?.volume ?? 0) * 10)
  const isPlaying = status?.playing ?? false

  async function post(url) { try { await axios.post(url) } catch { toast.error('Ошибка') } }
  async function handleVolume(val) {
    const v = Array.isArray(val) ? val[0] : val
    try { await axios.post('/api/volume', { value: v }); onVolumeChange?.(v) } catch {}
  }

  return (
    <motion.div
      className="g-panel rounded-3xl p-6 flex flex-col items-center gap-4"
      layout
    >
      {/* Обложка с ambient glow */}
      <div className="relative">
        {/* Glow под обложкой когда играет */}
        <AnimatePresence>
          {isPlaying && track?.cover_url && (
            <motion.div
              key="glow"
              className="absolute inset-0 rounded-3xl blur-2xl scale-95"
              style={{ backgroundImage: `url(${track.cover_url})`, backgroundSize: 'cover' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="relative w-64 h-64 rounded-3xl overflow-hidden bg-[rgba(0,0,0,0.08)] shadow-lg"
          animate={isPlaying ? {
            boxShadow: [
              '0 8px 32px rgba(0,0,0,0.15)',
              '0 12px 48px rgba(0,0,0,0.22)',
              '0 8px 32px rgba(0,0,0,0.15)',
            ]
          } : { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
          transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }}
        >
          <AnimatePresence mode="wait">
            {track?.cover_url ? (
              <motion.img key={track.cover_url} src={track.cover_url} alt="cover"
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
            ) : (
              <motion.div key="ph" className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Music2 size={52} className="text-[#8e8e93]" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Название и исполнитель */}
      <div className="text-center min-w-0 w-full px-2">
        <AnimatePresence mode="wait">
          <motion.div key={track?.id ?? 'empty'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <p className="font-bold text-[#1c1c1e] text-lg truncate leading-snug">
              {track?.title ?? 'Ничего не играет'}
            </p>
            <p className="text-[#555558] text-sm font-medium truncate mt-1">
              {track?.artist ?? '—'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Индикатор воспроизведения */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            className="flex items-end gap-0.5 h-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {[0, 1, 2, 3].map(i => (
              <motion.div key={i} className="w-0.5 bg-[#3a3a3c] rounded-full"
                animate={{ height: ['3px', '12px', '5px', '10px', '3px'] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопки */}
      <div className="flex items-center gap-4">
        <motion.button onClick={() => post('/api/prev')}
          whileHover={{ scale: 1.12, x: -2 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="g-btn w-10 h-10 rounded-2xl flex items-center justify-center text-[#3a3a3c]">
          <SkipBack size={17} />
        </motion.button>

        <motion.button onClick={() => post(isPlaying ? '/api/pause' : '/api/play')}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="g-btn-dark w-14 h-14 rounded-2xl flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={isPlaying ? 'pause' : 'play'}
              initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
              {isPlaying
                ? <Pause size={20} className="text-[#f0f0f0]" />
                : <Play size={20} className="text-[#f0f0f0] ml-0.5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button onClick={() => post('/api/next')}
          whileHover={{ scale: 1.12, x: 2 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="g-btn w-10 h-10 rounded-2xl flex items-center justify-center text-[#3a3a3c]">
          <SkipForward size={17} />
        </motion.button>
      </div>

      {/* Громкость */}
      <div className="flex items-center gap-2 w-72">
        <motion.div whileHover={{ scale: 1.2 }} transition={{ type: 'spring', stiffness: 400 }}>
          <Volume2 size={13} className="text-[#8e8e93] flex-shrink-0" />
        </motion.div>
        <Slider min={0} max={10} step={1} value={[volume]} onValueChange={handleVolume} className="flex-1" />
        <motion.span
          key={volume}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="text-xs text-[#8e8e93] w-4 text-right tabular-nums"
        >
          {volume}
        </motion.span>
      </div>
    </motion.div>
  )
}
