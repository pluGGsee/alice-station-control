# Alice Station Control

Local web service for Yandex Station Midi (pink, `192.168.0.x`). Python FastAPI + React frontend. **MVP complete.**

## Commands

```bash
# Backend
cd work/backend && source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload   # dev
uvicorn main:app --host 0.0.0.0 --port 8000             # prod

# Frontend
cd work/frontend && npm run dev   # :5174, proxies /api → :8000

# Autostart (launchd, already installed — starts on home network 192.168.0.x)
launchctl load   ~/Library/LaunchAgents/com.alice-station.server.plist
launchctl unload ~/Library/LaunchAgents/com.alice-station.server.plist
tail -f ~/Library/Logs/alice-station.log
```

## Re-auth (tokens expire ~weeks — main failure mode)

**SESSION_ID / SESSION_ID2** → browser devtools → Application → Cookies → yandex.ru → copy `Session_id` + `sessionid2`

**YANDEX_TOKEN** → `cd work/backend && python3 get_token.py`

**YANDEX_XTOKEN** → browser: `https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d` → copy `access_token` from redirect URL

All tokens → `work/backend/config.py` (gitignored). `DEVICE_ID=R10G034001ZSQN`, `PLATFORM=cucumber` — never change.

## Architecture

**`config.py`** — gitignored. `STATION_IP=192.168.0.102`, `STATION_PORT=1961`.

**`station.py`** — Glagol WebSocket. Persistent `_ws` global — reuses for all commands (status/volume ~20ms vs ~1000ms). `asyncio.Lock` serializes concurrent commands. Track info from `playerState` in handshake — **always use `/api/status` → `track`, not `/api/music/current`**. Glagol JWT auto-refreshes every 1h.

**`music.py`** — `yandex-music` wrapper. `get_playlist_tracks()` uses bulk `client.tracks(batch_ids)` — one call for 50 tracks.

**`yandex_glagol.py`, `yandex_quasar.py`, `yandex_session.py`** — copied from AlexxIT/YandexStation v3.20.3. Not pip-installable. Relative imports patched to absolute.

**Frontend** (`work/frontend/src/`): grey liquid glass design. `g-panel`, `g-btn`, `g-input` CSS classes. Status polled every 5s. `motion/react` animations. `createPortal(document.body)` for modals/dropdowns.

## Key Constraints

- `sendText` is the only command API — TTS, voice, light modes, track control. ~1s = station processing time.
- Volume: Glagol uses `0.0–1.0`, API accepts `0–10`.
- Light modes on Midi: `включи лава-лампу`, `включи режим свеча`, `включи ночник` + color names.
- Playlist covers: no API — uploaded via `/api/music/playlist-cover`, stored in `static/covers/`, fallback to `localStorage`.
- Works only on home network `192.168.0.x` — launchd stops when leaving network.

## v2 Roadmap (deferred)

Multi-device (infrastructure exists: `load_local_speakers()` in `yandex_quasar.py`, mDNS in `yandex_glagol.py`), setup wizard, schedules/timers, dark theme, Docker for Windows, production build.
