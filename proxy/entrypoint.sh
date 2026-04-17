#!/bin/bash
set -e

CERT_DIR="/certs"
CA_PEM="$CERT_DIR/mitmproxy-ca-cert.pem"

mkdir -p "$CERT_DIR"

# Generate the mitmproxy CA cert by running it briefly
if [ ! -f "$CA_PEM" ]; then
  echo "Generating mitmproxy CA cert..."
  mitmdump --listen-port 8889 --set block_global=false &
  MITM_PID=$!
  sleep 4
  kill $MITM_PID 2>/dev/null || true
  wait $MITM_PID 2>/dev/null || true
  cp /root/.mitmproxy/mitmproxy-ca-cert.pem "$CA_PEM"
  echo "CA cert written to $CA_PEM"
fi

# Initialise state file if absent
STATE_FILE="/app/state.json"
if [ ! -f "$STATE_FILE" ]; then
  cat > "$STATE_FILE" <<'EOF'
{
  "kill_all": false,
  "services": {
    "anthropic": true,
    "weather": true,
    "geocoding": true
  }
}
EOF
fi

# Start Flask control panel in background
python /app/controlpanel.py &

# Start mitmproxy (foreground)
exec mitmdump \
  --listen-port 8888 \
  --set block_global=false \
  -s /app/toggle_addon.py
