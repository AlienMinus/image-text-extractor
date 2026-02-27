from textblob import TextBlob

def correct_text(text):
    blob = TextBlob(text)
    return str(blob.correct())