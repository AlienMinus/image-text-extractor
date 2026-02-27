from deep_translator import GoogleTranslator

def translate_text(text, target_lang):
    try:
        # GoogleTranslator supports 'auto' for source language detection
        translator = GoogleTranslator(source='auto', target=target_lang)
        return translator.translate(text)
    except Exception as e:
        return f"Translation Error: {str(e)}"