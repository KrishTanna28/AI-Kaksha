// Initialize language from localStorage or default to English
let currentLanguage = localStorage.getItem('preferredLanguage') || 'en';

// Function to update the UI language
function updateLanguage(lang) {
    // If same language is selected, do nothing
    if (lang === currentLanguage) return;
    
    // Save the language preference
    localStorage.setItem('preferredLanguage', lang);
    
    // Update the current language display
    document.querySelectorAll('.current-language').forEach(el => {
        el.textContent = document.querySelector(`.language-dropdown-content a[data-lang="${lang}"]`).textContent;
    });
    
    // Update active class
    document.querySelectorAll('.language-dropdown-content a').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll(`.language-dropdown-content a[data-lang="${lang}"]`).forEach(el => {
        el.classList.add('active');
    });
    
    // Set RTL for Arabic
    if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
    }
    
    // If switching to English (default), reload the page
    if (lang === 'en') {
        location.reload();
        return;
    }
    
    // For other languages, translate the page
    currentLanguage = lang;
    translatePage(lang);
}

// Function to translate the page content
async function translatePage(targetLang) {
    // Show translation in progress
    showTranslationProgress();
    
    try {
        // Get all translatable elements
        const elements = getTranslatableElements();
        
        // Prepare the texts for translation
        const textsToTranslate = elements.map(el => el.textContent.trim()).filter(text => text.length > 0);
        
        if (textsToTranslate.length === 0) {
            hideTranslationProgress();
            return;
        }
        
        // Call the translation API
        const translatedTexts = await translateTexts(textsToTranslate, targetLang);
        
        // Apply translations
        let translationIndex = 0;
        elements.forEach(el => {
            const text = el.textContent.trim();
            if (text.length > 0) {
                el.textContent = translatedTexts[translationIndex++];
                el.setAttribute('data-translated', 'true');
            }
        });
        
        // Translate placeholders
        const inputElements = document.querySelectorAll('input[placeholder], textarea[placeholder]');
        const placeholders = Array.from(inputElements).map(el => el.placeholder).filter(text => text.length > 0);
        
        if (placeholders.length > 0) {
            const translatedPlaceholders = await translateTexts(placeholders, targetLang);
            
            let placeholderIndex = 0;
            inputElements.forEach(el => {
                if (el.placeholder.length > 0) {
                    el.placeholder = translatedPlaceholders[placeholderIndex++];
                }
            });
        }
        
    } catch (error) {
        console.error('Translation error:', error);
        alert('Translation failed. Please try again later.');
    } finally {
        hideTranslationProgress();
    }
}

// Function to get all translatable elements
function getTranslatableElements() {
    // Select elements that typically contain text
    const selectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'a', 'button', 'label', 'li',
        '.btn', '.nav-link', '.card-title', '.card-text'
    ];
    
    // Get all elements matching the selectors
    const elements = [];
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            // Skip elements that should not be translated
            if (el.hasAttribute('data-no-translate')) return;
            // Skip elements with no text content
            if (!el.textContent.trim()) return;
            // Skip elements that are part of scripts or have code
            if (el.closest('script, pre, code')) return;
            
            elements.push(el);
        });
    });
    
    return elements;
}

// Function to call the translation API
async function translateTexts(texts, targetLang) {
    // Call our backend API for translation
    const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            texts: texts,
            target_language: targetLang
        })
    });
    
    if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.translations;
}

// Function to show translation progress
function showTranslationProgress() {
    // Create a progress indicator if it doesn't exist
    if (!document.getElementById('translation-progress')) {
        const progressElement = document.createElement('div');
        progressElement.id = 'translation-progress';
        progressElement.innerHTML = `
            <div class="translation-progress-content">
                <div class="translation-spinner"></div>
                <p>Translating page...</p>
            </div>
        `;
        document.body.appendChild(progressElement);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #translation-progress {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            .translation-progress-content {
                background-color: #1E293B;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            .translation-spinner {
                border: 4px solid rgba(68, 104, 242, 0.1);
                border-radius: 50%;
                border-top: 4px solid #4468F2;
                width: 30px;
                height: 30px;
                animation: translation-spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            .translation-progress-content p {
                color: #C5C8E0;
                margin: 0;
            }
            @keyframes translation-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.getElementById('translation-progress').style.display = 'flex';
}

// Function to hide translation progress
function hideTranslationProgress() {
    const progressElement = document.getElementById('translation-progress');
    if (progressElement) {
        progressElement.style.display = 'none';
    }
}

// Initialize language selector functionality
document.addEventListener('DOMContentLoaded', function() {
    // Set up language switcher
    document.querySelectorAll('.language-dropdown-content a').forEach(el => {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('data-lang');
            updateLanguage(lang);
        });
    });
    
    // Initialize with saved language
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
    
    // Update the current language display
    document.querySelectorAll('.current-language').forEach(el => {
        el.textContent = document.querySelector(`.language-dropdown-content a[data-lang="${savedLanguage}"]`).textContent;
    });
    
    // Update active class
    document.querySelectorAll('.language-dropdown-content a').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll(`.language-dropdown-content a[data-lang="${savedLanguage}"]`).forEach(el => {
        el.classList.add('active');
    });
    
    // Set RTL for Arabic
    if (savedLanguage === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
    }
    
    // If not English, translate the page
    if (savedLanguage !== 'en') {
        currentLanguage = savedLanguage;
        translatePage(savedLanguage);
    }
});

// Function to translate dynamic content (call this after loading new content)
function translateDynamicContent(element) {
    if (currentLanguage === 'en') return;
    
    // Get all translatable elements within the provided element
    const elements = [];
    const selectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'a', 'button', 'label', 'li',
        '.btn', '.nav-link', '.card-title', '.card-text'
    ];
    
    selectors.forEach(selector => {
        element.querySelectorAll(selector).forEach(el => {
            if (el.hasAttribute('data-no-translate')) return;
            if (!el.textContent.trim()) return;
            if (el.closest('script, pre, code')) return;
            
            elements.push(el);
        });
    });
    
    // Prepare the texts for translation
    const textsToTranslate = elements.map(el => el.textContent.trim()).filter(text => text.length > 0);
    
    if (textsToTranslate.length === 0) return;
    
    // Call the translation API
    translateTexts(textsToTranslate, currentLanguage)
        .then(translatedTexts => {
            // Apply translations
            let translationIndex = 0;
            elements.forEach(el => {
                const text = el.textContent.trim();
                if (text.length > 0) {
                    el.textContent = translatedTexts[translationIndex++];
                    el.setAttribute('data-translated', 'true');
                }
            });
        })
        .catch(error => {
            console.error('Translation error for dynamic content:', error);
        });
}

// Expose functions for external use
window.translator = {
    updateLanguage,
    translatePage,
    translateDynamicContent
}; 