import { useState } from 'react'
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
    } catch {
      toast.error('Ошибка поиска')
    } finally {
      setLoading(false)
    }
  }

  async function handlePlay(track) {
    try {
      await axios.post('/api/command', { text: `включи ${track.title} ${track.artist}` })
      toast.success(`▶ ${track.title}`)
    } catch {
      toast.error('Ошибка запуска')
    }
  }

  function msToMin(ms) {
    if (!ms) return ''
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className="rounded-3xl p-5 flex flex-col gap-3" style={{
      background: 'rgba(255,255,255,0.58)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.75)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    }}>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-0.5">
        Поиск музыки
      </h3>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Название или исполнитель..."
          className="flex-1 rounded-2xl border border-white/60 bg-white/50 px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white/70 transition-all"
        />
        <motion.button
          type="submit"
          disabled={loading || query.trim().length < 2}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors shadow-md shadow-purple-200"
        >
          {loading ? (
            <motion.div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <Search size={16} />
          )}
        </motion.button>
      </form>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            className="flex flex-col gap-0.5 max-h-60 overflow-y-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {results.map((track, i) => (
              <motion.button
                key={track.id}
                onClick={() => handlePlay(track)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-purple-50 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-purple-50 flex-shrink-0 relative">
                  {track.cover_url ? (
                    <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music2 size={14} className="text-purple-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/15 flex items-center justify-center transition-all">
                    <Play size={11} className="text-white opacity-0 group-hover:opacity-100 ml-0.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-purple-700 transition-colors">
                    {track.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                </div>
                <span className="text-xs text-slate-300 flex-shrink-0 tabular-nums">
                  {msToMin(track.duration_ms)}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
