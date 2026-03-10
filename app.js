const state = {
  currentView: "reader",
  inputMode: "screenshot",
  sourceTitle: "商业文章截图",
  selectedSentenceId: null,
  selectedWord: null,
  favorites: [],
  vocabulary: [],
  isRecording: false,
  mediaRecorder: null,
  latestRecordingUrl: null,
  latestRecordingTarget: "",
  latestRecordingScore: null,
  source: null,
};

const sampleSource = {
  id: "src-001",
  title: "商业文章截图",
  type: "screenshot",
  createdAt: "2026-03-09 22:40",
  sentences: [
    {
      id: "s1",
      text: "Although the team had limited funding, it still managed to build a practical tool that readers could use every day.",
      translation:
        "虽然团队的预算有限，但他们还是做出了一个读者每天都能用的实用工具。",
      chunks: [
        "Although the team had limited funding,",
        "it still managed to build a practical tool",
        "that readers could use every day.",
      ],
      keywords: [
        {
          word: "limited funding",
          phonetic: "/ˈlɪmɪtɪd ˈfʌndɪŋ/",
          meaning: "有限的资金",
          example: "The startup survived despite limited funding.",
        },
        {
          word: "managed",
          phonetic: "/ˈmænɪdʒd/",
          meaning: "设法做到",
          example: "She managed to finish the task before dinner.",
        },
        {
          word: "practical",
          phonetic: "/ˈpræktɪkəl/",
          meaning: "实用的",
          example: "This is a practical method for daily study.",
        },
      ],
    },
    {
      id: "s2",
      text: "What made the product easier to understand was the way each sentence was broken into a few clear meaning groups.",
      translation:
        "这个产品之所以更容易理解，在于它把每个句子拆成了几个清晰的意群。",
      chunks: [
        "What made the product easier to understand",
        "was the way each sentence was broken",
        "into a few clear meaning groups.",
      ],
      keywords: [
        {
          word: "broken into",
          phonetic: "/ˈbroʊkən ˈɪntuː/",
          meaning: "被拆分成",
          example: "The report was broken into short sections.",
        },
        {
          word: "meaning groups",
          phonetic: "/ˈmiːnɪŋ ɡruːps/",
          meaning: "意群",
          example: "Reading by meaning groups improves fluency.",
        },
      ],
    },
    {
      id: "s3",
      text: "If the pronunciation feedback feels short but human, users are more likely to keep practicing instead of feeling judged.",
      translation:
        "如果发音反馈简短但有人味，用户就更愿意继续练习，而不是觉得自己被评判。",
      chunks: [
        "If the pronunciation feedback feels short but human,",
        "users are more likely to keep practicing",
        "instead of feeling judged.",
      ],
      keywords: [
        {
          word: "feedback",
          phonetic: "/ˈfiːdbæk/",
          meaning: "反馈",
          example: "Good feedback helps learners stay motivated.",
        },
        {
          word: "judged",
          phonetic: "/dʒʌdʒd/",
          meaning: "被评判",
          example: "People speak more freely when they do not feel judged.",
        },
      ],
    },
  ],
};

const recentItems = [
  { title: "粘贴文本", meta: "直接输入 · 4 句话" },
  { title: "截屏取词", meta: "屏幕内容 · 3 句话" },
  { title: "拍照识别", meta: "相机扫描 · 2 句话" },
];

const els = {
  readingSurface: document.getElementById("reading-surface"),
  sentenceCard: document.getElementById("sentence-card"),
  wordCard: document.getElementById("word-card"),
  emptyState: document.getElementById("empty-state"),
  vocabularyList: document.getElementById("vocabulary-list"),
  favoritesList: document.getElementById("favorites-list"),
  recentList: document.getElementById("recent-list"),
  viewTitle: document.getElementById("view-title"),
  pasteInput: document.getElementById("paste-input"),
};

function init() {
  bindNavigation();
  bindInputModes();
  bindInputActions();
  renderRecentItems();
  loadSource(sampleSource);
  renderLibraries();
}

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.currentView = btn.dataset.view;
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".view").forEach((view) => {
        view.classList.toggle("active", view.id === `${state.currentView}-view`);
      });

      const titles = {
        reader: "阅读工作区",
        vocabulary: "生词本",
        favorites: "句子收藏",
      };
      els.viewTitle.textContent = titles[state.currentView];
    });
  });
}

function bindInputModes() {
  document.querySelectorAll(".segment").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.inputMode = btn.dataset.inputMode;
      document.querySelectorAll(".segment").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".input-mode").forEach((panel) => panel.classList.remove("active"));
      btn.classList.add("active");
      document
        .querySelector(`[data-mode-panel="${state.inputMode}"]`)
        .classList.add("active");
    });
  });
}

function bindInputActions() {
  document.getElementById("load-sample-btn").addEventListener("click", () => loadSource(sampleSource));
  document
    .getElementById("load-image-sample-btn")
    .addEventListener("click", () => loadSource({ ...sampleSource, title: "书页照片 OCR" }));
  document.getElementById("analyze-paste-btn").addEventListener("click", () => {
    const input = els.pasteInput.value.trim();
    if (!input) return;
    loadSource(buildSourceFromText(input));
  });
}

function loadSource(source) {
  state.source = source;
  state.sourceTitle = source.title;
  state.selectedSentenceId = null;
  state.selectedWord = null;
  renderReadingSurface();
  renderSentenceCard();
  renderWordCard();
}

function buildSourceFromText(text) {
  const rawSentences = text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  const sentences = rawSentences.map((sentence, index) => {
    const words = sentence.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);
    const chunkSize = Math.max(2, Math.ceil(words.length / 3));
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }

    return {
      id: `paste-${index + 1}`,
      text: sentence,
      translation: "这里会显示原型版翻译。后续接入 AI 后，会显示真实中文翻译。",
      chunks: buildMeaningChunks(words),
      keywords: words.slice(0, 3).map((word) => ({
        word,
        phonetic: "/demo/",
        meaning: "示例词义",
        example: `这里会展示包含 ${word} 的例句。`,
      })),
    };
  });

  return {
    id: `src-${Date.now()}`,
    title: "粘贴文本会话",
    type: "paste",
    createdAt: new Date().toLocaleString(),
    sentences,
  };
}

function renderRecentItems() {
  els.recentList.innerHTML = recentItems
    .map(
      (item) => `
        <div class="recent-item">
          <strong>${item.title}</strong>
          <p class="muted">${item.meta}</p>
        </div>
      `
    )
    .join("");
}

function renderReadingSurface() {
  els.readingSurface.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.className = "reading-paragraph";

  state.source.sentences.forEach((sentence) => {
    const button = document.getElementById("sentence-template").content.firstElementChild.cloneNode(true);
    button.className = "sentence-inline";
    button.classList.toggle("active", sentence.id === state.selectedSentenceId);
    button.innerHTML = decorateKeywords(sentence);
    button.setAttribute("aria-label", `查看句子解析: ${sentence.text}`);
    button.addEventListener("click", () => {
      state.selectedSentenceId = sentence.id;
      state.selectedWord = null;
      renderReadingSurface();
      renderSentenceCard();
      renderWordCard();
    });

    button.querySelectorAll(".keyword-inline").forEach((keyword) => {
      keyword.addEventListener("click", (event) => {
        event.stopPropagation();
        openWord(keyword.dataset.word, sentence.id);
      });
    });

    paragraph.appendChild(button);
  });

  els.readingSurface.appendChild(paragraph);
}

function decorateKeywords(sentence) {
  let html = sentence.text;

  sentence.keywords.forEach((keyword) => {
    const safe = keyword.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(
      new RegExp(safe, "i"),
      `<span class="keyword-inline" data-word="${keyword.word}">$&</span>`
    );
  });

  return html;
}

function getSelectedSentence() {
  return state.source.sentences.find((sentence) => sentence.id === state.selectedSentenceId) ?? null;
}

function renderSentenceCard() {
  const sentence = getSelectedSentence();
  if (!sentence) {
    els.emptyState.classList.remove("hidden");
    els.sentenceCard.classList.add("hidden");
    return;
  }

  els.emptyState.classList.add("hidden");
  els.sentenceCard.classList.remove("hidden");

  const isSaved = state.favorites.some((item) => item.id === sentence.id);
  els.sentenceCard.innerHTML = `
    <div class="bubble-header">
      <p class="eyebrow">句子解析</p>
      <div class="title-row">
        <h2>${sentence.text}</h2>
        <button class="icon-btn" id="sentence-save-action" aria-label="收藏句子">${isSaved ? "★" : "☆"}</button>
      </div>
      <div class="inline-actions">
        <button class="text-action" id="sentence-play-action">发音</button>
        <button class="text-action" id="sentence-shadow-action">跟读</button>
        <button class="score-pill ${getSentenceScore(sentence.text) < 70 ? "needs-work" : getSentenceScore(sentence.text) < 85 ? "fair" : ""}" id="sentence-score-action">${getSentenceScore(sentence.text)}/100 ${getSentenceScore(sentence.text) < 70 ? "需加强" : getSentenceScore(sentence.text) < 85 ? "一般" : "不错"}</button>
      </div>
    </div>
    <div class="card-block">
      <h3>结构拆分</h3>
      <div class="chunk-list">
        ${sentence.chunks
          .map(
            (chunk, index) => `
              <div class="chunk-line" data-offset="${index % 3}">${decorateChunkKeywords(chunk, sentence)}</div>
            `
          )
          .join("")}
      </div>
    </div>
    <div class="card-block">
      <h3>中文含义</h3>
      <p>${sentence.translation}</p>
    </div>
  `;

  els.sentenceCard.querySelectorAll(".chunk-keyword").forEach((chip) => {
    chip.addEventListener("click", (event) => {
      event.stopPropagation();
      openWord(chip.dataset.keyword, sentence.id);
    });
  });
  document.getElementById("sentence-play-action").addEventListener("click", playSelectedSentence);
  document.getElementById("sentence-shadow-action").addEventListener("click", startSentenceShadowing);
  document.getElementById("sentence-score-action").addEventListener("click", playLatestRecording);
  document.getElementById("sentence-save-action").addEventListener("click", saveSentence);
}

function decorateChunkKeywords(chunk, sentence) {
  let html = chunk;

  sentence.keywords.forEach((keyword) => {
    const safe = keyword.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(
      new RegExp(safe, "i"),
      `<button class="chunk-keyword" data-keyword="${keyword.word}" type="button">$&</button>`
    );
  });

  return html;
}

function openWord(word, sentenceId) {
  const sentence = state.source.sentences.find((item) => item.id === sentenceId);
  if (!sentence) return;
  state.selectedSentenceId = sentenceId;
  state.selectedWord = sentence.keywords.find((item) => item.word === word) ?? null;
  renderReadingSurface();
  renderSentenceCard();
  renderWordCard();
}

function renderWordCard() {
  if (!state.selectedWord) {
    els.wordCard.classList.add("hidden");
    return;
  }

  const score = mockScore(state.selectedWord.word);
  const scoreClass = score < 70 ? "needs-work" : score < 85 ? "fair" : "";
  const scoreLabel = score < 70 ? "需加强" : score < 85 ? "一般" : "不错";
  const existing = state.vocabulary.find((item) => item.word === state.selectedWord.word);

  els.wordCard.classList.remove("hidden");
  els.wordCard.innerHTML = `
    <div class="word-header">
      <p class="eyebrow">单词卡片</p>
      <div class="title-row">
        <h2>${state.selectedWord.word}</h2>
        <button class="icon-btn" id="save-word-action" aria-label="加入生词本">${existing ? "★" : "☆"}</button>
      </div>
      <p class="muted">${state.selectedWord.phonetic}</p>
      <div class="inline-actions">
        <button class="text-action" id="word-play-action">发音</button>
        <button class="text-action" id="word-record-action">${state.isRecording ? "停止" : "录音"}</button>
        <button class="score-pill ${scoreClass}" id="word-score-action">${score}/100 ${scoreLabel}</button>
      </div>
    </div>
    <div class="card-block">
      <h3>词义</h3>
      <p>${state.selectedWord.meaning}</p>
    </div>
    <div class="card-block">
      <h3>例句</h3>
      <p>${state.selectedWord.example}</p>
    </div>
  `;

  document.getElementById("word-play-action").addEventListener("click", () => speak(state.selectedWord.word));
  document.getElementById("word-record-action").addEventListener("click", () => toggleRecording(state.selectedWord.word));
  document.getElementById("save-word-action").addEventListener("click", saveWord);
  document.getElementById("word-score-action").addEventListener("click", playLatestRecording);
}

function saveWord() {
  if (!state.selectedWord) return;
  const existing = state.vocabulary.find((item) => item.word === state.selectedWord.word);

  if (existing) {
    existing.studyCount += 1;
    existing.lastStudied = new Date().toLocaleString();
  } else {
    state.vocabulary.unshift({
      ...state.selectedWord,
      studyCount: 1,
      lastStudied: new Date().toLocaleString(),
    });
  }

  renderLibraries();
  renderWordCard();
}

function saveSentence() {
  const sentence = getSelectedSentence();
  if (!sentence) return;
  if (!state.favorites.some((item) => item.id === sentence.id)) {
    state.favorites.unshift({
      id: sentence.id,
      text: sentence.text,
      translation: sentence.translation,
      sourceTitle: state.sourceTitle,
      savedAt: new Date().toLocaleString(),
    });
  }

  renderLibraries();
  renderSentenceCard();
}

function renderLibraries() {
  els.vocabularyList.innerHTML = state.vocabulary.length
    ? state.vocabulary
        .map(
          (word) => `
            <article class="library-item">
              <strong>${word.word}</strong>
              <p class="muted">${word.phonetic} · ${word.meaning}</p>
              <div class="library-item-meta">
                <span class="tag">已学习 ${word.studyCount} 次</span>
                <span class="tag">最近: ${word.lastStudied}</span>
              </div>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state"><p>还没有保存的单词。</p></div>`;

  els.favoritesList.innerHTML = state.favorites.length
    ? state.favorites
        .map(
          (item) => `
            <article class="library-item">
              <strong>${item.text}</strong>
              <p class="muted">${item.translation}</p>
              <div class="library-item-meta">
                <span class="tag">${item.sourceTitle}</span>
                <span class="tag">${item.savedAt}</span>
              </div>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state"><p>还没有收藏的句子。</p></div>`;
}

function playSelectedSentence() {
  const sentence = getSelectedSentence();
  if (!sentence) return;
  speak(sentence.text);
}

function startSentenceShadowing() {
  const sentence = getSelectedSentence();
  if (!sentence) return;
  toggleRecording(sentence.text);
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function toggleRecording(target) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("当前浏览器预览环境暂不支持录音。");
    return;
  }

  if (state.isRecording && state.mediaRecorder) {
    state.mediaRecorder.stop();
    return;
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      state.mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      state.latestRecordingTarget = target;
      state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      state.mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        state.isRecording = false;
        if (state.latestRecordingUrl) {
          URL.revokeObjectURL(state.latestRecordingUrl);
        }
        if (chunks.length) {
          const blob = new Blob(chunks, { type: state.mediaRecorder.mimeType || "audio/webm" });
          state.latestRecordingUrl = URL.createObjectURL(blob);
          state.latestRecordingScore = mockScore(target);
        }
        if (state.selectedWord) {
          renderWordCard();
        } else {
          renderSentenceCard();
        }
      };
      state.mediaRecorder.start();
      state.isRecording = true;
      if (state.selectedWord) {
        renderWordCard();
      } else {
        renderSentenceCard();
      }
    })
    .catch(() => {
      alert("麦克风权限被阻止了。");
    });
}

function playLatestRecording() {
  if (!state.latestRecordingUrl) {
    alert("还没有你的录音，先录一遍再播放。");
    return;
  }

  const audio = new Audio(state.latestRecordingUrl);
  audio.play().catch(() => {
    alert("当前环境暂时不能播放刚才的录音。");
  });
}

function mockScore(input) {
  const value = input.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 68 + (value % 28);
}

function getSentenceScore(text) {
  return state.latestRecordingTarget === text && state.latestRecordingScore
    ? state.latestRecordingScore
    : mockScore(text);
}

function buildMeaningChunks(words) {
  const targetCount = Math.min(3, Math.max(2, Math.ceil(words.length / 8)));
  const chunkSize = Math.ceil(words.length / targetCount);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  return chunks.slice(0, 3);
}

init();
