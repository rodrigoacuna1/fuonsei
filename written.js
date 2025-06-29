// written.js adaptado a i18n con setLanguage y traducción dinámica

const outputLangs = {
  es: "🇪🇸 Español",
  en: "🇬🇧 English",
  fr: "🇫🇷 Français",
  it: "🇮🇹 Italiano",
  ru: "🇷🇺 Русский",
  pl: "🇵🇱 Polski",
  hi: "🇮🇳 हिन्दी",
  de: "🇩🇪 Deutsch",
  no: "🇳🇴 Norsk",
  zh: "🇨🇳 中文",
  ko: "🇰🇷 한국어",
  nl: "🇳🇱 Nederlands",
  pt: "🇵🇹 Português",
  ja: "🇯🇵 日本語",
  sv: "🇸🇪 Svenska",
  ca: "🇪🇸 Català",
  zh_tw: "🇹🇼 繁體中文",
  he: "🇮🇱 עברית",
  tr: "🇹🇷 Türkçe"
};

const fallbackLangs = { ...outputLangs };

const outputSelect = document.getElementById("outputLang");
const resultBox = document.getElementById("resultPopup");
const resultText = document.getElementById("translatedResultText");
const detectedLang = document.getElementById("languageInfo");
const translateBtn = document.querySelector(".translate-btn");
const resetBtn = document.querySelector(".reset-btn");
const loading = document.getElementById("loader");
const closeBtn = document.querySelector(".close-popup");
const fallbackContainer = document.getElementById("fallbackLangContainer");
const fallbackSelect = document.getElementById("fallbackLang");

const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");

const languageSwitcher = document.getElementById("languageSwitcher");

let extractedText = "";
let sourceLang = "";

// Función para traducir textos UI usando i18n
function translateUI() {
  // Transcribe todos los elementos con data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const txt = translations[currentLang]?.[key];
    if (txt) {
      if (el.placeholder !== undefined) {
        el.placeholder = txt;
      } else {
        el.textContent = txt;
      }
    }
  });

  // Textos dinámicos fijos
  detectedLang.textContent = translations[currentLang]?.languageDetected || "Idioma detectado: ...";
  translateBtn.textContent = translations[currentLang]?.btnTranslate || "Traducir";
  resetBtn.textContent = translations[currentLang]?.btnReset || "Reiniciar";
  fallbackSelect.options[0].textContent = translations[currentLang]?.selectInputLang || "🌐 Seleccionar idioma de entrada";
  outputSelect.options[0].textContent = translations[currentLang]?.selectOutputLang || "🌐 Elegir idioma de salida";
  document.querySelector(".upload-btn").textContent = translations[currentLang]?.uploadLabel || "📷 Subir Imagen";
  closeBtn.textContent = "✕";
}

let currentLang = "es";

function init() {
  // Detectar idioma guardado o navegador
  const savedLang = localStorage.getItem("lang");
  const browserLang = navigator.language.slice(0, 2);
  if (savedLang && translations[savedLang]) currentLang = savedLang;
  else if (translations[browserLang]) currentLang = browserLang;

  languageSwitcher.value = currentLang;
  setLanguage(currentLang);
  translateUI();

  // Cargar idiomas en selects
  for (const [code, label] of Object.entries(outputLangs)) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = label;
    outputSelect.appendChild(option);
  }
  for (const [code, label] of Object.entries(fallbackLangs)) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = label;
    fallbackSelect.appendChild(option);
  }
}

languageSwitcher.addEventListener("change", e => {
  currentLang = e.target.value;
  localStorage.setItem("lang", currentLang);
  setLanguage(currentLang);
  translateUI();
  // Actualizar alt de preview y otros textos dinámicos si hace falta
  if (previewImage.src) {
    previewImage.alt = translations[currentLang]?.imgAltPreview || "Vista previa";
  }
  detectedLang.textContent = translations[currentLang]?.languageDetected || "Idioma detectado: ...";
});

// Manejo de upload con preview y OCR
window.handleUpload = () => {
  const confirmCam = confirm(translations[currentLang]?.confirmCamera || "¿Usar cámara? (Cancelar para galería)");
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  if (confirmCam) input.capture = "environment";

  input.onchange = () => {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        previewImage.src = reader.result;
        previewContainer.classList.remove("hidden");
      };
      reader.readAsDataURL(file);

      extractTextFromImage(file);
    }
  };
  input.click();
};

// OCR con ocr.space
async function extractTextFromImage(file) {
  loading.style.display = "block";
  detectedLang.textContent = translations[currentLang]?.languageDetecting || "Idioma detectado: ...";
  fallbackContainer.classList.add("hidden");
  extractedText = "";
  sourceLang = "";
  resultText.textContent = "";
  resultBox.style.display = "none";

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("apikey", "helloworld");
    formData.append("language", "mul");
    formData.append("OCREngine", "2");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    const text = data.ParsedResults?.[0]?.ParsedText?.trim() || "";
    extractedText = text;

    if (extractedText) {
      detectLang(extractedText);
    } else {
      detectedLang.textContent = translations[currentLang]?.noTextDetected || "❌ No se detectó texto.";
      fallbackContainer.classList.remove("hidden");
      loading.style.display = "none";
    }
  } catch (e) {
    console.error("Error en OCR:", e);
    detectedLang.textContent = translations[currentLang]?.errorProcessingImage || "❌ Error procesando imagen.";
    fallbackContainer.classList.remove("hidden");
    loading.style.display = "none";
  }
}

// Detectar idioma con libretranslate
async function detectLang(text) {
  try {
    const res = await fetch("https://libretranslate.de/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text }),
    });
    const data = await res.json();
    const lang = data[0]?.language || null;

    if (lang) {
      detectedLang.textContent =
        translations[currentLang]?.languageDetectedPrefix + " " +
        (outputLangs[lang] || fallbackLangs[lang] || lang);
      sourceLang = lang;
      fallbackContainer.classList.add("hidden");
    } else {
      detectedLang.textContent = translations[currentLang]?.noLangDetected || "❌ No se pudo detectar el idioma";
      fallbackContainer.classList.remove("hidden");
    }
  } catch (e) {
    console.error("Error detectando idioma:", e);
    detectedLang.textContent = translations[currentLang]?.errorDetectingLang || "❌ Error detectando idioma.";
    fallbackContainer.classList.remove("hidden");
  } finally {
    loading.style.display = "none";
  }
}

// Traducir texto extraído
translateBtn.addEventListener("click", async () => {
  const target = outputSelect.value;
  const source = sourceLang || fallbackSelect.value;

  if (!extractedText) {
    alert(translations[currentLang]?.alertNoImage || "Por favor, subí una imagen primero.");
    return;
  }
  if (!source) {
    alert(translations[currentLang]?.alertNoSourceLang || "Por favor, seleccioná el idioma de entrada.");
    return;
  }
  if (!target) {
    alert(translations[currentLang]?.alertNoTargetLang || "Por favor, seleccioná el idioma de salida.");
    return;
  }

  loading.style.display = "block";

  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: extractedText,
        source,
        target,
        format: "text",
      }),
    });
    const data = await res.json();
    resultText.textContent = data.translatedText;
    resultBox.style.display = "block";
  } catch (e) {
    console.error("Error traduciendo:", e);
    resultText.textContent = translations[currentLang]?.errorTranslating || "❌ Error traduciendo texto.";
    resultBox.style.display = "block";
  } finally {
    loading.style.display = "none";
  }
});

// Cerrar popup
closeBtn.addEventListener("click", () => {
  resultBox.style.display = "none";
});

// Resetear todo
resetBtn.addEventListener("click", () => {
  detectedLang.textContent = translations[currentLang]?.languageDetected || "Idioma detectado: ...";
  fallbackSelect.selectedIndex = 0;
  fallbackContainer.classList.add("hidden");
  outputSelect.selectedIndex = 0;
  extractedText = "";
  sourceLang = "";
  resultText.textContent = "";
  resultBox.style.display = "none";
  previewImage.src = "";
  previewContainer.classList.add("hidden");
});

// Inicialización
init();
