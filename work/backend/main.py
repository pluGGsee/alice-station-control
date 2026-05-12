import warnings
import os
import shutil
warnings.filterwarnings("ignore")

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

import station
import music

app = FastAPI(title="Alice Station Control")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Папка для пользовательских обложек плейлистов
COVERS_DIR = os.path.join(os.path.dirname(__file__), "static", "covers")
os.makedirs(COVERS_DIR, exist_ok=True)

# Отдаём статику обложек
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")


# --- Schemas ---

class TextPayload(BaseModel):
    text: str

class VolumePayload(BaseModel):
    value: int  # 0–10

class TrackPayload(BaseModel):
    track_id: str


# --- Station endpoints ---

@app.get("/api/status")
async def get_status():
    return await station.get_status()

@app.post("/api/play")
async def play():
    await station.play()
    return {"ok": True}

@app.post("/api/pause")
async def pause():
    await station.pause()
    return {"ok": True}

@app.post("/api/next")
async def next_track():
    await station.next_track()
    return {"ok": True}

@app.post("/api/prev")
async def prev_track():
    await station.prev_track()
    return {"ok": True}

@app.post("/api/volume")
async def set_volume(payload: VolumePayload):
    if not 0 <= payload.value <= 10:
        raise HTTPException(status_code=400, detail="Volume must be 0–10")
    await station.set_volume(payload.value)
    return {"ok": True}

@app.post("/api/say")
async def say(payload: TextPayload):
    await station.send_tts(payload.text)
    return {"ok": True}

@app.post("/api/command")
async def command(payload: TextPayload):
    await station.send_command(payload.text)
    return {"ok": True}


# --- Music endpoints ---

@app.get("/api/music/current")
def current_track():
    track = music.get_current_track()
    return track if track else {}

@app.get("/api/music/search")
def search(q: str):
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query too short")
    return {"results": music.search_tracks(q.strip())}

@app.get("/api/music/playlists")
def playlists():
    return {"playlists": music.get_playlists()}

@app.get("/api/music/playlist-tracks")
def playlist_tracks(kind: int, offset: int = 0, limit: int = 50):
    return {"tracks": music.get_playlist_tracks(kind, offset=offset, limit=limit)}

@app.post("/api/music/play-track")
async def play_track(payload: TrackPayload):
    tracks = music.search_tracks(payload.track_id, limit=1)
    if tracks:
        t = tracks[0]
        await station.send_command(f"включи {t['title']} {t['artist']}")
    return {"ok": True}

@app.post("/api/music/playlist-cover")
async def upload_playlist_cover(kind: str = Form(...), file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    path = os.path.join(COVERS_DIR, f"{kind}.{ext}")
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"ok": True, "url": f"/static/covers/{kind}.{ext}"}


# --- Static frontend (после npm run build) ---

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/")
    def root():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
