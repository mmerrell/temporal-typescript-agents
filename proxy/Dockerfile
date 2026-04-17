FROM python:3.11-slim

RUN pip install --no-cache-dir mitmproxy flask pyyaml

COPY entrypoint.sh /entrypoint.sh
COPY toggle_addon.py /app/toggle_addon.py
COPY controlpanel.py /app/controlpanel.py
COPY static/ /app/static/

RUN chmod +x /entrypoint.sh
WORKDIR /app

EXPOSE 8888 5000

ENTRYPOINT ["/entrypoint.sh"]
