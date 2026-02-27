let selectedFiles = [];
let cropper = null;
let recognition = null;

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const cameraInput = document.getElementById('cameraInput');
const cameraBtn = document.getElementById('cameraBtn');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const clearPreviewBtn = document.getElementById('clearPreview');
const cropBtn = document.getElementById('cropBtn');
const saveCropBtn = document.getElementById('saveCropBtn');
const cancelCropBtn = document.getElementById('cancelCropBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const translateActionBtn = document.getElementById('translateActionBtn');
const translatedText = document.getElementById('translatedText');
const translationActions = document.getElementById('translationActions');
const clearTextBtn = document.getElementById('clearTextBtn');

document.addEventListener('DOMContentLoaded', () => {
    const savedExtracted = localStorage.getItem('extractedText');
    if (savedExtracted) {
        document.getElementById('extractedText').value = savedExtracted;
        document.getElementById('outputSection').classList.remove('hidden');
    }
    
    const savedTranslated = localStorage.getItem('translatedText');
    if (savedTranslated) {
        translatedText.value = savedTranslated;
        translatedText.classList.remove('hidden');
        translationActions.classList.remove('hidden');
    }
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('extractBtn').click();
    }
});

// Drag and Drop Events
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
    }
});

// Input Events
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
});

cameraBtn.addEventListener('click', () => {
    cameraInput.click();
});

cameraInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(e.target.files);
});

clearPreviewBtn.addEventListener('click', () => {
    destroyCropper();
    if (imagePreview.dataset.blobUrl) {
        URL.revokeObjectURL(imagePreview.dataset.blobUrl);
        imagePreview.dataset.blobUrl = '';
    }
    selectedFiles = [];
    previewContainer.classList.add('hidden');
    document.querySelector('.upload-container').classList.remove('hidden');
    fileInput.value = '';
    cameraInput.value = '';
});

// Cropper Events
cropBtn.addEventListener('click', () => {
    if (cropper) return;
    cropper = new Cropper(imagePreview, {
        viewMode: 1,
        autoCropArea: 1,
    });
    cropBtn.classList.add('hidden');
    saveCropBtn.classList.remove('hidden');
    cancelCropBtn.classList.remove('hidden');
});

saveCropBtn.addEventListener('click', () => {
    if (!cropper) return;
    cropper.getCroppedCanvas().toBlob((blob) => {
        selectedFiles = [blob];
        // Re-create URL for the preview
        const url = URL.createObjectURL(blob);
        imagePreview.src = url;
        // Clean up old cropper
        destroyCropper();
    });
});

cancelCropBtn.addEventListener('click', () => {
    destroyCropper();
    // Reset preview to original file if needed, 
    // but since we didn't overwrite selectedFile yet, 
    // we just destroy the cropper view.
});

document.getElementById('extractBtn').addEventListener('click', async function() {
    
    if (selectedFiles.length === 0) {
        alert('Please select an image first.');
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('image', selectedFiles[i]);
    }
    const language = document.getElementById('languageSelect').value;
    formData.append('language', language);

    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('outputSection').classList.add('hidden');
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';

    try {
        // Use XMLHttpRequest for progress tracking
        const data = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/extract');
            
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    progressBar.style.width = percent + '%';
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Extraction failed'));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
        
        if (data.text) {
            document.getElementById('extractedText').value = data.text;
            localStorage.setItem('extractedText', data.text);
            document.getElementById('outputSection').classList.remove('hidden');
            translatedText.classList.add('hidden'); // Hide previous translations
            translationActions.classList.add('hidden');
            localStorage.removeItem('translatedText');
        } else {
            alert('No text found in image.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while extracting text.');
    } finally {
        document.getElementById('loader').classList.add('hidden');
        progressContainer.classList.add('hidden');
    }
});

translateActionBtn.addEventListener('click', async function() {
    const text = document.getElementById('extractedText').value;
    const targetLang = document.getElementById('targetLang').value;

    if (!text) {
        alert('No text to translate.');
        return;
    }

    translatedText.value = "Translating...";
    translatedText.classList.remove('hidden');
    translationActions.classList.add('hidden');

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, target_lang: targetLang })
        });
        const data = await response.json();
        translatedText.value = data.translated_text;
        localStorage.setItem('translatedText', data.translated_text);
        translationActions.classList.remove('hidden');
    } catch (error) {
        console.error('Translation error:', error);
        translatedText.value = "Failed to translate text.";
    }
});

clearTextBtn.addEventListener('click', () => {
    document.getElementById('extractedText').value = '';
    translatedText.value = '';
    translatedText.classList.add('hidden');
    translationActions.classList.add('hidden');
    document.getElementById('outputSection').classList.add('hidden');
    localStorage.removeItem('extractedText');
    localStorage.removeItem('translatedText');
});

document.getElementById('extractedText').addEventListener('input', (e) => {
    localStorage.setItem('extractedText', e.target.value);
});

translatedText.addEventListener('input', (e) => {
    localStorage.setItem('translatedText', e.target.value);
});

function handleFiles(files) {
    destroyCropper();
    
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
        alert('Please upload valid image files.');
        return;
    }
    
    // Resize the first image to prevent low memory crashes on mobile
    resizeImage(validFiles[0], 1280, 1280, (resizedBlob) => {
        selectedFiles = validFiles;
        // Replace the first file with the resized version for processing
        selectedFiles[0] = resizedBlob;
        
        const url = URL.createObjectURL(resizedBlob);
        
        if (imagePreview.dataset.blobUrl) {
            URL.revokeObjectURL(imagePreview.dataset.blobUrl);
        }
        imagePreview.dataset.blobUrl = url;
        imagePreview.src = url;

        previewContainer.classList.remove('hidden');
        const uploadContainer = document.querySelector('.upload-container');
        if (uploadContainer) uploadContainer.classList.add('hidden');
        else dropZone.classList.add('hidden');
        
        if (selectedFiles.length > 1) {
            cropBtn.classList.add('hidden');
            alert(`Batch mode: ${selectedFiles.length} images selected. Cropping is disabled.`);
        } else {
            cropBtn.classList.remove('hidden');
        }
    });
}

function destroyCropper() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropBtn.classList.remove('hidden');
    saveCropBtn.classList.add('hidden');
    cancelCropBtn.classList.add('hidden');
}

async function exportFile(format) {
    const text = document.getElementById('extractedText').value;
    if (!text) {
        alert('No text to export.');
        return;
    }

    try {
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, format: format })
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extracted_text.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to export file.');
    }
}

async function copyToClipboard() {
    const text = document.getElementById('extractedText').value;
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        alert('Text copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy text.');
    }
}

function speakText(elementId, langSelectId) {
    const element = document.getElementById(elementId);
    const text = element.value;
    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (langSelectId) {
        const langCode = document.getElementById(langSelectId).value;
        const langMap = {
            'eng': 'en-US', 'spa': 'es-ES', 'fra': 'fr-FR', 'deu': 'de-DE', 'ita': 'it-IT',
            'hi': 'hi-IN', 'or': 'or-IN', 'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE'
        };
        if (langMap[langCode]) utterance.lang = langMap[langCode];
    }

    // Real-time highlighting
    utterance.onboundary = function(event) {
        if (event.name === 'word') {
            const charIndex = event.charIndex;
            // Estimate word length since charLength is not always reliable
            const textAfter = text.slice(charIndex);
            const match = textAfter.match(/^\S+/); // Match until next whitespace
            const wordLength = match ? match[0].length : 0;

            element.focus();
            element.setSelectionRange(charIndex, charIndex + wordLength);
        }
    };

    utterance.onend = function() {
        element.setSelectionRange(0, 0); // Clear selection
    };

    window.speechSynthesis.speak(utterance);
}

function toggleSTT() {
    const sttBtn = document.getElementById('sttBtn');
    const textArea = document.getElementById('extractedText');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech to text is not supported in this browser.");
        return;
    }

    if (recognition && recognition.started) {
        recognition.stop();
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = document.getElementById('languageSelect').value === 'auto' ? 'en-US' : document.getElementById('languageSelect').value;

    recognition.onstart = function() {
        recognition.started = true;
        sttBtn.classList.add('btn-recording');
    };

    recognition.onend = function() {
        recognition.started = false;
        sttBtn.classList.remove('btn-recording');
    };

    recognition.onresult = function(event) {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
            }
        }
        if (finalTranscript) {
            textArea.value += finalTranscript;
        }
    };

    recognition.start();
}

async function downloadAudio(elementId, langSelectId) {
    const text = document.getElementById(elementId).value;
    if (!text) {
        alert('No text to generate audio.');
        return;
    }
    
    const lang = document.getElementById(langSelectId).value;

    try {
        const response = await fetch('/api/audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, language: lang })
        });

        if (!response.ok) throw new Error('Audio generation failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio_${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to download audio.');
    }
}

async function correctSpelling() {
    const text = document.getElementById('extractedText').value;
    if (!text) {
        alert('No text to correct.');
        return;
    }

    try {
        const response = await fetch('/api/correct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        const data = await response.json();
        document.getElementById('extractedText').value = data.corrected_text;
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to correct spelling.');
    }
}

function resizeImage(file, maxWidth, maxHeight, callback) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
        let width = img.width;
        let height = img.height;
        let shouldResize = false;

        if (width > maxWidth || height > maxHeight) {
            shouldResize = true;
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round(width * (maxHeight / height));
                    height = maxHeight;
                }
            }
        }

        if (shouldResize) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                callback(blob);
            }, file.type || 'image/jpeg', 0.8);
        } else {
            URL.revokeObjectURL(url);
            callback(file);
        }
    };
    
    img.onerror = () => {
        URL.revokeObjectURL(url);
        callback(file);
    };
    
    img.src = url;
}