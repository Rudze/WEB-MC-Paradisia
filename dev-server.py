"""
Local server for working on the site.

It serves the files of this folder and forwards every /api/... request to the Minecraft
server's API (mod nh_api), adding the secret key, so the key never reaches the browser.

    PARADISIA_API_URL=http://<vps-ip>:8091 PARADISIA_API_KEY=<token> python3 dev-server.py

then open http://localhost:8000
"""

import os
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

API_URL = os.environ.get("PARADISIA_API_URL", "http://127.0.0.1:8091").rstrip("/")
API_KEY = os.environ.get("PARADISIA_API_KEY", "")
PORT = int(os.environ.get("PORT", "8000"))


class Handler(SimpleHTTPRequestHandler):

    def do_GET(self):
        if not self.path.startswith("/api/"):
            return super().do_GET()  # a file of the site

        request = urllib.request.Request(API_URL + self.path, headers={"X-Api-Key": API_KEY})
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                status, body = response.status, response.read()
        except urllib.error.HTTPError as error:
            status, body = error.code, error.read()
        except OSError:
            status, body = 502, b'{"error":"The Minecraft server API cannot be reached"}'

        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"Site on http://localhost:{PORT}, API forwarded to {API_URL}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
