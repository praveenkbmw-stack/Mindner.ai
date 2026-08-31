// ============================================
// MINDNER — App Logic & Full Feature Engine
// ============================================

const ACTIVE_USER_ID = 1;

// Standard Memory Categories
const STANDARD_CATEGORIES = [
  "Wedding Day",
  "Childhood",
  "School",
  "Family",
  "Career",
  "Important Events"
];

// ---- LOCAL DATABASE (localStorage) ----
const DEFAULT_MEMORIES = [
  { id: 1, category: "Wedding Day", title: "Our Wedding Day", year: 1970, tag: "Spouse", desc: "A beautiful day in Shillong, surrounded by friends and family in celebration.", emoji: "💑", photo_url: null, imageSrc: null, voice_recording_url: null, is_custom: false, user_id: ACTIVE_USER_ID },
  { id: 2, category: "School", title: "Anjali's Graduation", year: 1995, tag: "Daughter", desc: "Our daughter Anjali graduating with her Master's degree in Guwahati. We were so proud.", emoji: "🎓", photo_url: null, imageSrc: null, voice_recording_url: null, is_custom: false, user_id: ACTIVE_USER_ID },
  { id: 3, category: "Family", title: "Picnic at Mizo Hills", year: 2012, tag: "Family", desc: "A sunny Sunday picnic in the hills with grandchildren laughing together.", emoji: "🧺", photo_url: null, imageSrc: null, voice_recording_url: null, is_custom: false, user_id: ACTIVE_USER_ID }
];

const DEFAULT_ROUTINES = [
  { id: 1, title: "Morning Medicine", time: "08:30", desc: "Take one blue tablet from the morning box after breakfast.", completed: false, user_id: ACTIVE_USER_ID },
  { id: 2, title: "Call Daughter Anjali", time: "10:00", desc: "Call Anjali on the tablet to say good morning.", completed: false, user_id: ACTIVE_USER_ID },
  { id: 3, title: "Afternoon Walk", time: "16:30", desc: "Enjoy a 15-minute slow walk in the garden.", completed: false, user_id: ACTIVE_USER_ID },
  { id: 4, title: "Evening Tea & Meditation", time: "18:00", desc: "10 minutes quiet breathing, then warm tea.", completed: false, user_id: ACTIVE_USER_ID }
];

const DEFAULT_FAMILY = [
  { id: 1, name: "Arun", relationship: "Son", emoji: "🧑‍🦱", image_url: null, imageSrc: null, voice_recording_url: null, voiceText: "Hi Mom, this is Arun. I hope you are doing well. I will call you this evening.", user_id: ACTIVE_USER_ID },
  { id: 2, name: "Priya", relationship: "Daughter", emoji: "👩", image_url: null, imageSrc: null, voice_recording_url: null, voiceText: "Hello Mom, it's Priya. I love you so much. Have a beautiful day!", user_id: ACTIVE_USER_ID },
  { id: 3, name: "Kumar", relationship: "Brother", emoji: "👨", image_url: null, imageSrc: null, voice_recording_url: null, voiceText: "Hey sister, Kumar here. Thinking of you. Hope the weather is nice.", user_id: ACTIVE_USER_ID }
];

// Load/init from storage
function loadDB(key, defaults) {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(defaults));
}
function saveDB(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

let memories = loadDB("mindner_memories_v3", DEFAULT_MEMORIES);
let customCategories = loadDB("mindner_custom_categories", []);
let selectedCategoryFilter = "All";
let routines = loadDB("mindner_routines_v3", DEFAULT_ROUTINES);
let familyMembers = loadDB("mindner_family_v3", DEFAULT_FAMILY);
let customPhotoRecallItems = loadDB("mindner_custom_photo_recall", [
  { id: 1, user_id: ACTIVE_USER_ID, patient_id: ACTIVE_USER_ID, person_name: "Arun", relationship: "Son", description: "Eldest son", image_path: null, image_url: null, created_at: new Date().toISOString() }
]);
let gameSessions = loadDB("mindner_game_sessions_v3", [
  { id: 101, user_id: ACTIVE_USER_ID, patient_id: ACTIVE_USER_ID, game_type: 'routine_sequencing', score: 85, accuracy: 88.0, response_time_seconds: 12.4, response_time: 12.4, attempts: 2, difficulty: 'Medium', completed_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 102, user_id: ACTIVE_USER_ID, patient_id: ACTIVE_USER_ID, game_type: 'memory_match', score: 92, accuracy: 95.0, response_time_seconds: 9.8, response_time: 9.8, attempts: 4, difficulty: 'Medium', completed_at: new Date(Date.now() - 86400000).toISOString() }
]);
let caregiverAccount = loadDB("mindner_caregiver", null);
let patients = loadDB("mindner_patients", [{ id: ACTIVE_USER_ID, name: "Patient (Demo)" }]);
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

// Routine Sequencing State
let currentSequenceArray = [];
const correctMorningSequence = [
  { id: "s1", text: "1. Wake up & Wash Face", order: 1 },
  { id: "s2", text: "2. Brush Teeth", order: 2 },
  { id: "s3", text: "3. Eat Fresh Breakfast", order: 3 },
  { id: "s4", text: "4. Take Morning Medication", order: 4 }
];

// ---- SPEECH SYNTHESIS & TTS STREAM CONTROLS ----
const synth = window.speechSynthesis;
let currentLanguage = 'en';
let currentUtterance = null;
let currentAssistantStreamText = "";

function speakText(text) {
  synth.cancel();
  currentAssistantStreamText = text;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = currentLanguage === 'bn' ? 'bn-IN' : currentLanguage === 'as' ? 'as-IN' : 'en-US';
  utter.rate = 0.78;
  utter.pitch = 1.05;
  currentUtterance = utter;
  synth.speak(utter);
}

function stopSpeech() {
  synth.cancel();
}

function pauseAssistantVoice() {
  if (synth.speaking && !synth.paused) {
    synth.pause();
  }
}

function resumeOrPlayAssistantVoice() {
  if (synth.paused) {
    synth.resume();
  } else if (currentAssistantStreamText) {
    speakText(currentAssistantStreamText);
  }
}

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
      bubble.innerText = response.length > 90 ? response.slice(0, 90) + "..." : response;
      history.innerHTML = `<strong>You:</strong> "${finalText}"<br><br><strong>MINDNER Companion:</strong><br>${response}`;
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

// FEATURE 10: Rich, long-form simplified responses (10+ sentences for open-ended queries)
function generateAssistantResponse(query) {
  const text = query.toLowerCase();
  
  if (text.includes("story") || text.includes("tell me") || text.includes("relax") || text.includes("peace")) {
    return "Once upon a time, in a peaceful green valley surrounded by gentle hills, there stood a calm garden. The morning sun rose slowly and cast a warm golden light over the soft grass. Colorful flowers bloomed softly, sharing a sweet and comforting scent in the morning air. Birds with bright feathers sang pleasant melodies high up in the pine trees. A gentle breeze whispered softly through the green leaves, bringing a sense of deep peace. Nearby, a crystal-clear stream flowed over smooth, polished stones with a soothing sound. Butterflies danced gracefully from flower to flower without any rush. Sitting on a wooden bench, you could breathe in the fresh air and feel completely at ease. Every moment in this garden reminded everyone that each day is a gift of joy and quiet strength. The warmth of the afternoon sun wrapped around the valley like a soft, cozy blanket. You are safe here, you are deeply loved, and everything around you is calm and well.";
  }

  if (text.includes("schedule") || text.includes("routine") || text.includes("today") || text.includes("day")) {
    const userRoutines = routines.filter(r => r.user_id === ACTIVE_USER_ID);
    const pending = userRoutines.filter(r => !r.completed);
    let str = "Here is an overview of your schedule and activities for today. ";
    str += `You currently have ${userRoutines.length} planned activities on your checklist. `;
    if (pending.length > 0) {
      str += `Your upcoming activity is ${pending[0].title}, scheduled at ${pending[0].time}. `;
      str += "Taking each routine step by step helps keep your day pleasant and organized. ";
      str += "Remember to enjoy your breakfast, take your medication with fresh water, and take short rest breaks whenever you like. ";
      str += "You can also tap on any item in your Today's Routine screen to hear its instructions. ";
      str += "Staying hydrated with warm tea or water throughout the day is very good for your wellness. ";
      str += "After finishing your activities, you can listen to sweet voices from your loved ones. ";
      str += "We are right here with you through every part of your day.";
    } else {
      str += "You have successfully finished all your planned tasks for today. You did an amazing job! Take some time to relax, drink some soothing warm tea, and smile.";
    }
    return str;
  }

  if (text.includes("memory") || text.includes("photo") || text.includes("family")) {
    const count = memories.filter(m => m.user_id === ACTIVE_USER_ID).length;
    return `You have ${count} precious memories saved in your personal journey. Looking back at memories helps bring warmth and wonderful feelings. You have memories celebrating your wedding day, your loved ones, and beautiful travels. In your Memory Journey, you can also record your own voice to tell the stories in your own words. Each photograph is a bookmark of love and joy in your life. You can open any card at any time to listen to your voice or hear the description read aloud.`;
  }

  if (text.includes("game") || text.includes("play") || text.includes("brain")) {
    return "Playing cognitive games is a wonderful and enjoyable way to keep your mind active and cheerful. We have the Memory Card Match game, the Photo Recall game, and the Routine Sequencing game. Each game adjusts gently to the pace that feels most comfortable for you. There is never any rush or pressure, and you can play as many times as you like. Let us choose a fun game whenever you feel ready.";
  }

  if (text.includes("progress") || text.includes("score")) {
    const sessions = gameSessions.filter(s => s.user_id === ACTIVE_USER_ID);
    if (sessions.length === 0) return "You have not played any games yet today. When you are ready, we can play a simple card matching or routine puzzle together!";
    const avg = sessions.reduce((s, g) => s + g.accuracy, 0) / sessions.length;
    return `Looking at your cognitive activity, you have completed ${sessions.length} game sessions. Your overall average accuracy is ${avg.toFixed(1)} percent. Your reaction speed and pattern recognition are performing very well. Consistent daily engagement helps you stay sharp and refreshed. You should be very proud of your effort!`;
  }

  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return "Hello, my dear friend! It is so wonderful to talk with you. The day is bright and peaceful. I am here to help you check your daily routines, listen to your family voices, or share stories. How are you feeling today?";
  }

  return "I am always here beside you to assist with your routines, your memory journey, or to share peaceful stories. Take your time, breathe gently, and tell me what you would like to explore next.";
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
  renderCategoryFilter();
  renderTimeline();
  renderRoutines();
  renderFamilyVoices();
  updateProgressBars();
  updateCaregiverAnalytics();
  renderCustomPhotoRecallList();
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
  const userRoutines = routines.filter(r => r.user_id === ACTIVE_USER_ID);
  userRoutines.forEach(r => {
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
  routines = routines.map(r => {
    if (r.id === id) {
      r.completed = !r.completed;
      if (r.completed) speakText(`Well done completing ${r.title}!`);
    }
    return r;
  });
  saveDB("mindner_routines_v3", routines);
  renderRoutines();
}

// ========================================================
// MEMORIES & DYNAMIC CUSTOM CATEGORIES (FEATURES 2 & 3)
// ========================================================

function renderCategoryFilter() {
  const filterContainer = document.getElementById("memory-category-filter");
  const selectDropdown = document.getElementById("elderly-mem-category");
  if (!filterContainer) return;

  const allCats = [...STANDARD_CATEGORIES, ...customCategories];
  
  // Render Pills
  filterContainer.innerHTML = "";
  const allPill = document.createElement("button");
  allPill.className = `category-pill ${selectedCategoryFilter === 'All' ? 'active' : ''}`;
  allPill.innerText = "All Categories";
  allPill.onclick = () => { selectedCategoryFilter = "All"; renderCategoryFilter(); renderTimeline(); };
  filterContainer.appendChild(allPill);

  allCats.forEach(cat => {
    const pill = document.createElement("button");
    pill.className = `category-pill ${selectedCategoryFilter === cat ? 'active' : ''}`;
    pill.innerText = cat;
    pill.onclick = () => { selectedCategoryFilter = cat; renderCategoryFilter(); renderTimeline(); };
    filterContainer.appendChild(pill);
  });

  // Update form dropdown options
  if (selectDropdown) {
    selectDropdown.innerHTML = allCats.map(cat => `<option value="${cat}">${cat}</option>`).join("");
  }
}

function addNewCustomCategory() {
  const input = document.getElementById("new-category-input");
  const catName = (input.value || "").trim();
  if (!catName) {
    alert("Please enter a category name.");
    return;
  }
  if ([...STANDARD_CATEGORIES, ...customCategories].includes(catName)) {
    alert("This category already exists.");
    return;
  }

  customCategories.push(catName);
  saveDB("mindner_custom_categories", customCategories);
  input.value = "";
  selectedCategoryFilter = catName;
  renderCategoryFilter();
  speakText(`Category ${catName} added to Memory Journey.`);
}

function renderTimeline() {
  const container = document.getElementById("timeline-list");
  container.innerHTML = "";

  let userMemories = memories.filter(m => m.user_id === ACTIVE_USER_ID);
  if (selectedCategoryFilter !== "All") {
    userMemories = userMemories.filter(m => (m.category || "Important Events") === selectedCategoryFilter);
  }

  userMemories.sort((a, b) => a.year - b.year);

  if (userMemories.length === 0) {
    container.innerHTML = `<p style="padding:20px; color:var(--text-light); text-align:center;">No memories recorded in this category yet. Use the form to add one with photos and your voice!</p>`;
    return;
  }

  userMemories.forEach((m) => {
    const card = document.createElement("div");
    card.className = "timeline-card";
    const imgSource = m.photo_url || m.imageSrc;
    const imgBlock = imgSource
      ? `<img class="timeline-image-preview" src="${imgSource}" alt="${m.title}">`
      : `<div class="timeline-image-mock">${m.emoji || '📸'}</div>`;

    const voiceUrl = m.voice_recording_url || m.lockedVoiceUrl;

    card.innerHTML = `
      <div class="timeline-marker"><div class="timeline-year">${m.year || 2026}</div><div class="timeline-line"></div></div>
      <div class="timeline-content">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <span class="category-tag-badge">${m.category || 'Important Events'}</span>
            <h3 style="margin-top:2px;">${m.title}</h3>
          </div>
          <button onclick="deleteMemory(${m.id})" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--alert-red);min-height:48px;min-width:48px;" title="Delete">🗑️</button>
        </div>
        <p style="font-size:14px;color:var(--text-light);font-weight:600;">People: ${m.tag || 'Family'}</p>
        ${imgBlock}
        <p style="font-size:16px;margin:8px 0;line-height:1.5;">${m.desc}</p>
        
        <!-- Inline MediaRecorder Module & Actions on every card -->
        <div class="card-voice-module">
          <div class="card-voice-header">
            <span>🎙️ Card Voice Note</span>
            <span>${voiceUrl ? '✅ Voice Attached' : '⚠️ No Voice Recorded'}</span>
          </div>
          <div class="card-voice-btns">
            <button class="voice-action-btn btn-record" id="rec-btn-${m.id}" onclick="recordCardVoice(${m.id})">🎙️ Record</button>
            <button class="voice-action-btn btn-stop" id="stop-btn-${m.id}" onclick="stopCardVoiceRecording(${m.id})">⏹ Stop</button>
            <button class="voice-action-btn btn-play" onclick="playCardVoice(${m.id})">▶ Play Voice</button>
            ${voiceUrl ? `<button class="voice-action-btn btn-delete" onclick="deleteCardVoice(${m.id})">🗑️ Delete Voice</button>` : ''}
          </div>
          <button class="voice-action-btn btn-reader" onclick="speakText('${m.title}. ${(m.desc || '').replace(/'/g, "\\'")}')">🔊 Read Description</button>
        </div>

        <div class="lock-badge">${voiceUrl ? '🔒 Memory Locked with Voice' : ''}</div>
      </div>`;
    container.appendChild(card);
  });
}

function deleteMemory(id) {
  if (confirm("Are you sure you want to delete this memory?")) {
    memories = memories.filter(m => m.id !== id);
    saveDB("mindner_memories_v3", memories);
    renderTimeline();
  }
}

// MediaRecorder on individual card
let activeCardRecorder = null;
let activeCardStream = null;
let activeCardChunks = [];

function recordCardVoice(memId) {
  const btn = document.getElementById(`rec-btn-${memId}`);
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    activeCardStream = stream;
    activeCardChunks = [];
    activeCardRecorder = new MediaRecorder(stream);
    activeCardRecorder.ondataavailable = e => { if (e.data.size > 0) activeCardChunks.push(e.data); };
    activeCardRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(activeCardChunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const mem = memories.find(m => m.id === memId);
      if (mem) {
        mem.voice_recording_url = url;
        mem.lockedVoiceUrl = url;
        saveDB("mindner_memories_v3", memories);
        renderTimeline();
        speakText("Voice recording saved to memory card.");
      }
    };
    activeCardRecorder.start();
    if (btn) {
      btn.innerText = "🔴 Recording...";
      btn.classList.add("recording");
    }
  }).catch(err => {
    alert("Microphone permission denied or unavailable: " + err.message);
  });
}

function stopCardVoiceRecording(memId) {
  if (activeCardRecorder && activeCardRecorder.state === "recording") {
    activeCardRecorder.stop();
    const btn = document.getElementById(`rec-btn-${memId}`);
    if (btn) {
      btn.innerText = "🎙️ Record";
      btn.classList.remove("recording");
    }
  }
}

function playCardVoice(memId) {
  const m = memories.find(mem => mem.id === memId);
  const voiceUrl = m ? (m.voice_recording_url || m.lockedVoiceUrl) : null;
  if (voiceUrl) {
    const audio = new Audio(voiceUrl);
    audio.play().catch(() => speakText("Could not play the recorded voice."));
  } else {
    speakText("No personal voice recording is attached to this memory yet. You can tap record to add one.");
  }
}

function deleteCardVoice(memId) {
  const m = memories.find(mem => mem.id === memId);
  if (m) {
    m.voice_recording_url = null;
    m.lockedVoiceUrl = null;
    saveDB("mindner_memories_v3", memories);
    renderTimeline();
    speakText("Voice note removed from memory.");
  }
}

// Global modal voice lock
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
      window._pendingMemoryVoiceUrl = url;
      document.getElementById("recording-status-msg").innerText = "✅ Voice recorded & ready to lock!";
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
  const category = document.getElementById("elderly-mem-category").value || "Important Events";
  const title = document.getElementById("elderly-mem-title").value;
  const desc = document.getElementById("elderly-mem-desc").value;
  const year = parseInt(document.getElementById("elderly-mem-year").value) || new Date().getFullYear();
  const people = document.getElementById("elderly-mem-people").value;
  const imageInput = document.getElementById("elderly-mem-image");

  let photo_url = null;
  if (imageInput.files && imageInput.files[0]) {
    photo_url = URL.createObjectURL(imageInput.files[0]);
  }

  const isCustom = !STANDARD_CATEGORIES.includes(category);

  const newMem = {
    id: Date.now(),
    user_id: ACTIVE_USER_ID,
    category: category,
    category_name: category,
    title,
    year,
    tag: people || "Family",
    desc,
    emoji: "💖",
    photo_url,
    imageSrc: photo_url,
    is_custom: isCustom,
    voice_recording_url: window._pendingMemoryVoiceUrl || null,
    lockedVoiceUrl: window._pendingMemoryVoiceUrl || null
  };

  memories.push(newMem);
  saveDB("mindner_memories_v3", memories);
  window._pendingMemoryVoiceUrl = null;
  document.getElementById("recording-status-msg").innerText = "";
  document.getElementById("memory-form-elderly").reset();
  renderTimeline();
  speakText("Memory saved and locked to your timeline successfully!");
}

// ========================================================
// FAMILY VOICES (FEATURES 4 & 5)
// ========================================================
let familyMediaRecorder = null;
let familyRecordedChunks = [];

function renderFamilyVoices() {
  const container = document.getElementById("family-voices-list");
  container.innerHTML = "";
  const userFamily = familyMembers.filter(m => m.user_id === ACTIVE_USER_ID);

  userFamily.forEach((m, idx) => {
    const card = document.createElement("div");
    card.className = "family-voice-card";
    const imgSrc = m.image_url || m.imageSrc;
    const photoBlock = imgSrc
      ? `<img class="family-card-top-photo" src="${imgSrc}" alt="${m.name}">`
      : `<div class="family-card-placeholder-photo">${m.emoji || '💖'}</div>`;

    card.innerHTML = `
      ${photoBlock}
      <div class="family-card-body">
        <div>
          <div class="family-card-name">${m.name}</div>
          <div class="family-card-relation">${m.relationship}</div>
        </div>
        <div class="family-card-controls">
          <button class="family-play-btn" onclick="playFamilyVoice(${idx})">▶ Play Voice</button>
          <button class="family-stop-btn" onclick="stopSpeech()">⏹</button>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

function playFamilyVoice(idx) {
  const userFamily = familyMembers.filter(m => m.user_id === ACTIVE_USER_ID);
  const m = userFamily[idx];
  if (!m) return;
  const voiceUrl = m.voice_recording_url || m.voiceUrl;
  if (voiceUrl) {
    const audio = new Audio(voiceUrl);
    audio.play().catch(() => speakText(m.voiceText || "Hello from " + m.name));
  } else {
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

  let image_url = null;
  if (imageInput.files && imageInput.files[0]) {
    image_url = URL.createObjectURL(imageInput.files[0]);
  }

  familyMembers.push({
    id: Date.now(),
    user_id: ACTIVE_USER_ID,
    name,
    relationship: rel,
    emoji: "💖",
    image_url,
    imageSrc: image_url,
    voice_recording_url: window._pendingFamilyVoiceUrl || null,
    voiceUrl: window._pendingFamilyVoiceUrl || null,
    voiceText: `Hi, this is ${name} speaking! Sending you my warmest love.`
  });

  saveDB("mindner_family_v3", familyMembers);
  window._pendingFamilyVoiceUrl = null;
  document.getElementById("family-recording-status").innerText = "";
  document.getElementById("family-member-form").reset();
  renderFamilyVoices();
  speakText(`${name}'s voice saved successfully!`);
}

// ========================================================
// COGNITIVE GAMES & ROUTINE SEQUENCING FIX (FEATURES 8 & 9)
// ========================================================

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

  // 1. Check for caregiver-customized photo recall items for the active user
  const userCustomItems = customPhotoRecallItems.filter(item => item.user_id === ACTIVE_USER_ID);
  
  let targetPerson = "";
  let targetImgSrc = null;
  let targetTitle = "";
  let targetYear = "";

  if (userCustomItems.length > 0) {
    // Use caregiver-customized photo recall data
    const chosen = userCustomItems[Math.floor(Math.random() * userCustomItems.length)];
    targetPerson = chosen.person_name;
    targetImgSrc = chosen.image_url || chosen.image_path;
    targetTitle = chosen.relationship ? `${chosen.person_name} (${chosen.relationship})` : chosen.person_name;
  } else {
    // Fallback to active user's memories or default
    const userMemories = memories.filter(m => m.user_id === ACTIVE_USER_ID);
    const mem = userMemories.length ? userMemories[Math.floor(Math.random() * userMemories.length)] : DEFAULT_MEMORIES[0];
    targetPerson = mem.tag;
    targetImgSrc = mem.photo_url || mem.imageSrc;
    targetTitle = `${mem.title} (${mem.year})`;
  }

  // Generate plausible alternate options (not matching the correct person)
  const poolOfNames = ["Arun", "Priya", "Sunita (Friend)", "Kabir (Grandson)", "Anupama (Sister)", "Rajesh", "Meera", "Vikram"];
  const wrongOptions = poolOfNames.filter(n => !n.toLowerCase().includes(targetPerson.toLowerCase()));
  const wrongOption = wrongOptions.length ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)] : "A Family Friend";
  
  const opts = [targetPerson, wrongOption].sort(() => 0.5 - Math.random());
  
  const imgBlock = targetImgSrc
    ? `<img src="${targetImgSrc}" style="max-height:160px; max-width:90%; border-radius:16px; object-fit:cover;">`
    : `<span class="photo-placeholder-icon">👤</span>`;

  document.getElementById("game-playground").innerHTML = `
    <p style="font-size:18px;margin-bottom:14px;">Who is in this photo?</p>
    <div class="photo-frame">${imgBlock}<h3 style="margin-top:10px;">${targetTitle}</h3></div>
    <div class="photo-recall-options">
      ${opts.map(o => `<button class="option-btn" onclick="checkRecallAnswer('${o.replace(/'/g, "\\'")}','${targetPerson.replace(/'/g, "\\'")}')">${o}</button>`).join("")}
    </div>`;
  speakText(`Who is this in the photograph? Is it ${opts[0]} or ${opts[1]}?`);
}

function checkRecallAnswer(selected, correct) {
  attemptsCount++;
  if (selected.toLowerCase().trim() === correct.toLowerCase().trim() || selected.toLowerCase().includes(correct.toLowerCase())) {
    speakText("Correct! Great memory.");
    completeGameSession();
  } else {
    speakText("Not quite. Try again.");
  }
}

// FEATURE 8 & 9: Routine Sequencing Fix + Drag/Drop + Move Up/Down Buttons
function startRoutineOrdering() {
  activeGameType = "routine_sequencing";
  gameStartTime = new Date();
  attemptsCount = 0;

  // Initialize shuffled items
  currentSequenceArray = [...correctMorningSequence].sort(() => 0.5 - Math.random());

  document.getElementById("games-selector").classList.add("hidden");
  document.getElementById("active-game-board").classList.remove("hidden");
  document.getElementById("active-game-title").innerText = "Routine Sequencing Game";
  
  renderRoutineSequenceBoard();
  speakText("Arrange your morning steps in the correct order. You can drag cards or use the Move Up and Move Down buttons.");
}

function renderRoutineSequenceBoard() {
  const pg = document.getElementById("game-playground");
  pg.innerHTML = `
    <p style="font-size:17px;margin-bottom:12px;">Arrange the steps from start to finish. Drag items or tap <strong>[ Move Up ↑ ]</strong> / <strong>[ Move Down ↓ ]</strong>.</p>
    <div class="order-list" id="sequencing-list-container"></div>
    <button class="check-order-btn" onclick="checkRoutineSequenceAnswer()">[ CHECK ANSWER ]</button>
  `;

  const listContainer = document.getElementById("sequencing-list-container");

  currentSequenceArray.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "order-item-card";
    card.setAttribute("draggable", "true");
    card.dataset.index = index;

    card.innerHTML = `
      <div class="order-item-main">
        <div class="order-num-badge">${index + 1}</div>
        <div class="order-item-text">${item.text}</div>
      </div>
      <div class="order-actions-mobile">
        <button class="order-btn-move" onclick="moveSequenceItem(${index}, -1)" ${index === 0 ? 'disabled' : ''} aria-label="Move Up">↑ Up</button>
        <button class="order-btn-move" onclick="moveSequenceItem(${index}, 1)" ${index === currentSequenceArray.length - 1 ? 'disabled' : ''} aria-label="Move Down">↓ Down</button>
      </div>
    `;

    // HTML5 Drag and Drop Handlers
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index);
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedIdx = parseInt(e.dataTransfer.getData("text/plain"));
      const targetIdx = index;
      if (draggedIdx !== targetIdx && !isNaN(draggedIdx)) {
        swapSequenceItems(draggedIdx, targetIdx);
      }
    });

    listContainer.appendChild(card);
  });
}

function moveSequenceItem(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= currentSequenceArray.length) return;
  swapSequenceItems(index, targetIndex);
}

function swapSequenceItems(fromIdx, toIdx) {
  const item = currentSequenceArray.splice(fromIdx, 1)[0];
  currentSequenceArray.splice(toIdx, 0, item);
  renderRoutineSequenceBoard();
}

function checkRoutineSequenceAnswer() {
  attemptsCount++;
  const elapsed = (new Date() - gameStartTime) / 1000;
  
  // Calculate accuracy by comparing item positions
  let correctMatches = 0;
  currentSequenceArray.forEach((item, idx) => {
    if (item.order === (idx + 1)) {
      correctMatches++;
    }
  });

  const accuracy = Math.round((correctMatches / correctMorningSequence.length) * 100);

  if (accuracy === 100) {
    speakText("Perfect! You arranged all routine steps correctly.");
    completeGameSession(accuracy, elapsed);
  } else {
    speakText(`You got ${correctMatches} out of ${correctMorningSequence.length} correct. Check the order and try again.`);
    alert(`Current Accuracy: ${accuracy}%. Please check the step numbers and arrange from 1 to ${correctMorningSequence.length}.`);
  }
}

function completeGameSession(calculatedAccuracy, calculatedElapsed) {
  const elapsed = calculatedElapsed || ((new Date() - gameStartTime) / 1000);
  let accuracy = calculatedAccuracy !== undefined ? calculatedAccuracy : 100;

  if (activeGameType === "memory_match") {
    accuracy = Math.min(100, Math.round((matchPairsCount / attemptsCount) * 100));
  } else if (activeGameType === "photo_recall") {
    accuracy = attemptsCount <= 1 ? 100 : Math.max(30, 100 - (attemptsCount - 1) * 25);
  }

  const score = Math.round(accuracy * 0.8 + Math.max(0, (30 - elapsed) / 30) * 20);

  // AI ADAPTIVE DIFFICULTY ADJUSTMENT
  const baseline = activeGameType === "memory_match" ? 15 : 12;
  const isHigh = accuracy > 85 && elapsed < baseline;
  const isStruggling = accuracy < 50 || attemptsCount >= 6;
  const oldDiff = currentDifficulty;
  if (isHigh) { if (currentDifficulty === "Easy") currentDifficulty = "Medium"; else if (currentDifficulty === "Medium") currentDifficulty = "Hard"; }
  else if (isStruggling) { if (currentDifficulty === "Hard") currentDifficulty = "Medium"; else if (currentDifficulty === "Medium") currentDifficulty = "Easy"; }

  // Log session to local state (isolated by active user id)
  const session = {
    id: Date.now(),
    user_id: ACTIVE_USER_ID,
    patient_id: ACTIVE_USER_ID,
    game_type: activeGameType,
    difficulty: oldDiff,
    score,
    accuracy,
    response_time_seconds: parseFloat(elapsed.toFixed(1)),
    response_time: parseFloat(elapsed.toFixed(1)),
    attempts: attemptsCount,
    completed_at: new Date().toISOString()
  };

  gameSessions.push(session);
  saveDB("mindner_game_sessions_v3", gameSessions);

  // Try POST to backend /api/games/session or /games/log
  fetch('/games/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: ACTIVE_USER_ID,
      patient_id: ACTIVE_USER_ID,
      game_type: activeGameType,
      difficulty: oldDiff,
      score,
      accuracy,
      response_time_seconds: parseFloat(elapsed.toFixed(1)),
      attempts: attemptsCount
    })
  }).catch(() => { /* Local fallback is active */ });

  speakText("Great job! Game completed.");
  document.getElementById("game-playground").innerHTML = `
    <div style="text-align:center;padding:20px;">
      <span style="font-size:64px;">🏆</span>
      <h3 style="font-size:26px;margin:14px 0;">Excellent Work!</h3>
      <p style="font-size:18px;color:var(--text-light);line-height:1.6;">
        Score: <strong>${score}</strong> | Accuracy: <strong>${accuracy}%</strong><br>
        Response Time: <strong>${elapsed.toFixed(1)}s</strong> | Attempts: <strong>${attemptsCount}</strong><br>
        Difficulty Tier: <strong>${oldDiff} → ${currentDifficulty}</strong>
      </p>
      <button class="check-order-btn" onclick="closeActiveGame()">Return to Games Menu</button>
    </div>`;

  updateProgressBars();
  updateCaregiverAnalytics();
}

// ========================================================
// MY PROGRESS (HISTORICAL TRENDS BY DAYS & STRICT CALCULATION)
// ========================================================
function groupSessionsByDay(sessions) {
  // Group user sessions by calendar date (YYYY-MM-DD or local date)
  const daysMap = {};

  sessions.forEach(s => {
    if (!s.completed_at) return;
    const dateObj = new Date(s.completed_at);
    // Format Month Day e.g. "Aug 30"
    const dayKey = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sortKey = dateObj.toISOString().slice(0, 10);

    if (!daysMap[sortKey]) {
      daysMap[sortKey] = {
        dateLabel: dayKey,
        sortKey: sortKey,
        accuracies: [],
        responseTimes: [],
        scores: [],
        count: 0
      };
    }
    daysMap[sortKey].accuracies.push(s.accuracy);
    daysMap[sortKey].responseTimes.push(s.response_time_seconds || s.response_time || 0);
    daysMap[sortKey].scores.push(s.score);
    daysMap[sortKey].count++;
  });

  // Convert map to sorted array of days
  const sortedDays = Object.keys(daysMap).sort().map(k => {
    const d = daysMap[k];
    const avgAccuracy = Math.round(d.accuracies.reduce((a, b) => a + b, 0) / d.accuracies.length);
    const avgSpeed = (d.responseTimes.reduce((a, b) => a + b, 0) / d.responseTimes.length).toFixed(1);
    const avgScore = Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length);
    return {
      dateLabel: d.dateLabel,
      sortKey: d.sortKey,
      accuracy: avgAccuracy,
      speed: parseFloat(avgSpeed),
      score: avgScore,
      sessionCount: d.count
    };
  });

  return sortedDays;
}

function updateProgressBars() {
  // Query game_sessions for active user ordered by completed_at ASC
  const userSessions = gameSessions.filter(s => s.user_id === ACTIVE_USER_ID)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

  const memSessions = userSessions.filter(s => s.game_type === "memory_match");
  const recallSessions = userSessions.filter(s => s.game_type === "photo_recall");
  const orderSessions = userSessions.filter(s => s.game_type === "routine_sequencing" || s.game_type === "routine_ordering");

  const avg = (arr, key) => arr.length ? arr.reduce((s, g) => s + (g[key] || 0), 0) / arr.length : 0;

  const memoryVal = memSessions.length ? Math.round(avg(memSessions, "accuracy")) : (userSessions.length ? Math.round(avg(userSessions, "accuracy")) : 0);
  const attentionVal = recallSessions.length ? Math.round(avg(recallSessions, "accuracy")) : (userSessions.length ? Math.round(avg(userSessions, "accuracy")) : 0);
  const patternVal = orderSessions.length ? Math.round(avg(orderSessions, "accuracy")) : (userSessions.length ? Math.round(avg(userSessions, "accuracy")) : 0);
  const reactionVal = userSessions.length ? Math.round(Math.max(10, Math.min(100, (15 - avg(userSessions, "response_time_seconds")) / 15 * 100))) : 0;

  setBar("memory", memoryVal);
  setBar("attention", attentionVal);
  setBar("pattern", patternVal);
  setBar("reaction", reactionVal);

  updateTrendChart(userSessions);
}

function setBar(name, val) {
  const fillEl = document.getElementById(`fill-${name}`);
  const valEl = document.getElementById(`prog-val-${name}`);
  if (fillEl) fillEl.style.width = val + "%";
  if (valEl) valEl.innerText = val + "%";
}

function updateTrendChart(userSessions) {
  const sessions = userSessions || gameSessions.filter(s => s.user_id === ACTIVE_USER_ID);
  const daysData = groupSessionsByDay(sessions);
  const recentDays = daysData.slice(-6); // Show up to last 6 distinct active days

  const line = document.getElementById("trend-line-points");
  const labelsContainer = document.getElementById("progress-chart-day-labels");
  const tableContainer = document.getElementById("progress-daily-table");

  if (!labelsContainer) return;

  if (recentDays.length === 0) {
    if (line) line.setAttribute("points", "");
    labelsContainer.innerHTML = `<span style="width:100%; text-align:center; color:var(--text-light); font-style:italic;">No activity recorded yet</span>`;
    if (tableContainer) tableContainer.innerHTML = `<p style="color:var(--text-light); text-align:center; padding:10px;">Play a cognitive game to view your historical daily trends.</p>`;
    return;
  }

  // Draw chart line
  if (line) {
    if (recentDays.length === 1) {
      const y = Math.max(20, Math.min(180, 180 - recentDays[0].accuracy * 1.6));
      line.setAttribute("points", `20,${y} 480,${y}`);
    } else {
      const xStep = 400 / (recentDays.length - 1);
      const points = recentDays.map((d, i) => `${20 + i * xStep},${Math.max(20, Math.min(180, 180 - d.accuracy * 1.6))}`).join(" ");
      line.setAttribute("points", points);
    }
  }

  // Render Day / Date X-Axis labels
  labelsContainer.innerHTML = recentDays.map(d => `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <span style="font-weight:bold; color:var(--text-dark);">${d.dateLabel}</span>
      <span style="font-size:13px; color:var(--accent-green); font-weight:700;">${d.accuracy}%</span>
    </div>
  `).join("");

  // Render Historical Trends Breakdown Table
  if (tableContainer) {
    tableContainer.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:15px; background:#FFF; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0;">
        <thead>
          <tr style="background:#F8FAFC; border-bottom:2px solid #E2E8F0; text-align:left;">
            <th style="padding:10px 14px;">Date (Day)</th>
            <th style="padding:10px 14px;">Daily Performance (Accuracy)</th>
            <th style="padding:10px 14px;">Game Sessions</th>
            <th style="padding:10px 14px;">Avg Speed</th>
          </tr>
        </thead>
        <tbody>
          ${recentDays.map(d => `
            <tr style="border-bottom:1px solid #F1F5F9;">
              <td style="padding:10px 14px; font-weight:bold;">${d.dateLabel}</td>
              <td style="padding:10px 14px; color:var(--primary-blue); font-weight:bold;">${d.accuracy}%</td>
              <td style="padding:10px 14px;">${d.sessionCount} game${d.sessionCount > 1 ? 's' : ''}</td>
              <td style="padding:10px 14px; color:var(--text-light);">${d.speed}s</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }
}

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

// ---- CAREGIVER ANALYTICS (DAYS-BASED DAILY PERFORMANCE) ----
function updateCaregiverAnalytics() {
  const userSessions = gameSessions.filter(s => s.user_id === ACTIVE_USER_ID);
  const daysData = groupSessionsByDay(userSessions);
  const recentDays = daysData.slice(-6);

  if (userSessions.length > 0) {
    const avgAcc = (userSessions.reduce((s, g) => s + g.accuracy, 0) / userSessions.length).toFixed(1);
    const avgSpd = (userSessions.reduce((s, g) => s + (g.response_time_seconds || g.response_time || 0), 0) / userSessions.length).toFixed(1);

    const accEl = document.getElementById("cg-accuracy-display");
    const spdEl = document.getElementById("cg-speed-display");
    if (accEl) accEl.innerText = avgAcc + "%";
    if (spdEl) spdEl.innerText = avgSpd + "s";
  }

  const line = document.getElementById("cg-trend-points");
  const labels = document.getElementById("cg-chart-day-labels");

  if (!labels) return;

  if (recentDays.length === 0) {
    if (line) line.setAttribute("points", "");
    labels.innerHTML = `<span style="width:100%; text-align:center; color:var(--text-light); font-style:italic;">No user game logs yet</span>`;
    return;
  }

  if (line) {
    if (recentDays.length === 1) {
      const y = Math.max(20, Math.min(180, 180 - recentDays[0].accuracy * 1.6));
      line.setAttribute("points", `20,${y} 480,${y}`);
    } else {
      const xStep = 400 / (recentDays.length - 1);
      const pts = recentDays.map((d, i) => `${20 + i * xStep},${Math.max(20, Math.min(180, 180 - d.accuracy * 1.6))}`).join(" ");
      line.setAttribute("points", pts);
    }
  }

  labels.innerHTML = recentDays.map(d => `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <span style="font-weight:bold; font-size:12px;">${d.dateLabel}</span>
      <span style="color:var(--primary-blue); font-weight:700;">${d.accuracy}%</span>
    </div>
  `).join("");
}

function switchCaregiverTab(tabId) {
  document.querySelectorAll(".tab-link").forEach(l => l.classList.remove("active"));
  document.querySelectorAll(".caregiver-tab-content").forEach(c => c.classList.remove("active-tab"));
  event.target.classList.add("active");
  document.getElementById(`caregiver-${tabId}`).classList.add("active-tab");

  if (tabId === "photo-recall-custom") {
    renderCustomPhotoRecallList();
  }
}

// ========================================================
// CAREGIVER CUSTOMIZE PHOTO RECALL (IMAGE + NAME + USER ID)
// ========================================================
let pendingPhotoRecallImageBase64 = null;

function previewPhotoRecallImage(e) {
  const file = e.target.files[0];
  const previewContainer = document.getElementById("pr-image-preview-container");
  const previewImg = document.getElementById("pr-image-preview");

  if (file) {
    // Validate image format: JPG, JPEG, PNG, WEBP
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert("Please upload a valid image file (JPG, JPEG, PNG, or WEBP).");
      e.target.value = "";
      previewContainer.style.display = "none";
      return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
      pendingPhotoRecallImageBase64 = evt.target.result;
      previewImg.src = evt.target.result;
      previewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    pendingPhotoRecallImageBase64 = null;
    previewContainer.style.display = "none";
  }
}

function handlePhotoRecallSubmit(e) {
  e.preventDefault();
  const name = (document.getElementById("pr-person-name").value || "").trim();
  const relationship = (document.getElementById("pr-relationship").value || "").trim();
  const desc = (document.getElementById("pr-description").value || "").trim();

  if (!name) {
    alert("Please enter the person's name.");
    return;
  }

  if (!pendingPhotoRecallImageBase64) {
    alert("Please select and import an image.");
    return;
  }

  const newItem = {
    id: Date.now(),
    user_id: ACTIVE_USER_ID,
    patient_id: ACTIVE_USER_ID,
    person_name: name,
    relationship: relationship || "Loved One",
    description: desc,
    image_path: pendingPhotoRecallImageBase64,
    image_url: pendingPhotoRecallImageBase64,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  customPhotoRecallItems.push(newItem);
  saveDB("mindner_custom_photo_recall", customPhotoRecallItems);

  // Sync with backend API
  fetch('/api/games/photo-recall/custom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: ACTIVE_USER_ID,
      patient_id: ACTIVE_USER_ID,
      person_name: name,
      relationship: relationship || "Loved One",
      description: desc,
      image_path: "custom_image_" + newItem.id,
      image_url: pendingPhotoRecallImageBase64
    })
  }).catch(() => { /* Local database fallback */ });

  // Reset form
  document.getElementById("photo-recall-form").reset();
  pendingPhotoRecallImageBase64 = null;
  document.getElementById("pr-image-preview-container").style.display = "none";

  renderCustomPhotoRecallList();
  alert(`"${name}" has been added to the Photo Recall cognitive game!`);
  speakText(`Photo of ${name} saved to Photo Recall game.`);
}

function renderCustomPhotoRecallList() {
  const container = document.getElementById("custom-photo-recall-list");
  if (!container) return;
  container.innerHTML = "";

  const userItems = customPhotoRecallItems.filter(item => item.user_id === ACTIVE_USER_ID);

  if (userItems.length === 0) {
    container.innerHTML = `<p style="padding:16px; color:var(--text-light); text-align:center; grid-column:1/-1;">No customized photos added yet. Add a loved one's photo on the left to customize the Photo Recall game.</p>`;
    return;
  }

  userItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "family-voice-card";
    card.style.margin = "0";

    card.innerHTML = `
      <img src="${item.image_url || item.image_path}" alt="${item.person_name}" style="width:100%; height:140px; object-fit:cover; background:#EDF2F7;">
      <div class="family-card-body" style="padding:12px;">
        <div>
          <div class="family-card-name" style="font-size:17px;">${item.person_name}</div>
          <div class="family-card-relation" style="font-size:13px; margin-bottom:6px;">${item.relationship || 'Custom Photo'}</div>
          ${item.description ? `<p style="font-size:12px; color:var(--text-light); margin-bottom:8px;">${item.description}</p>` : ''}
        </div>
        <button class="voice-action-btn btn-delete" onclick="deleteCustomPhotoRecallItem(${item.id})" style="width:100%; min-height:40px; font-size:13px;">🗑️ Remove from Game</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function deleteCustomPhotoRecallItem(id) {
  if (confirm("Remove this person's photo from the Photo Recall game?")) {
    customPhotoRecallItems = customPhotoRecallItems.filter(item => item.id !== id);
    saveDB("mindner_custom_photo_recall", customPhotoRecallItems);
    renderCustomPhotoRecallList();
    speakText("Photo removed from Photo Recall.");
  }
}

function handleRoutineSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("rot-title").value;
  const time = document.getElementById("rot-time").value;
  const desc = document.getElementById("rot-desc").value;
  routines.push({ id: Date.now(), user_id: ACTIVE_USER_ID, title, time, desc, completed: false });
  saveDB("mindner_routines_v3", routines);
  document.getElementById("routine-form").reset();
  alert("Routine schedule updated.");
}


