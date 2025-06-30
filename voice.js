const languagesInput = {
  es: "🇪🇸 Español",
  es_es: "🇪🇸 Español Castellano",
  en: "🇬🇧 English",
  fr: "🇫🇷 Français",
  de: "🇩🇪 Deutsch",
  it: "🇮🇹 Italiano",
  pt: "🇧🇷 Português",
  ru: "🇷🇺 Русский",
  zh: "🇨🇳 中文",
  ja: "🇯🇵 日本語",
  hi: "🇮🇳 हिन्दी",
  pl: "🇵🇱 Polski",
  ko: "🇰🇷 한국어",
  sv: "🇸🇪 Svenska",
  zh_tw: "🇹🇼 繁體中文",
  nl: "🇳🇱 Nederlands",
  ga: "🇮🇪 Gaeilge",
  en_au: "🇦🇺 English (AU)",
  fi: "🇫🇮 Suomi",
  fr_be: "🇧🇪 Français (BE)"
};

// Obtener la banderita para código de idioma
function getEmojiFlag(code) {
  const flags = {
    es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹", pt: "🇧🇷",
    ru: "🇷🇺", zh: "🇨🇳", ja: "🇯🇵", hi: "🇮🇳", pl: "🇵🇱", ko: "🇰🇷",
    sv: "🇸🇪", zh_tw: "🇹🇼", nl: "🇳🇱", ga: "🇮🇪", en_au: "🇦🇺",
    fi: "🇫🇮", fr_be: "🇧🇪"
  };
  const base = code.split("-")[0].toLowerCase();
  return flags[code] || flags[base] || "🌐";
}

// Cargar idiomas de entrada
function loadInputLanguages(selectId) {
  const select = document.getElementById(selectId);
  for (const [code, label] of Object.entries(languagesInput)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    select.appendChild(opt);
  }
}

// Cargar idiomas de salida usando las voces disponibles
function loadOutputLanguages(selectId) {
  const select = document.getElementById(selectId);
  const voices = window.speechSynthesis.getVoices();
  const added = new Set();

  voices.forEach(voice => {
    const langCode = voice.lang.toLowerCase();
    const baseCode = langCode.split("-")[0];
    if (!added.has(langCode)) {
      const emoji = getEmojiFlag(langCode);
      const option = document.createElement("option");
      option.value = langCode;
      option.textContent = `${emoji} ${voice.lang}`;
      select.appendChild(option);
      added.add(langCode);
    }
  });
}

// Configurar grabación y traducción
function setupRecorder(btnId, inputSelectId, outputSelectId, outputTextId) {
  const btn = document.getElementById(btnId);
  const output = document.getElementById(outputTextId);
  const inputLangSelect = document.getElementById(inputSelectId);
  const outputLangSelect = document.getElementById(outputSelectId);

  let recognition;
  let isRecording = false;

  btn.addEventListener("click", () => {
    if (!isRecording) {
      const lang = inputLangSelect.value?.split("_")[0];
      if (!lang || !outputLangSelect.value) return;

      recognition = new webkitSpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        btn.classList.add("recording");
        isRecording = true;
      };

      recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        output.textContent = `🗣️ ${text}`;
        btn.classList.remove("recording");
        isRecording = false;

        const translated = await translateText(text, inputLangSelect.value, outputLangSelect.value);
        output.textContent = `💬 ${translated}`;
        speakText(translated, outputLangSelect.value);
      };

      recognition.onerror = (err) => {
        output.textContent = "❌ Error: " + err.error;
        btn.classList.remove("recording");
        isRecording = false;
      };

      recognition.onend = () => {
        if (isRecording) {
          btn.classList.remove("recording");
          isRecording = false;
        }
      };

      recognition.start();
    } else {
      recognition.stop();
      btn.classList.remove("recording");
      isRecording = false;
    }
  });
}

// Función para traducir el texto
async function translateText(text, from, to) {
  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: from,
        target: to.split("-")[0],
        format: "text"
      })
    });
    const data = await res.json();
    return data.translatedText;
  } catch (e) {
    return "Error al traducir.";
  }
}

// Leer el texto con voz
function speakText(text, lang) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.speak(utter);
}

// Inicialización robusta (fix para móviles)
window.onload = () => {
  loadInputLanguages("inputLang1");
  loadInputLanguages("inputLang2");

  const initialize = () => {
    loadOutputLanguages("outputLang1");
    loadOutputLanguages("outputLang2");
    setupRecorder("recordBtn1", "inputLang1", "outputLang1", "translatedText1");
    setupRecorder("recordBtn2", "inputLang2", "outputLang2", "translatedText2");
  };

  if (speechSynthesis.getVoices().length > 0) {
    initialize();
  } else {
    speechSynthesis.onvoiceschanged = initialize;
  }
};
