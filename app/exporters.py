import os
import uuid
from docx import Document
from openpyxl import Workbook
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import pypandoc

EXPORT_FOLDER = "exports"
os.makedirs(EXPORT_FOLDER, exist_ok=True)


def export_docx(text):
    filename = os.path.join(EXPORT_FOLDER, str(uuid.uuid4()) + ".docx")
    doc = Document()
    doc.add_paragraph(text)
    doc.save(filename)
    return filename


def export_xlsx(text):
    filename = os.path.join(EXPORT_FOLDER, str(uuid.uuid4()) + ".xlsx")
    wb = Workbook()
    ws = wb.active

    for i, line in enumerate(text.split("\n"), 1):
        ws[f"A{i}"] = line

    wb.save(filename)
    return filename


def export_pdf(text):
    filename = os.path.join(EXPORT_FOLDER, str(uuid.uuid4()) + ".pdf")
    doc = SimpleDocTemplate(filename)
    styles = getSampleStyleSheet()
    elements = []

    for line in text.split("\n"):
        elements.append(Paragraph(line, styles["Normal"]))
        elements.append(Spacer(1, 0.2 * inch))

    doc.build(elements)
    return filename


def export_md(text):
    filename = os.path.join(EXPORT_FOLDER, str(uuid.uuid4()) + ".md")
    pypandoc.convert_text(
        text,
        "md",
        format="md",
        outputfile=filename,
        extra_args=['--standalone']
    )
    return filename