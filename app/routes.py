from flask import Blueprint, request, jsonify, send_file, render_template
from .ocr import extract_text_from_image
from .exporters import export_docx, export_pdf, export_xlsx, export_md, export_mp3
from .translation import translate_text
import os
import uuid

main = Blueprint("main", __name__)

UPLOAD_FOLDER = "temp"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@main.route("/")
def home():
    return render_template("index.html")


@main.route("/api/extract", methods=["POST"])
def extract_text():

    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    images = request.files.getlist("image")
    language = request.form.get("language", "eng")
    results = []

    for image in images:
        filename = os.path.join(UPLOAD_FOLDER, str(uuid.uuid4()) + ".png")
        image.save(filename)
        text = extract_text_from_image(filename, language)
        os.remove(filename)
        results.append(text)

    return jsonify({"text": "\n\n--- Next Image ---\n\n".join(results)})


@main.route("/api/export", methods=["POST"])
def export_file():

    data = request.json
    text = data.get("text")
    filetype = data.get("format")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    if filetype == "docx":
        filepath = export_docx(text)
    elif filetype == "pdf":
        filepath = export_pdf(text)
    elif filetype == "xlsx":
        filepath = export_xlsx(text)
    elif filetype == "md":
        filepath = export_md(text)
    else:
        return jsonify({"error": "Invalid format"}), 400

    return send_file(filepath, as_attachment=True)


@main.route("/api/translate", methods=["POST"])
def translate():
    data = request.json
    text = data.get("text")
    target_lang = data.get("target_lang")

    if not text or not target_lang:
        return jsonify({"error": "Missing text or target language"}), 400

    translated_text = translate_text(text, target_lang)
    return jsonify({"translated_text": translated_text})


@main.route("/api/audio", methods=["POST"])
def generate_audio():
    data = request.json
    text = data.get("text")
    language = data.get("language", "en")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    filepath = export_mp3(text, language)
    return send_file(filepath, as_attachment=True, mimetype="audio/mpeg")