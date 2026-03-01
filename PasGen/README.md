# PasGen V1

Local password generator — Flask backend, vanilla JS frontend.

## Quick Start (Windows)

1. Make sure Python 3.10+ is installed
2. Double-click `run.bat`
3. Open in browser: http://localhost:5000

## Manual Start

```bash
pip install -r requirements.txt
python app.py
```

## Network / VPN Access

The server listens on `0.0.0.0:5000` — accessible from any network interface.

To find your IP address: run `ipconfig` in cmd and look for **IPv4 Address**.

Then open from another device: `http://<YOUR_IP>:5000`

## Features (V1)

- Configurable password length (4–128 characters)
- Toggle: Uppercase letters A–Z
- Toggle: Digits 0–9
- Toggle: Symbols !@#…
- Lowercase a–z always included
- One-click copy to clipboard
- Secure generation via Python `secrets` module

## Files

| File                  | Description                        |
|-----------------------|------------------------------------|
| app.py                | Flask server, /api/generate        |
| templates/index.html  | UI page                            |
| static/style.css      | Dark theme styles                  |
| static/script.js      | UI logic, fetch requests           |
| requirements.txt      | Dependencies (Flask only)          |
| run.bat               | One-click launcher                 |
