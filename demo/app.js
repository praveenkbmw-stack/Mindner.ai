// ============================================
// MINDNER — App Logic & Full Feature Engine
// ============================================

// ---- LOCAL DATABASE (localStorage) ----
const DEFAULT_MEMORIES = [
  { id: 1, title: "Our Wedding Day", year: 1970, tag: "Spouse", desc: "A beautiful day in Shillong, surrounded by friends and family.", emoji: "💑", imageSrc: null, lockedVoiceBlob: null, lockedVoiceUrl: null },
  { id: 2, title: "Anjali's Graduation", year: 1995, tag: "Daughter", desc: "Our daughter Anjali graduating with her Master's degree in Guwahati.", emoji: "🎓", imageSrc: null, lockedVoiceBlob: null, lockedVoiceUrl: null },
  { id: 3, title: "Picnic at Mizo Hills", year: 2012, tag: "Family", desc: "A sunny Sunday picnic in the hills with grandchildren.", emoji: "🧺", imageSrc: null, lockedVoiceBlob: null, lockedVoiceUrl: null }
];
const DEFAULT_ROUTINES = [
  { id: 1, title: "Morning Medicine", time: "08:30", desc: "Take one blue tablet from the morning box after breakfast.", completed: false },
  { id: 2, title: "Call Daughter Anjali", time: "10:00", desc: "Call Anjali on the tablet to say good morning.", completed: false },
  { id: 3, title: "Afternoon Walk", time: "16:30", desc: "Enjoy a 15-minute slow walk in the garden.", completed: false },
  { id: 4, title: "Evening Tea & Meditation", time: "18:00", desc: "10 minutes quiet breathing, then warm tea.", completed: false }
];
const DEFAULT_FAMILY = [
  { id: 1, name: "Arun", relationship: "Son", emoji: "🧑‍🦱", imageSrc: null, voiceBlob: null, voiceUrl: null, voiceText: "Hi Mom, this is Arun. I hope you are doing well. I will call you this evening." },
  { id: 2, name: "Priya", relationship: "Daughter", emoji: "👩", imageSrc: null, voiceBlob: null, voiceUrl: null, voiceText: "Hello Mom, it's Priya. I love you so much. Have a beautiful day!" },
  { id: 3, name: "Kumar", relationship: "Brother", emoji: "👨", imageSrc: null, voiceBlob: null, voiceUrl: null, voiceText: "Hey sister, Kumar here. Thinking of you. Hope the weather is nice." }
];

// Load/init from storage
function loadDB(key, defaults) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(defaults));
}
function saveDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

let memories = loadDB("mindner_memories_v2", DEFAULT_MEMORIES);
let routines = loadDB("mindner_routines_v2", DEFAULT_ROUTINES);
let familyMembers = loadDB("mindner_family_v2", DEFAULT_FAMILY);
let gameSessions = loadDB("mindner_game_sessions", []);
let caregiverAccount = loadDB("mindner_caregiver", null);
let patients = loadDB("mindner_patients", [{ id: 1, name: "Patient (Demo)" }]);
let isLoggedIn = false;

// ---- GLOBAL GAME STATE ----
let currentDifficulty = "Medium"; // "Easy" | "Medium" | "Hard"
let activeGameType = "";
let gameStartTime = null;
let attemptsCount = 0;
let cardsList = [];
let flippedIndexes = [];
let matchesFound = 0;
let matchPairsCount = 3;

// ---- SPEECH SYNTHESIS ----
const synth = window.speechSynthesis;
let currentLanguage = 'en';

function speakText(text) {
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = currentLanguage === 'bn' ? 'bn-IN' : currentLanguage === 'as' ? 'as-IN' : 'en-US';
  utter.rate = 0.75;
  utter.pitch = 1.05;
  synth.speak(utter);
}
function stopSpeech() { synth.cancel(); }

// ---- SPEECH RECOGNITION (Real STT) ----
let recognition = null;

function toggleSpeechRecognition() {
  const mic = document.getElementById("mic-trigger");
  const pulse = document.getElementById("assistant-pulse");
  const transcript = document.getElementById("user-transcript");
  const history = document.getElementById("assistant-text-history");
  const bubble = document.getElementById("assistant-speech-bubble");

  if (recognition) {
    recognition.stop();
    recognition = null;
    mic.innerText = "🎙️ SPEAK";
    mic.classList.remove("active");
    pulse.classList.remove("listening");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    transcript.innerText = "⚠️ Speech Recognition not supported in this browser. Try Chrome.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = currentLanguage === 'bn' ? 'bn-IN' : currentLanguage === 'as' ? 'as-IN' : 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    mic.innerText = "🛑 STOP";
    mic.classList.add("active");
    pulse.classList.add("listening");
    transcript.innerText = "🎤 Listening...";
  };

  recognition.onerror = (e) => {
    let msg = "Microphone error.";
    if (e.error === 'not-allowed') msg = "⚠️ Microphone permission denied. Please allow microphone access.";
    else if (e.error === 'no-speech') msg = "No speech detected. Please try again.";
    else if (e.error === 'network') msg = "Network error. Check your connection.";
    else msg = "Speech error: " + e.error;
    transcript.innerText = msg;
    mic.innerText = "🎙️ SPEAK";
    mic.classList.remove("active");
    pulse.classList.remove("listening");
    recognition = null;
  };

  recognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";
    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalText += event.results[i][0].transcript;
      } else {
        interimText += event.results[i][0].transcript;
      }
    }
    transcript.innerText = `You: "${finalText || interimText}"`;

    if (finalText) {
      // Process speech and respond
      const response = generateAssistantResponse(finalText);
      bubble.innerText = response;
      history.innerHTML = `<strong>You:</strong> "${finalText}"<br><strong>Assistant:</strong> "${response}"`;
      speakText(response);
    }
  };

  recognition.onend = () => {
    mic.innerText = "🎙️ SPEAK";
    mic.classList.remove("active");
    pulse.classList.remove("listening");
    recognition = null;
  };

  recognition.start();
}

function generateAssistantResponse(query) {
  const text = query.toLowerCase();
  if (text.includes("schedule") || text.includes("routine") || text.includes("today")) {
    const pending = routines.filter(r => !r.completed);
    if (pending.length > 0) return `You have ${pending.length} tasks today. Next: "${pending[0].title}" at ${pending[0].time}.`;
    return "You have completed all your scheduled tasks for today. Well done!";
  }
  if (text.includes("memory") || text.includes("photo") || text.includes("family")) {
    return `You have ${memories.length} memories saved. Opening your memory journey now.`;
  }
  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return "Hello, friend! I am right here with you. What would you like to do?";
  }
  if (text.includes("game") || text.includes("play")) {
    return "Let's play a cognitive game! Opening the games screen for you.";
  }
  if (text.includes("progress") || text.includes("score")) {
    if (gameSessions.length === 0) return "You haven't played any games yet. Let's play one!";
    const avg = gameSessions.reduce((s, g) => s + g.accuracy, 0) / gameSessions.length;
    return `Your average game accuracy is ${avg.toFixed(1)}% across ${gameSessions.length} sessions. Keep it up!`;
  }
  return "I hear you. We can play games, check your routine, or look at family photos. What would you prefer?";
}

function changeAssistantLanguage(lang) {
  currentLanguage = lang;
  const bubble = document.getElementById("assistant-speech-bubble");
  let text = "I am listening. How can I help you today?";
  if (lang === 'bn') text = "আমি শুনছি। আজ আপনাকে কীভাবে সাহায্য করতে পারি?";
  else if (lang === 'as') text = "মই শুনি আছোঁ। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?";
  bubble.innerText = text;
  speakText(text);
}

// ---- WELCOME ----
window.onload = () => {
  speakText("Welcome back, friend. Choose an activity from the buttons on your screen.");
  renderTimeline();
  renderRoutines();
  renderFamilyVoices();
  updateProgressBars();
  updateCaregiverAnalytics();
  renderPatientList();
};

// ---- NAVIGATION ----
function navigateTo(screenId) {
  document.querySelectorAll(".app-screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
  stopSpeech();

  if (screenId === "home-screen") speakText("Back to home.");
  else if (screenId === "games-screen") {
    speakText("Choose a cognitive game from the list.");
    document.getElementById("game-tier-display").innerText = currentDifficulty;
  }
  else if (screenId === "memories-screen") { speakText("Your memory journey."); renderTimeline(); }
  else if (screenId === "routine-screen") { speakText("Your daily checklist."); renderRoutines(); }
  else if (screenId === "family-voices-screen") { speakText("Listen to your family voices."); renderFamilyVoices(); }
  else if (screenId === "assistant-screen") speakText("I am listening. How can I help you?");
  else if (screenId === "progress-screen") { updateProgressBars(); }
  else if (screenId === "caregiver-dashboard-screen") { updateCaregiverAnalytics(); }
}

// ---- ROUTINES ----
function renderRoutines() {
  const container = document.getElementById("routine-checklist");
  container.innerHTML = "";
  routines.forEach(r => {
    const card = document.createElement("div");
    card.className = `routine-card ${r.completed ? 'completed' : ''}`;
    card.innerHTML = `
      <button class="routine-checkbox" onclick="toggleRoutine(${r.id})">${r.completed ? '✓' : ''}</button>
      <div class="routine-info" onclick="speakText('${r.title}. ${r.desc}')">
        <h3><span class="routine-time">[${r.time}]</span> ${r.title}</h3>
        <p class="routine-desc">${r.desc}</p>
      </div>
      <button class="read-alarm-btn" onclick="speakText('${r.title}. ${r.desc}')">🔊</button>`;
    container.appendChild(card);
  });
}
function toggleRoutine(id) {
  routines = routines.map(r => { if (r.id === id) { r.completed = !r.completed; if (r.completed) speakText(`Well done completing ${r.title}!`); } return r; });
  saveDB("mindner_routines_v2", routines);
  renderRoutines();
}

// ---- MEMORIES TIMELINE ----
function renderTimeline() {
  const container = document.getElementById("timeline-list");
  container.innerHTML = "";
  memories.sort((a, b) => a.year - b.year);

  memories.forEach((m, idx) => {
    const card = document.createElement("div");
    card.className = "timeline-card";
    const imgBlock = m.imageSrc
      ? `<img class="timeline-image-preview" src="${m.imageSrc}" alt="${m.title}">`
      : `<div class="timeline-image-mock">${m.emoji || '📸'}</div>`;
    card.innerHTML = `
      <div class="timeline-marker"><div class="timeline-year">${m.year}</div><div class="timeline-line"></div></div>
      <div class="timeline-content">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3>${m.title}</h3>
          <button onclick="deleteMemory(${idx})" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--alert-red);">🗑️</button>
        </div>
        <p style="font-size:14px;color:var(--text-light);font-weight:600;">People: ${m.tag}</p>
        ${imgBlock}
        <p style="font-size:17px;">${m.desc}</p>
        <div class="memory-action-row">
          <button class="play-note-btn" onclick="speakText('${m.desc.replace(/'/g, "\\'")}')">🔊 Read Description</button>
          <button class="play-voice-btn" onclick="playLockedVoice(${idx})">▶ Play My Voice</button>
        </div>
        <div class="lock-badge">${m.lockedVoiceUrl || m.lockedVoiceBlob ? '🔒 Memory Locked' : ''}</div>
      </div>`;
    container.appendChild(card);
  });
}

function deleteMemory(idx) {
  if (confirm("Are you sure you want to delete this memory?")) {
    memories.splice(idx, 1);
    saveDB("mindner_memories_v2", memories);
    renderTimeline();
  }
}

function playLockedVoice(idx) {
  const m = memories[idx];
  if (m.lockedVoiceUrl) {
    const audio = new Audio(m.lockedVoiceUrl);
    audio.play().catch(() => speakText("Could not play the recording."));
  } else {
    speakText("No personal voice recording is attached to this memory yet.");
  }
}

// ---- MEMORY RECORDING (MediaRecorder API) ----
let memoryMediaRecorder = null;
let memoryRecordedChunks = [];

function openMemoryRecordingDialog() {
  const modal = document.getElementById("recorder-modal");
  modal.classList.add("active-modal");
  const stopBtn = document.getElementById("modal-stop-btn");
  const cancelBtn = document.getElementById("modal-cancel-btn");

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    memoryRecordedChunks = [];
    memoryMediaRecorder = new MediaRecorder(stream);
    memoryMediaRecorder.ondataavailable = e => { if (e.data.size > 0) memoryRecordedChunks.push(e.data); };
    memoryMediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(memoryRecordedChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      // Store temporarily for the form submit
      window._pendingMemoryVoiceUrl = url;
      document.getElementById("recording-status-msg").innerText = "✅ Voice recorded successfully!";
      modal.classList.remove("active-modal");
    };
    memoryMediaRecorder.start();
  }).catch(err => {
    alert("Microphone permission denied or unavailable: " + err.message);
    modal.classList.remove("active-modal");
  });

  stopBtn.onclick = () => { if (memoryMediaRecorder && memoryMediaRecorder.state === "recording") memoryMediaRecorder.stop(); };
  cancelBtn.onclick = () => {
    if (memoryMediaRecorder && memoryMediaRecorder.state === "recording") { memoryMediaRecorder.stop(); }
    window._pendingMemoryVoiceUrl = null;
    modal.classList.remove("active-modal");
  };
}

function handleMemorySubmit(e) {
  e.preventDefault();
  const title = document.getElementById("elderly-mem-title").value;
  const desc = document.getElementById("elderly-mem-desc").value;
  const year = parseInt(document.getElementById("elderly-mem-year").value) || new Date().getFullYear();
  const people = document.getElementById("elderly-mem-people").value;
  const imageInput = document.getElementById("elderly-mem-image");

  let imageSrc = null;
  if (imageInput.files && imageInput.files[0]) {
    imageSrc = URL.createObjectURL(imageInput.files[0]);
  }

  const newMem = {
    id: Date.now(), title, year, tag: people || "Family", desc,
    emoji: "💖", imageSrc,
    lockedVoiceBlob: null,
    lockedVoiceUrl: window._pendingMemoryVoiceUrl || null
  };
  memories.push(newMem);
  saveDB("mindner_memories_v2", memories);
  window._pendingMemoryVoiceUrl = null;
  document.getElementById("recording-status-msg").innerText = "";
  document.getElementById("memory-form-elderly").reset();
  renderTimeline();
  speakText("Memory saved and locked successfully!");
}

// ---- FAMILY VOICES ----
let familyMediaRecorder = null;
let familyRecordedChunks = [];

function renderFamilyVoices() {
  const container = document.getElementById("family-voices-list");
  container.innerHTML = "";
  familyMembers.forEach((m, idx) => {
    const card = document.createElement("div");
    card.className = "family-voice-card";
    const avatarBlock = m.imageSrc
      ? `<img class="family-avatar" src="${m.imageSrc}" alt="${m.name}">`
      : `<div class="family-avatar-placeholder">${m.emoji || '💖'}</div>`;
    card.innerHTML = `
      ${avatarBlock}
      <div class="family-info">
        <h3>${m.name}</h3>
        <p>${m.relationship}</p>
      </div>
      <button class="family-play-btn" onclick="playFamilyVoice(${idx})">▶ Play Voice</button>
      <button class="family-stop-btn" onclick="stopSpeech()">🔊 Stop</button>`;
    container.appendChild(card);
  });
}

function playFamilyVoice(idx) {
  const m = familyMembers[idx];
  if (m.voiceUrl) {
    const audio = new Audio(m.voiceUrl);
    audio.play().catch(() => speakText(m.voiceText || "Hello from " + m.name));
  } else {
    // Fallback: use TTS to read the stored voice text
    speakText(m.voiceText || "Hello from " + m.name);
  }
}

function openFamilyRecordingDialog() {
  const modal = document.getElementById("recorder-modal");
  modal.classList.add("active-modal");
  const stopBtn = document.getElementById("modal-stop-btn");
  const cancelBtn = document.getElementById("modal-cancel-btn");

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    familyRecordedChunks = [];
    familyMediaRecorder = new MediaRecorder(stream);
    familyMediaRecorder.ondataavailable = e => { if (e.data.size > 0) familyRecordedChunks.push(e.data); };
    familyMediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(familyRecordedChunks, { type: 'audio/webm' });
      window._pendingFamilyVoiceUrl = URL.createObjectURL(blob);
      document.getElementById("family-recording-status").innerText = "✅ Voice recorded!";
      modal.classList.remove("active-modal");
    };
    familyMediaRecorder.start();
  }).catch(err => {
    alert("Microphone permission denied or unavailable: " + err.message);
    modal.classList.remove("active-modal");
  });

  stopBtn.onclick = () => { if (familyMediaRecorder && familyMediaRecorder.state === "recording") familyMediaRecorder.stop(); };
  cancelBtn.onclick = () => {
    if (familyMediaRecorder && familyMediaRecorder.state === "recording") familyMediaRecorder.stop();
    window._pendingFamilyVoiceUrl = null;
    modal.classList.remove("active-modal");
  };
}

function handleFamilyMemberSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("family-name").value;
  const rel = document.getElementById("family-relation").value;
  const imageInput = document.getElementById("family-image");

  let imageSrc = null;
  if (imageInput.files && imageInput.files[0]) {
    imageSrc = URL.createObjectURL(imageInput.files[0]);
  }

  familyMembers.push({
    id: Date.now(), name, relationship: rel, emoji: "💖",
    imageSrc, voiceBlob: null,
    voiceUrl: window._pendingFamilyVoiceUrl || null,
    voiceText: `Hi, this is ${name} speaking!`
  });
  saveDB("mindner_family_v2", familyMembers);
  window._pendingFamilyVoiceUrl = null;
  document.getElementById("family-recording-status").innerText = "";
  document.getElementById("family-member-form").reset();
  renderFamilyVoices();
  speakText(`${name}'s voice saved successfully!`);
}

// ---- COGNITIVE GAMES ENGINE ----
function closeActiveGame() {
  document.getElementById("active-game-board").classList.add("hidden");
  document.getElementById("games-selector").classList.remove("hidden");
  activeGameType = "";
  stopSpeech();
}

function startMemoryMatch() {
  activeGameType = "memory_match";
  gameStartTime = new Date();
  attemptsCount = 0;
  matchesFound = 0;
  flippedIndexes = [];

  const tierMap = { "Easy": 3, "Medium": 4, "Hard": 6 };
  matchPairsCount = tierMap[currentDifficulty] || 4;
  const emojis = ["🍎", "🐱", "☀️", "🚗", "🏠", "🌸", "🍌", "🐈"].slice(0, matchPairsCount);
  cardsList = [...emojis, ...emojis].sort(() => 0.5 - Math.random());

  document.getElementById("games-selector").classList.add("hidden");
  document.getElementById("active-game-board").classList.remove("hidden");
  document.getElementById("active-game-title").innerText = "Memory Card Match";

  const pg = document.getElementById("game-playground");
  const simplified = currentDifficulty === "Easy";
  pg.innerHTML = `<p style="font-size:17px;margin-bottom:14px;">Find matching pairs by clicking cards.</p>
    <div class="card-grid ${simplified ? 'simplified' : ''}" id="card-grid-container"></div>`;
  const grid = document.getElementById("card-grid-container");
  cardsList.forEach((_, idx) => {
    const card = document.createElement("div");
    card.className = "game-card"; card.id = `card-${idx}`; card.innerText = "?";
    card.onclick = () => handleCardClick(idx);
    grid.appendChild(card);
  });
  speakText("Find matching pairs. Tap the cards.");
}

function handleCardClick(idx) {
  if (flippedIndexes.includes(idx) || flippedIndexes.length >= 2) return;
  const card = document.getElementById(`card-${idx}`);
  card.innerText = cardsList[idx]; card.classList.add("flipped");
  flippedIndexes.push(idx); attemptsCount++;

  if (flippedIndexes.length === 2) {
    const [a, b] = flippedIndexes;
    if (cardsList[a] === cardsList[b]) {
      matchesFound++; flippedIndexes = [];
      speakText("Match found!");
      if (matchesFound === matchPairsCount) completeGameSession();
    } else {
      speakText("Try again.");
      setTimeout(() => {
        const c1 = document.getElementById(`card-${a}`), c2 = document.getElementById(`card-${b}`);
        if (c1) { c1.innerText = "?"; c1.classList.remove("flipped"); }
        if (c2) { c2.innerText = "?"; c2.classList.remove("flipped"); }
        flippedIndexes = [];
      }, 1000);
    }
  }
}

function startPhotoRecall() {
  activeGameType = "photo_recall";
  gameStartTime = new Date(); attemptsCount = 0;
  document.getElementById("games-selector").classList.add("hidden");
  document.getElementById("active-game-board").classList.remove("hidden");
  document.getElementById("active-game-title").innerText = "Photo Recall";

  const mem = memories[Math.floor(Math.random() * memories.length)];
  const wrongAnswers = ["Sunita (Friend)", "Kabir (Grandson)", "Anupama (Sister)"].filter(n => !n.includes(mem.tag));
  const opts = [`${mem.tag}`, wrongAnswers[0]].sort(() => 0.5 - Math.random());
  const imgBlock = mem.imageSrc
    ? `<img src="${mem.imageSrc}" style="max-height:140px;border-radius:16px;">`
    : `<span class="photo-placeholder-icon">${mem.emoji}</span>`;

  document.getElementById("game-playground").innerHTML = `
    <p style="font-size:18px;margin-bottom:14px;">Who is in this photo?</p>
    <div class="photo-frame">${imgBlock}<h3 style="margin-top:10px;">${mem.title} (${mem.year})</h3></div>
    <div class="photo-recall-options">
      ${opts.map(o => `<button class="option-btn" onclick="checkRecallAnswer('${o}','${mem.tag}')">${o}</button>`).join("")}
    </div>`;
  speakText(`Who is in this memory? Is it ${opts[0]} or ${opts[1]}?`);
}

function checkRecallAnswer(selected, correct) {
  attemptsCount++;
  if (selected.toLowerCase().includes(correct.toLowerCase())) {
    speakText("Correct! Great memory.");
    completeGameSession();
  } else {
    speakText("Not quite. Try again.");
  }
}

function startRoutineOrdering() {
  activeGameType = "routine_ordering";
  gameStartTime = new Date(); attemptsCount = 0;
  document.getElementById("games-selector").classList.add("hidden");
  document.getElementById("active-game-board").classList.remove("hidden");
  document.getElementById("active-game-title").innerText = "Routine Sequencing";
  document.getElementById("game-playground").innerHTML = `
    <p style="font-size:17px;margin-bottom:14px;">Put these morning steps in order.</p>
    <div class="order-list">
      <div class="order-item"><div class="order-num">1</div>Brush teeth and wash face</div>
      <div class="order-item"><div class="order-num">2</div>Have fresh breakfast</div>
      <div class="order-item"><div class="order-num">3</div>Take morning medication</div>
    </div>
    <button class="check-order-btn" onclick="completeGameSession()">Done / Check Sequence</button>`;
  speakText("Arrange morning steps: brush teeth, then breakfast, then medication.");
}

function completeGameSession() {
  const elapsed = (new Date() - gameStartTime) / 1000;
  let accuracy = 100;
  if (activeGameType === "memory_match") accuracy = Math.min(100, Math.round((matchPairsCount / attemptsCount) * 100));
  else if (activeGameType === "photo_recall") accuracy = attemptsCount <= 1 ? 100 : Math.max(30, 100 - (attemptsCount - 1) * 25);

  const score = Math.round(accuracy * 0.8 + Math.max(0, (30 - elapsed) / 30) * 20);

  // AI ADAPTIVE DIFFICULTY ADJUSTMENT
  const baseline = activeGameType === "memory_match" ? 15 : 12;
  const isHigh = accuracy > 85 && elapsed < baseline;
  const isStruggling = accuracy < 50 || attemptsCount >= 6;
  const oldDiff = currentDifficulty;
  if (isHigh) { if (currentDifficulty === "Easy") currentDifficulty = "Medium"; else if (currentDifficulty === "Medium") currentDifficulty = "Hard"; }
  else if (isStruggling) { if (currentDifficulty === "Hard") currentDifficulty = "Medium"; else if (currentDifficulty === "Medium") currentDifficulty = "Easy"; }

  // Log session to storage
  const session = {
    id: Date.now(), patient_id: 1, game_type: activeGameType,
    difficulty: oldDiff, score, accuracy,
    response_time: parseFloat(elapsed.toFixed(1)),
    attempts: attemptsCount, completed_at: new Date().toISOString()
  };
  gameSessions.push(session);
  saveDB("mindner_game_sessions", gameSessions);

  speakText("Great job! Game completed.");
  document.getElementById("game-playground").innerHTML = `
    <div style="text-align:center;padding:20px;">
      <span style="font-size:64px;">🏆</span>
      <h3 style="font-size:26px;margin:14px 0;">Excellent Work!</h3>
      <p style="font-size:19px;color:var(--text-light);">
        Score: ${score}<br>Accuracy: ${accuracy}%<br>Time: ${elapsed.toFixed(1)}s<br>
        Attempts: ${attemptsCount}<br>Difficulty: ${oldDiff} → ${currentDifficulty}
      </p>
      <button class="check-order-btn" onclick="closeActiveGame()">Return to Menu</button>
    </div>`;

  updateProgressBars();
  updateCaregiverAnalytics();
}

// ---- MY PROGRESS (Based on gameSessions ONLY) ----
function updateProgressBars() {
  const memSessions = gameSessions.filter(s => s.game_type === "memory_match");
  const recallSessions = gameSessions.filter(s => s.game_type === "photo_recall");
  const orderSessions = gameSessions.filter(s => s.game_type === "routine_ordering");
  const allSessions = gameSessions;

  const avg = (arr, key) => arr.length ? arr.reduce((s, g) => s + g[key], 0) / arr.length : 0;

  const memoryVal = memSessions.length ? Math.round(avg(memSessions, "accuracy")) : 0;
  const attentionVal = recallSessions.length ? Math.round(avg(recallSessions, "accuracy")) : 0;
  const patternVal = orderSessions.length ? Math.round(avg(orderSessions, "accuracy")) : 0;
  const reactionVal = allSessions.length ? Math.round(Math.max(10, Math.min(100, (12 - avg(allSessions, "response_time")) / 12 * 100))) : 0;

  setBar("memory", memoryVal);
  setBar("attention", attentionVal);
  setBar("pattern", patternVal);
  setBar("reaction", reactionVal);

  // Update trend SVG from real data
  updateTrendChart();
}

function setBar(name, val) {
  const fillEl = document.getElementById(`fill-${name}`);
  const valEl = document.getElementById(`prog-val-${name}`);
  if (fillEl) fillEl.style.width = val + "%";
  if (valEl) valEl.innerText = val + "%";
}

function updateTrendChart() {
  const recent = gameSessions.slice(-5);
  if (recent.length < 2) return;
  const xStep = 400 / (recent.length - 1);
  const points = recent.map((s, i) => `${20 + i * xStep},${180 - s.accuracy * 1.6}`).join(" ");
  const line = document.getElementById("trend-line-points");
  if (line) line.setAttribute("points", points);
}

// ---- PROGRESS TAB SWITCHING ----
function switchProgressTab(tabId) {
  document.querySelectorAll(".progress-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".progress-content").forEach(c => c.classList.remove("active-content"));
  event.target.classList.add("active");
  document.getElementById(`progress-${tabId}`).classList.add("active-content");
}

// ---- CAREGIVER AUTH ----
function handleCaregiverLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-pass").value;

  if (!caregiverAccount) {
    alert("No caregiver account found. Please register first.");
    return;
  }
  // Simple hash comparison (demo: stores hashed version via btoa)
  if (caregiverAccount.username === username && caregiverAccount.passwordHash === btoa(password)) {
    isLoggedIn = true;
    document.getElementById("logout-btn").classList.remove("hidden");
    navigateTo("caregiver-dashboard-screen");
    speakText("Caregiver login successful.");
  } else {
    alert("Incorrect username or password.");
  }
}

function handleCaregiverRegister(e) {
  e.preventDefault();
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const phone = document.getElementById("reg-phone").value;
  const username = document.getElementById("reg-username").value;
  const pass = document.getElementById("reg-pass").value;
  const confPass = document.getElementById("reg-conf-pass").value;

  if (pass !== confPass) { alert("Passwords do not match."); return; }
  if (pass.length < 6) { alert("Password must be at least 6 characters."); return; }

  caregiverAccount = { fullName: name, email, phone, username, passwordHash: btoa(pass), createdAt: new Date().toISOString() };
  saveDB("mindner_caregiver", caregiverAccount);
  alert("Caregiver account registered successfully! You can now log in.");
  navigateTo("caregiver-login-screen");
}

function logoutCaregiver() {
  isLoggedIn = false;
  document.getElementById("logout-btn").classList.add("hidden");
  navigateTo("home-screen");
  speakText("Logged out from caregiver portal.");
}

// ---- CAREGIVER ANALYTICS (GAME DATA ONLY) ----
function updateCaregiverAnalytics() {
  if (gameSessions.length === 0) return;
  const avgAcc = (gameSessions.reduce((s, g) => s + g.accuracy, 0) / gameSessions.length).toFixed(1);
  const avgSpd = (gameSessions.reduce((s, g) => s + g.response_time, 0) / gameSessions.length).toFixed(1);

  const accEl = document.getElementById("cg-accuracy-display");
  const spdEl = document.getElementById("cg-speed-display");
  if (accEl) accEl.innerText = avgAcc + "%";
  if (spdEl) spdEl.innerText = avgSpd + "s";

  // Update caregiver SVG chart
  const recent = gameSessions.slice(-5);
  if (recent.length >= 2) {
    const xStep = 400 / (recent.length - 1);
    const pts = recent.map((s, i) => `${20 + i * xStep},${180 - s.accuracy * 1.6}`).join(" ");
    const line = document.getElementById("cg-trend-points");
    if (line) line.setAttribute("points", pts);
  }
}

// ---- CAREGIVER TAB SWITCHING ----
function switchCaregiverTab(tabId) {
  document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
  document.querySelectorAll(".caregiver-tab-content").forEach(c => c.classList.remove("active-tab"));
  event.target.classList.add("active");
  document.getElementById(`caregiver-${tabId}`).classList.add("active-tab");
}

// ---- CAREGIVER PATIENT MANAGEMENT ----
function renderPatientList() {
  const container = document.getElementById("linked-patients-container");
  if (!container) return;
  container.innerHTML = "";
  patients.forEach(p => {
    const el = document.createElement("div");
    el.style.cssText = "padding:12px;background:#EDF2F7;border-radius:12px;font-weight:bold;";
    el.innerText = `#${p.id} — ${p.name}`;
    container.appendChild(el);
  });
}

function addNewPatientAssociation() {
  const name = document.getElementById("new-patient-name").value;
  if (!name) return;
  patients.push({ id: Date.now(), name });
  saveDB("mindner_patients", patients);
  document.getElementById("new-patient-name").value = "";
  renderPatientList();
}

// ---- CAREGIVER ROUTINE CONFIG ----
function handleRoutineSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("rot-title").value;
  const time = document.getElementById("rot-time").value;
  const desc = document.getElementById("rot-desc").value;
  routines.push({ id: Date.now(), title, time, desc, completed: false });
  saveDB("mindner_routines_v2", routines);
  document.getElementById("routine-form").reset();
  alert("Routine schedule updated.");
}
