document.addEventListener("DOMContentLoaded", () => {
    const defaultLang = 'it';
    let currentLang = defaultLang;

    // Check for language in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('lang')) {
        currentLang = urlParams.get('lang');
    }

    // Function to load translations
    function loadTranslations() {
        // 'translations' is defined in js/translations.js
        if (typeof translations !== 'undefined') {
            if (translations[currentLang]) {
                applyTranslations(translations[currentLang]);
            } else {
                console.warn(`Language '${currentLang}' not found. Falling back to '${defaultLang}'.`);
                if (currentLang !== defaultLang && translations[defaultLang]) {
                    applyTranslations(translations[defaultLang]);
                }
            }
        } else {
            console.error('Translations object not found. Make sure js/translations.js is included.');
        }
    }

    function applyTranslations(langData) {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (langData[key]) {
                element.innerHTML = langData[key];
            }
        });

        // Re-run fitty if it's used on translated titles
        if (typeof fitty === 'function') {
            // Short timeout to ensure DOM update
            setTimeout(() => {
                fitty('.title');
            }, 100);
        }
    }

    // Function to set language and update UI
    function setLanguage(lang) {
        if (translations[lang]) {
            currentLang = lang;
            applyTranslations(translations[currentLang]);

            // Optional: Update active button state
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
            });

            // Re-run ScrollTrigger refresh to account for changes in element dimensions after translation
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        }
    }

    // Set up language buttons
    document.querySelectorAll('.lang-btn').forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    loadTranslations();
});
