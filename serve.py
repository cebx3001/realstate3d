#!/usr/bin/env python3
"""Dev server for Torres del Norte with viewpoint authoring API."""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 5175
PUBLIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC, **kwargs)

    def do_POST(self):
        if self.path == "/api/save-viewpoint":
            length = int(self.headers["Content-Length"])
            body = json.loads(self.rfile.read(length))

            unit = body["unit"]
            room = body["room"]
            position = body["position"]
            target = body["target"]
            fov = body["fov"]

            filename = f"{unit}-{room}.json"
            filepath = os.path.join(PUBLIC, "viewer-settings", filename)

            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    settings = json.load(f)
            else:
                settings = {
                    "version": 2,
                    "tonemapping": "none",
                    "highPrecisionRendering": False,
                    "background": {"color": [0.05, 0.05, 0.045]},
                    "postEffectSettings": {
                        "sharpness": {"enabled": True, "amount": 0.18},
                        "bloom": {"enabled": False, "intensity": 1, "blurLevel": 2},
                        "grading": {
                            "enabled": True,
                            "brightness": 0.02,
                            "contrast": 1.04,
                            "saturation": 1.02,
                            "tint": [1, 0.98, 0.92],
                        },
                        "vignette": {
                            "enabled": True,
                            "intensity": 0.22,
                            "inner": 0.18,
                            "outer": 0.86,
                            "curvature": 1,
                        },
                        "fringing": {"enabled": False, "intensity": 0.5},
                    },
                    "animTracks": [],
                    "annotations": [],
                    "startMode": "walk",
                    "cameras": [],
                }

            room_labels = {
                "living": "Sala",
                "dining": "Comedor",
                "kitchen": "Cocina",
                "bedroom": "Dormitorio",
                "primary_bedroom": "Dormitorio principal",
                "secondary_bedroom": "Dormitorio secundario",
                "bath": "Baño",
                "primary_bath": "Baño principal",
                "guest_bath": "Baño secundario",
                "study": "Estudio",
                "kids_room": "Dormitorio infantil",
                "laundry": "Lavandería",
                "suite": "Suite",
                "media": "Sala TV",
            }

            pos3 = [round(v, 3) for v in position]
            tgt3 = [round(v, 3) for v in target]
            fov_r = round(fov, 1)

            settings["cameras"] = [
                {"initial": {"position": pos3, "target": tgt3, "fov": fov_r}}
            ]
            settings["annotations"] = [
                {
                    "name": room_labels.get(room, room),
                    "position": tgt3,
                    "cameraPosition": pos3,
                    "cameraTarget": tgt3,
                }
            ]

            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=2)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True, "file": filename}).encode())
            print(f"  SAVED: {filename}  pos={pos3}  target={tgt3}  fov={fov_r}")
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


if __name__ == "__main__":
    os.chdir(PUBLIC)
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Torres del Norte — http://127.0.0.1:{PORT}/")
    print(f"Viewpoint authoring API — POST /api/save-viewpoint")
    print(f"Serving from: {PUBLIC}")
    print()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
