from flask import Blueprint, request, jsonify, send_file, render_template
from .ocr import extract_text_from_image
from .exporters import export_docx, export_pdf, export_xlsx, export_md
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

    image = request.files["image"]
    filename = os.path.join(UPLOAD_FOLDER, str(uuid.uuid4()) + ".png")
    image.save(filename)

    text = extract_text_from_image(filename)
    os.remove(filename)

    return jsonify({"text": text})


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