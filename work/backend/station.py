import asyncio
import json
import ssl
import time
import logging
import warnings
warnings.filterwarnings("ignore")

import aiohttp

from config import (
    YANDEX_XTOKEN, SESSION_ID, SESSION_ID2,
    STATION_IP, STATION_PORT, DEVICE_ID, PLATFORM, YANDEX_TOKEN
)
from yandex_session import YandexSession

logger = logging.getLogger(__name__)

# ── Glagol token cache ──────────────────────────────────────────────────────
_glagol_token: str | None = None
_glagol_token_expires: float = 0

# ── Persistent WebSocket connection ────────────────────────────────────────
_ws: aiohttp.ClientWebSocketResponse | None = None
_ws_http: aiohttp.ClientSession | None = None
_ws_lock = asyncio.Lock()          # сериализация команд
_last_state: dict = {}             # последний известный state от колонки
_reconnect_task: asyncio.Task | None = None

# ── HTTP session для авторизации ────────────────────────────────────────────
_auth_http: aiohttp.ClientSession | None = None


def _get_auth_http() -> aiohttp.ClientSession:
    global _auth_http
    if _auth_http is None or _auth_http.closed:
        cookies = {"Session_id": SESSION_ID, "sessionid2": SESSION_ID2}
        _auth_http = aiohttp.ClientSession(cookies=cookies)
    return _auth_http


def _ssl_ctx() -> ssl.SSLContext:
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


async def _get_glagol_token() -> str:
    global _glagol_token, _glagol_token_expires
    if _glagol_token and time.time() < _glagol_token_expires:
        return _glagol_token

    http = _get_auth_http()
    session = YandexSession(http, x_token=YANDEX_XTOKEN)
    session.music_token = YANDEX_TOKEN
    r = await session.request_glagol(
        f"https://quasar.yandex.net/glagol/token"
        f"?device_id={DEVICE_ID}&platform={PLATFORM}"
    )
    data = await r.json()
    _glagol_token = data["token"]
    _glagol_token_expires = time.time() + 3600
    logger.debug("Glagol token refreshed")
    return _glagol_token


def _make_msg(token: str, payload: dict) -> str:
    return json.dumps({
        "conversationToken": token,
        "id": DEVICE_ID,
        "payload": payload,
        "sentTime": int(time.time() * 1000),
    })


async def _ensure_connected() -> aiohttp.ClientWebSocketResponse | None:
    """Вернуть активный WebSocket, переподключиться если нужно."""
    global _ws, _ws_http

    if _ws and not _ws.closed:
        return _ws

    # Закрываем старую сессию если есть
    if _ws_http and not _ws_http.closed:
        await _ws_http.close()

    try:
        token = await _get_glagol_token()
        _ws_http = aiohttp.ClientSession()
        ws = await _ws_http.ws_connect(
            f"wss://{STATION_IP}:{STATION_PORT}",
            ssl=_ssl_ctx(),
            heartbeat=10,
        )
        # Handshake — получаем первый state
        await ws.send_str(_make_msg(token, {"softwareVersion": "1.0"}))
        msg = await asyncio.wait_for(ws.receive(), timeout=5)
        data = json.loads(msg.data)
        _last_state.update(data.get("state", {}))
        _ws = ws
        logger.info("WebSocket connected to station")
        return _ws
    except Exception as e:
        logger.error(f"WebSocket connect failed: {e}")
        _ws = None
        return None


async def _send_raw(payload: dict) -> dict | None:
    """Отправить команду через persistent WebSocket."""
    async with _ws_lock:
        token = await _get_glagol_token()
        ws = await _ensure_connected()
        if not ws:
            return None

        try:
            await ws.send_str(_make_msg(token, payload))
            # Читаем ответ с коротким таймаутом
            msg = await asyncio.wait_for(ws.receive(), timeout=4)
            if msg.type == aiohttp.WSMsgType.TEXT:
                data = json.loads(msg.data)
                _last_state.update(data.get("state", {}))
                return data
            return None
        except (asyncio.TimeoutError, ConnectionResetError):
            # Соединение упало — сбрасываем для переподключения
            logger.warning("WebSocket lost, will reconnect on next request")
            global _ws
            _ws = None
            return None
        except Exception as e:
            logger.error(f"Send error: {e}")
            _ws = None
            return None


# ── Публичные методы ────────────────────────────────────────────────────────

async def get_status() -> dict:
    """Статус + трек. Использует кешированный state если WS недоступен."""
    # Пробуем получить свежий state
    data = None
    async with _ws_lock:
        token = await _get_glagol_token()
        ws = await _ensure_connected()
        if ws:
            try:
                await ws.send_str(_make_msg(token, {"softwareVersion": "1.0"}))
                msg = await asyncio.wait_for(ws.receive(), timeout=4)
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    _last_state.update(data.get("state", {}))
            except Exception:
                global _ws
                _ws = None

    state = (data or {}).get("state", _last_state)
    if not state and not data:
        return {"online": False, "playing": False, "volume": 0, "aliceState": "IDLE", "track": None}

    player = state.get("playerState", {})
    extra = player.get("extra", {})

    track = None
    title = player.get("title")
    if title:
        cover_uri = extra.get("coverURI")
        cover_url = ("https://" + cover_uri.replace("%%", "400x400")) if cover_uri else None
        track = {
            "title": title,
            "artist": player.get("subtitle", ""),
            "cover_url": cover_url,
            "duration": player.get("duration"),
            "progress": player.get("progress"),
            "playlist_type": player.get("playlistType"),
        }

    return {
        "online": True,
        "playing": state.get("playing", False),
        "volume": state.get("volume", 0),
        "aliceState": state.get("aliceState", "IDLE"),
        "track": track,
    }


async def send_tts(text: str):
    await _send_raw({"command": "sendText", "text": text})


async def send_command(text: str):
    await _send_raw({"command": "sendText", "text": text})


async def set_volume(value: int):
    vol = max(0, min(10, value)) / 10
    await _send_raw({"command": "setVolume", "volume": vol})


async def play():
    await _send_raw({"command": "play"})


async def pause():
    await _send_raw({"command": "stop"})


async def next_track():
    await send_command("следующий трек")


async def prev_track():
    await send_command("предыдущий трек")
