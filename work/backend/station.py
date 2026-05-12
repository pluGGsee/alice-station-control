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
    STATION_IP, STATION_PORT, DEVICE_ID, PLATFORM
)
from yandex_session import YandexSession
from config import YANDEX_TOKEN

logger = logging.getLogger(__name__)

_glagol_token: str | None = None
_glagol_token_expires: float = 0


async def _get_session() -> YandexSession:
    cookies = {"Session_id": SESSION_ID, "sessionid2": SESSION_ID2}
    http = aiohttp.ClientSession(cookies=cookies)
    session = YandexSession(http, x_token=YANDEX_XTOKEN)
    session.music_token = YANDEX_TOKEN
    return session, http


async def _get_glagol_token() -> str:
    global _glagol_token, _glagol_token_expires
    if _glagol_token and time.time() < _glagol_token_expires:
        return _glagol_token

    session, http = await _get_session()
    try:
        r = await session.request_glagol(
            f"https://quasar.yandex.net/glagol/token"
            f"?device_id={DEVICE_ID}&platform={PLATFORM}"
        )
        data = await r.json()
        _glagol_token = data["token"]
        _glagol_token_expires = time.time() + 3600
        return _glagol_token
    finally:
        await http.close()


def _ssl_ctx():
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


async def _send(payload: dict) -> dict | None:
    token = await _get_glagol_token()
    try:
        async with aiohttp.ClientSession() as http:
            ws = await http.ws_connect(
                f"wss://{STATION_IP}:{STATION_PORT}",
                ssl=_ssl_ctx(),
                heartbeat=5,
            )
            # Handshake
            await ws.send_str(json.dumps({
                "conversationToken": token,
                "id": DEVICE_ID,
                "payload": {"softwareVersion": "1.0"},
                "sentTime": int(time.time() * 1000),
            }))
            await asyncio.wait_for(ws.receive(), timeout=5)

            # Команда
            await ws.send_str(json.dumps({
                "conversationToken": token,
                "id": DEVICE_ID,
                "payload": payload,
                "sentTime": int(time.time() * 1000),
            }))

            # Читаем ответ
            try:
                msg = await asyncio.wait_for(ws.receive(), timeout=5)
                return json.loads(msg.data)
            except asyncio.TimeoutError:
                return None
            finally:
                await ws.close()
    except Exception as e:
        logger.error(f"Station send error: {e}")
        return None


# --- Публичные методы ---

async def get_status() -> dict:
    result = await _send({"command": "softwareVersion"})
    if result:
        state = result.get("state", {})
        return {
            "online": True,
            "playing": state.get("playing", False),
            "volume": state.get("volume", 0),
            "aliceState": state.get("aliceState", "IDLE"),
        }
    return {"online": False, "playing": False, "volume": 0, "aliceState": "IDLE"}


async def send_tts(text: str):
    await _send({"command": "sendText", "text": text})


async def send_command(text: str):
    await _send({"command": "sendText", "text": text})


async def set_volume(value: int):
    # value: 0–10 (колонка принимает 0.0–1.0)
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
