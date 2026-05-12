import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Music2, Play } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function SearchBlock() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (query.trim().length < 2) return
    setLoading(true)
    try {
      const { data } = await axios.get(`/api/music/search?q=${encodeURIComponent(query)}`)
      setResults(data.results)
      if (!data.results.length) toast('Ничего не найдено')
    } catch { toast.error('Ошибка поиска') } finally { setLoading(false) }
  }

  async function handlePlay(track) {
    try { await axios.post('/api/command', { text: `включи ${track.title} ${track.artist}` }); toast.success(`▶ ${track.title}`) }
    catch { toast.error('Ошибка') }
  }

  function msToMin(ms) {
    if (!ms) return ''
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className="g-panel rounded-3xl p-5 flex flex-col gap-3">
      <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-widest">Поиск музыки</p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <motion.input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Название или исполнитель..."
          className="g-input flex-1 rounded-2xl px-4 py-2.5 text-sm"
          whileFocus={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
        <motion.button type="submit" disabled={loading || query.trim().length < 2}
          whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
          className="g-btn-dark px-4 py-2.5 rounded-2xl disabled:opacity-40 flex items-center justify-center">
          {loading
            ? <motion.div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full" animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}/>
            : <Search size={15} className="text-[#f0f0f0]"/>
          }
        </motion.button>
      </form>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto"
            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            {results.map((track, i) => (
              <motion.button key={track.id} onClick={() => handlePlay(track)}
                initial={{ opacity:0, x:-10, scale: 0.97 }}
                animate={{ opacity:1, x:0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, delay: i * 0.04 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className="g-row w-full flex items-center gap-3 p-2 rounded-2xl text-left group transition-colors">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/8 flex-shrink-0 relative">
                  {track.cover_url
                    ? <img src={track.cover_url} alt="" className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center"><Music2 size={13} className="text-[#8e8e93]"/></div>
                  }
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                    <Play size={11} className="text-white opacity-0 group-hover:opacity-100 ml-0.5"/>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1c1c1e] truncate">{track.title}</p>
                  <p className="text-sm text-[#555558] truncate">{track.artist}</p>
                </div>
                <span className="text-sm text-[#6e6e73] flex-shrink-0 tabular-nums">{msToMin(track.duration_ms)}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
