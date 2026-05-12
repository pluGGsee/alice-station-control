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
    <div className="g-panel rounded-3xl p-5 flex flex-col gap-4">
      {/* Трек */}
      <div className="flex items-center gap-3">
        <div className="w-13 h-13 w-[52px] h-[52px] rounded-2xl overflow-hidden bg-[rgba(0,0,0,0.08)] flex-shrink-0">
          <AnimatePresence mode="wait">
            {track?.cover_url ? (
              <motion.img key={track.cover_url} src={track.cover_url} alt="cover"
                className="w-full h-full object-cover"
                initial={{ opacity:0, scale:1.05 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }} />
            ) : (
              <motion.div key="ph" className="w-full h-full flex items-center justify-center"
                initial={{ opacity:0 }} animate={{ opacity:1 }}>
                <Music2 size={20} className="text-[#8e8e93]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={track?.id ?? 'empty'}
              initial={{ opacity:0, y:3 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-3 }} transition={{ duration:0.2 }}>
              <p className="font-semibold text-[#1c1c1e] truncate text-sm">{track?.title ?? 'Ничего не играет'}</p>
              <p className="text-[#8e8e93] text-xs truncate mt-0.5">{track?.artist ?? '—'}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {isPlaying && (
          <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-1 bg-[#3a3a3c] rounded-full"
                animate={{ height: ['4px','14px','4px'] }}
                transition={{ duration:0.8, repeat:Infinity, delay:i*0.2, ease:'easeInOut' }} />
            ))}
          </div>
        )}
      </div>

      {/* Управление */}
      <div className="flex items-center justify-center gap-3">
        <motion.button onClick={() => post('/api/prev')} whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
          className="g-btn p-2.5 rounded-xl text-[#3a3a3c]"><SkipBack size={17}/></motion.button>

        <motion.button onClick={() => post(isPlaying ? '/api/pause' : '/api/play')}
          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
          className="g-btn-dark w-12 h-12 rounded-2xl flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={isPlaying ? 'pause':'play'}
              initial={{ scale:0.7, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.7, opacity:0 }} transition={{ duration:0.12 }}>
              {isPlaying ? <Pause size={19} className="text-[#f0f0f0]"/> : <Play size={19} className="text-[#f0f0f0] ml-0.5"/>}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button onClick={() => post('/api/next')} whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
          className="g-btn p-2.5 rounded-xl text-[#3a3a3c]"><SkipForward size={17}/></motion.button>
      </div>

      {/* Громкость */}
      <div className="flex items-center gap-3">
        <Volume2 size={13} className="text-[#8e8e93] flex-shrink-0" />
        <Slider min={0} max={10} step={1} value={[volume]} onValueChange={handleVolume} className="flex-1" />
        <span className="text-xs text-[#8e8e93] w-4 text-right tabular-nums">{volume}</span>
      </div>
    </div>
  )
}
