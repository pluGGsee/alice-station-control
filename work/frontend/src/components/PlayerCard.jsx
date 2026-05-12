import { motion, AnimatePresence } from 'motion/react'
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
    <div className="g-panel rounded-3xl p-6 flex flex-col items-center gap-4">

      {/* Обложка по центру */}
      <div className="w-36 h-36 rounded-3xl overflow-hidden bg-[rgba(0,0,0,0.08)] flex-shrink-0 shadow-md">
        <AnimatePresence mode="wait">
          {track?.cover_url ? (
            <motion.img key={track.cover_url} src={track.cover_url} alt="cover"
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }} />
          ) : (
            <motion.div key="ph" className="w-full h-full flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Music2 size={40} className="text-[#8e8e93]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Название и исполнитель */}
      <div className="text-center min-w-0 w-full px-2">
        <AnimatePresence mode="wait">
          <motion.div key={track?.id ?? 'empty'}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            <p className="font-semibold text-[#1c1c1e] text-base truncate leading-snug">
              {track?.title ?? 'Ничего не играет'}
            </p>
            <p className="text-[#8e8e93] text-sm truncate mt-1">
              {track?.artist ?? '—'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Индикатор воспроизведения */}
      {isPlaying && (
        <div className="flex items-end gap-0.5 h-3">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-1 bg-[#3a3a3c] rounded-full"
              animate={{ height: ['3px', '12px', '3px'] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }} />
          ))}
        </div>
      )}

      {/* Кнопки управления */}
      <div className="flex items-center gap-4">
        <motion.button onClick={() => post('/api/prev')}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="g-btn w-10 h-10 rounded-2xl flex items-center justify-center text-[#3a3a3c]">
          <SkipBack size={17} />
        </motion.button>

        <motion.button onClick={() => post(isPlaying ? '/api/pause' : '/api/play')}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="g-btn-dark w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div key={isPlaying ? 'pause' : 'play'}
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.12 }}>
              {isPlaying
                ? <Pause size={20} className="text-[#f0f0f0]" />
                : <Play size={20} className="text-[#f0f0f0] ml-0.5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button onClick={() => post('/api/next')}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="g-btn w-10 h-10 rounded-2xl flex items-center justify-center text-[#3a3a3c]">
          <SkipForward size={17} />
        </motion.button>
      </div>

      {/* Громкость */}
      <div className="flex items-center gap-3 w-full">
        <Volume2 size={13} className="text-[#8e8e93] flex-shrink-0" />
        <Slider min={0} max={10} step={1} value={[volume]} onValueChange={handleVolume} className="flex-1" />
        <span className="text-xs text-[#8e8e93] w-4 text-right tabular-nums">{volume}</span>
      </div>
    </div>
  )
}
