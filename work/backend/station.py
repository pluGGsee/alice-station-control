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

_glagol_token: str | None = None
_glagol_token_expires: float = 0
_send_lock = asyncio.Lock()
_http_session: aiohttp.ClientSession | None = None


def _get_http_session() -> aiohttp.ClientSession:
    global _http_session
    if _http_session is None or _http_session.closed:
        cookies = {"Session_id": SESSION_ID, "sessionid2": SESSION_ID2}
        _http_session = aiohttp.ClientSession(cookies=cookies)
    return _http_session


async def _get_glagol_token() -> str:
    global _glagol_token, _glagol_token_expires
    if _glagol_token and time.time() < _glagol_token_expires:
        return _glagol_token

    http = _get_http_session()
    session = YandexSession(http, x_token=YANDEX_XTOKEN)
    session.music_token = YANDEX_TOKEN
    r = await session.request_glagol(
        f"https://quasar.yandex.net/glagol/token"
        f"?device_id={DEVICE_ID}&platform={PLATFORM}"
    )
    data = await r.json()
    _glagol_token = data["token"]
    _glagol_token_expires = time.time() + 3600
    return _glagol_token


def _ssl_ctx():
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def _make_msg(token: str, payload: dict) -> str:
    return json.dumps({
        "conversationToken": token,
        "id": DEVICE_ID,
        "payload": payload,
        "sentTime": int(time.time() * 1000),
    })


async def _connect_and_get_state() -> dict | None:
    token = await _get_glagol_token()
    ws = None
    try:
        async with aiohttp.ClientSession() as http:
            ws = await http.ws_connect(
                f"wss://{STATION_IP}:{STATION_PORT}",
                ssl=_ssl_ctx(), heartbeat=5,
            )
            await ws.send_str(_make_msg(token, {"softwareVersion": "1.0"}))
            msg = await asyncio.wait_for(ws.receive(), timeout=5)
            return json.loads(msg.data)
    except Exception as e:
        logger.error(f"Station connect error: {e}")
        return None
    finally:
        if ws and not ws.closed:
            await ws.close()


async def _send(payload: dict) -> dict | None:
    async with _send_lock:
        token = await _get_glagol_token()
        ws = None
        try:
            async with aiohttp.ClientSession() as http:
                ws = await http.ws_connect(
                    f"wss://{STATION_IP}:{STATION_PORT}",
                    ssl=_ssl_ctx(), heartbeat=5,
                )
                await ws.send_str(_make_msg(token, {"softwareVersion": "1.0"}))
                await asyncio.wait_for(ws.receive(), timeout=5)
                await ws.send_str(_make_msg(token, payload))
                try:
                    msg = await asyncio.wait_for(ws.receive(), timeout=5)
                    return json.loads(msg.data)
                except asyncio.TimeoutError:
                    return None
        except Exception as e:
            logger.error(f"Station send error: {e}")
            return None
        finally:
            if ws and not ws.closed:
                await ws.close()


# --- Публичные методы ---

async def get_status() -> dict:
    data = await _connect_and_get_state()
    if not data:
        return {"online": False, "playing": False, "volume": 0, "aliceState": "IDLE", "track": None}

    state = data.get("state", {})
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
    await _send({"command": "sendText", "text": text})


async def send_command(text: str):
    await _send({"command": "sendText", "text": text})


async def set_volume(value: int):
    vol = max(0, min(10, value)) / 10
    await _send({"command": "setVolume", "volume": vol})


async def play():
    await _send({"command": "play"})


async def pause():
    await _send({"command": "stop"})


async def next_track():
    await send_command("следующий трек")


async def prev_track():
    await send_command("предыдущий трек")
