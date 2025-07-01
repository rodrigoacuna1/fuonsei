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

function getLangName(code) {
  const names = {
    "es": "Español", "en": "English", "fr": "Français", "de": "Deutsch",
    "it": "Italiano", "pt": "Português", "ru": "Русский", "zh": "中文",
    "ja": "日本語", "hi": "हिन्दी", "pl": "Polski", "ko": "한국어",
    "sv": "Svenska", "zh-tw": "繁體中文", "nl": "Nederlands", "ga": "Gaeilge",
    "en-au": "English (AU)", "fi": "Suomi", "fr-be": "Français (BE)"
  };
  const normalized = code.toLowerCase();
  return names[normalized] || code;
}

function getEmojiFlag(code) {
  const flags = {
    es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹", pt: "🇧🇷",
    ru: "🇷🇺", zh: "🇨🇳", ja: "🇯🇵", hi: "🇮🇳", pl: "🇵🇱", ko: "🇰🇷",
    sv: "🇸🇪", "zh-tw": "🇹🇼", nl: "🇳🇱", ga: "🇮🇪", "en-au": "🇦🇺",
    fi: "🇫🇮", "fr-be": "🇧🇪"
  };
  const normalized = code.toLowerCase();
  const base = normalized.split("-")[0];
  return flags[normalized] || flags[base] || "🌐";
}

function loadInputLanguages(selectId) {
  const select = document.getElementById(selectId);
  for (const [code, label] of Object.entries(languagesInput)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    select.appendChild(opt);
  }
}

function loadOutputLanguages(selectId) {
  const select = document.getElementById(selectId);
  const voices = window.speechSynthesis.getVoices();
  const added = new Set();

  voices.forEach(voice => {
    const langCode = voice.lang.toLowerCase();
    const shortCode = langCode.split("-")[0];
    if (!added.has(langCode)) {
      const emoji = getEmojiFlag(langCode);
      const name = getLangName(langCode);
      const option = document.createElement("option");
      option.value = langCode;
      option.textContent = `${emoji} ${name}`;
      select.appendChild(option);
      added.add(langCode);
    }
  });
}

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

        const translated = await translateText(text, lang, outputLangSelect.value);
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

async function translateText(text, from, to) {
  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: from.split("-")[0],
        target: to.split("-")[0],
        format: "text"
      })
    });
    const data = await res.json();
    return data.translatedText || "(sin traducción)";
  } catch (e) {
    console.error("Error al traducir:", e);
    return "❌ Error al traducir.";
  }
}

function speakText(text, lang) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.speak(utter);
}

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
