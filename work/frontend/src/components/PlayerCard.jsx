import { motion, AnimatePresence } from 'motion/react'
import { SkipBack, SkipForward, Play, Pause, Volume2, Music2 } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function PlayerCard({ status, track, onVolumeChange, volumeValue }) {
  const volume = volumeValue ?? Math.round((status?.volume ?? 0) * 10)
  const isPlaying = status?.playing ?? false

  async function handlePlay() {
    try { await axios.post('/api/play') } catch { toast.error('Ошибка') }
  }
  async function handlePause() {
    try { await axios.post('/api/pause') } catch { toast.error('Ошибка') }
  }
  async function handleNext() {
    try { await axios.post('/api/next'); toast.success('Следующий трек') } catch { toast.error('Ошибка') }
  }
  async function handlePrev() {
    try { await axios.post('/api/prev'); toast.success('Предыдущий трек') } catch { toast.error('Ошибка') }
  }
  async function handleVolume(val) {
    const v = Array.isArray(val) ? val[0] : val
    try { await axios.post('/api/volume', { value: v }); onVolumeChange?.(v) } catch { /* silent */ }
  }

  return (
    <div className="glass-panel rounded-3xl p-5 flex flex-col gap-4">
      {/* Трек */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-purple-50 flex-shrink-0 shadow-sm">
          <AnimatePresence mode="wait">
            {track?.cover_url ? (
              <motion.img
                key={track.cover_url}
                src={track.cover_url}
                alt="cover"
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <motion.div
                key="placeholder"
                className="w-full h-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Music2 size={22} className="text-purple-300" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={track?.id ?? 'empty'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-semibold text-slate-800 truncate text-sm">
                {track?.title ?? 'Ничего не играет'}
              </p>
              <p className="text-slate-500 text-xs truncate mt-0.5">
                {track?.artist ?? (isPlaying ? 'Воспроизведение...' : '—')}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {isPlaying && (
          <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1 bg-purple-500 rounded-full"
                animate={{ height: ['4px', '14px', '4px'] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Управление */}
      <div className="flex items-center justify-center gap-3">
        <motion.button
          onClick={handlePrev}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-purple-50 hover:text-purple-600 transition-colors"
        >
          <SkipBack size={18} />
        </motion.button>

        <motion.button
          onClick={isPlaying ? handlePause : handlePlay}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="w-12 h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-200 transition-colors"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isPlaying ? 'pause' : 'play'}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button
          onClick={handleNext}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="p-2.5 rounded-xl text-slate-500 hover:bg-purple-50 hover:text-purple-600 transition-colors"
        >
          <SkipForward size={18} />
        </motion.button>
      </div>

      {/* Громкость */}
      <div className="flex items-center gap-3">
        <Volume2 size={14} className="text-slate-400 flex-shrink-0" />
        <Slider
          min={0} max={10} step={1}
          value={[volume]}
          onValueChange={handleVolume}
          className="flex-1"
        />
        <span className="text-xs text-slate-400 w-4 text-right tabular-nums">{volume}</span>
      </div>
    </div>
  )
}
