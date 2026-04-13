#!/bin/bash

# Default port
PORT=8000

# Function to check if a port is in use
is_port_in_use() {
  (echo > /dev/tcp/localhost/$1) >/dev/null 2>&1
}

echo "Cerco una porta libera..."

while is_port_in_use $PORT; do
  echo "Porta $PORT occupata, provo la successiva..."
  PORT=$((PORT+1))
done

echo "Avvio Manga Box sulla porta $PORT..."

PYTHON_CMD="python3"
if ! command -v python3 &>/dev/null; then
    PYTHON_CMD="python"
fi

pkill -f "$PYTHON_CMD -m http.server $PORT" 2>/dev/null
cd "$(dirname "$0")"
$PYTHON_CMD -m http.server $PORT &

sleep 1

URL="http://localhost:$PORT"
if command -v xdg-open &>/dev/null; then
    xdg-open "$URL" 2>/dev/null
elif command -v open &>/dev/null; then
    open "$URL" 2>/dev/null
else
    echo "Server avviato! Apri manualmente: $URL"
fi
