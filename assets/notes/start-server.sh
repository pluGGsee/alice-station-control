#!/bin/bash
# Запускает Alice Station только в домашней сети TP-Link_76DF_5G
# Идентифицируем по IP-подсети 192.168.0.x — надёжнее SSID в macOS

HOME_SUBNET="192.168.0."
PYTHON="/Users/mac/Desktop/Работа/alice-station-control/work/backend/venv/bin/python3"
WORKDIR="/Users/mac/Desktop/Работа/alice-station-control/work/backend"
PIDFILE="/tmp/alice-station.pid"
LOGFILE="/Users/mac/Library/Logs/alice-station.log"

current_ip() {
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null
}

stop_server() {
    if [ -f "$PIDFILE" ]; then
        pid=$(cat "$PIDFILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo "$(date '+%H:%M:%S'): Сервер остановлен (PID $pid)" >> "$LOGFILE"
        fi
        rm -f "$PIDFILE"
    fi
}

start_server() {
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
        return
    fi
    cd "$WORKDIR" || exit 1
    "$PYTHON" -m uvicorn main:app --host 0.0.0.0 --port 8000 >> "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    echo "$(date '+%H:%M:%S'): Сервер запущен (PID $!, IP=$ip)" >> "$LOGFILE"
}

ip=$(current_ip)

if [[ "$ip" == ${HOME_SUBNET}* ]]; then
    start_server
else
    stop_server
    echo "$(date '+%H:%M:%S'): Не домашняя сеть (IP=$ip) — сервер остановлен" >> "$LOGFILE"
fi
