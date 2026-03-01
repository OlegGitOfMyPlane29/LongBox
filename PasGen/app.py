import secrets
import string
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json()

    try:
        length = int(data.get("length", 16))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid length value"}), 400

    use_uppercase = bool(data.get("uppercase", True))
    use_digits = bool(data.get("digits", True))
    use_symbols = bool(data.get("symbols", False))

    if not (4 <= length <= 128):
        return jsonify({"error": "Length must be between 4 and 128"}), 400

    pool = string.ascii_lowercase
    if use_uppercase:
        pool += string.ascii_uppercase
    if use_digits:
        pool += string.digits
    if use_symbols:
        pool += "!@#$%^&*()-_=+[]{}|;:,.<>?"

    password = "".join(secrets.choice(pool) for _ in range(length))
    return jsonify({"password": password})


if __name__ == "__main__":
    import logging
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    print("Server running at http://localhost:5000  |  Press Ctrl+C to stop.")
    app.run(host="0.0.0.0", port=5000, debug=False)
