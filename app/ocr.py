import pytesseract
from PIL import Image

# If using Linux in Docker:
pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

def extract_text_from_image(image_path, language='eng'):
    if language == 'auto':
        # Combine supported languages for automatic detection during OCR
        language = 'eng+spa+fra+deu+ita'

    img = Image.open(image_path)
    text = pytesseract.image_to_string(img, lang=language)
    return text.strip()