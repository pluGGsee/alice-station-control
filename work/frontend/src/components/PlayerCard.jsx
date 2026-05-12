import { motion } from 'motion/react'
import { SkipBack, SkipForward, Play, Pause, Volume2 } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function PlayerCard({ status, track, onVolumeChange, volumeValue }) {
  const volume = volumeValue ?? Math.round((status?.volume ?? 0) * 10)

  async function handlePlay() {
    await axios.post('/api/play')
  }
  async function handlePause() {
    await axios.post('/api/pause')
  }
  async function handleNext() {
    await axios.post('/api/next')
    toast.success('Следующий трек')
  }
  async function handlePrev() {
    await axios.post('/api/prev')
    toast.success('Предыдущий трек')
  }
  async function handleVolume(val) {
    const v = Array.isArray(val) ? val[0] : val
    await axios.post('/api/volume', { value: v })
    onVolumeChange?.(v)
  }

  const isPlaying = status?.playing ?? false

  return (
    <motion.div
      className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 flex flex-col gap-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Обложка + инфо о треке */}
      <div className="flex items-center gap-4">
        <motion.div
          className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-100 flex-shrink-0 shadow-md"
          animate={{ rotate: isPlaying ? [0, 2, -2, 0] : 0 }}
          transition={{ duration: 4, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }}
        >
          {track?.cover_url ? (
            <img src={track.cover_url} alt="cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🎵</div>
          )}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate text-sm">
            {track?.title ?? 'Ничего не играет'}
          </p>
          <p className="text-slate-500 text-xs truncate mt-0.5">
            {track?.artist ?? '—'}
          </p>
          {track?.album && (
            <p className="text-slate-400 text-xs truncate mt-0.5">{track.album}</p>
          )}
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          onClick={handlePrev}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
        >
          <SkipBack size={20} />
        </motion.button>

        <motion.button
          onClick={isPlaying ? handlePause : handlePlay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-200 transition-colors"
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </motion.button>

        <motion.button
          onClick={handleNext}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-xl text-slate-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
        >
          <SkipForward size={20} />
        </motion.button>
      </div>

      {/* Громкость */}
      <div className="flex items-center gap-3">
        <Volume2 size={16} className="text-slate-400 flex-shrink-0" />
        <Slider
          min={0}
          max={10}
          step={1}
          value={[volume]}
          onValueChange={handleVolume}
          className="flex-1"
        />
        <span className="text-xs text-slate-400 w-4 text-right">{volume}</span>
      </div>
    </motion.div>
  )
}
