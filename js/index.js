// pageName can load config from windows file system without query string
const pageName = (() => { let p = location.pathname.split('/').pop(); return p ? p.replace(/\.[^/.]+$/, '') : 'index'; })();
  
// Config loaded dynamically based on query string
// Load config without fetch (works from file://)
const params = new URLSearchParams(window.location.search);
const configName = params.get('cfg') || pageName;
const debug = params.has('debug');

const book = document.getElementById('book');
const audio = document.getElementById('ambientAudio');
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn');
const resetBtn = document.getElementById('resetBtn');
const autoBtn = document.getElementById('autoBtn');
const autoTime = document.getElementById('autoTime');
const muteBtn = document.getElementById('muteBtn');
const openControls = document.getElementById('openControls');
const navControls = document.getElementById('navControls');
const errorPage = document.getElementById('errorPage');

let page = 0;
let pages = 4;
let autoTimer = null;

function loadConfig(name) {
  const script = document.createElement('script');
  script.src = `js/${name}.config.js`;
  script.onload = () => {
    if (window.CARD_CONFIG) {
      initCard(window.CARD_CONFIG);
      if (debug) showDebug(`Loaded config: ${name}.config.js`);
    } else {
      fallback(`Config loaded but CARD_CONFIG missing`);
    }
  };
  script.onerror = () => fallback(`Failed to load ${name}.config.js`);
  document.head.appendChild(script);
}

function fallback(reason) {
  if (debug) showDebug(`Fallback activated: ${reason}`);
  errorPage.style.opacity = '1';
  errorPage.style.visibility = 'visible';
  openControls.style.display = 'none';
  book.className = 'book';
}

function showDebug(msg) {
  let box = document.getElementById('debugBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'debugBox';
    box.style.position = 'fixed';
    box.style.bottom = '10px';
    box.style.left = '10px';
    box.style.padding = '8px 12px';
    box.style.background = 'rgba(0,0,0,0.7)';
    box.style.color = '#0f0';
    box.style.fontSize = '12px';
    box.style.borderRadius = '6px';
    box.style.zIndex = '9999';
    document.body.appendChild(box);
  }
  box.textContent = msg;
}

function initCard(config) {
  // set scene orientation, default to landscape(horizontal)
  const scene = document.getElementById('scene');
  scene.className = `scene ${config.orientation || 'landscape'}`;

  // pages
  pages = config.images.length;

  book.innerHTML = '';

  for (let i = 0; i < pages; i++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = `page page-${i}`;
    pageDiv.style.zIndex = pages- i;
        
    const img = document.createElement('img');
    img.src = config.images[i];
        
    pageDiv.appendChild(img);
    book.appendChild(pageDiv);
    openControls.style.display = 'flex';
  }

  // audio
  audio.src = config.audio;
  audio.muted = false;
}

function updateState() {
  const allPages = document.querySelectorAll('.page');
  allPages.forEach((p, idx) => {
    p.style.opacity = (idx === page) ? '1' : '0';
    p.style.visibility = (idx === page) ? 'visible' : 'hidden';
  });

  prevBtn.style.visibility = page === 0 ? 'hidden' : 'visible';
  nextBtn.style.visibility = page === 0 ? 'hidden' : 'visible';
  resetBtn.style.visibility = page === 0 ? 'hidden' : 'visible';
  autoBtn.style.display = page === pages - 1 ? 'none' : 'inline';
  autoTime.style.display = page === pages - 1 ? 'none' : 'inline';
}

function openCard() {
  openControls.style.display = 'none';
  navControls.style.display = 'flex';
  audio.muted = false;
  audio.loop = true;
  audio.volume = 0.35;
  audio.play().catch(() => {});
  if (page < pages - 1) page++;
  updateState();
}

function prevPage() {
  if (page === 1) {
    resetCard();
  } else if (page > 1) {
    page--;
    updateState();

    if (autoTimer) {
      stopAuto();
      toggleAuto();
    }
  }
}

function nextPage() {
  if (page < pages - 1) {
    page++;
    updateState();

    if (autoTimer) {
      stopAuto();
      toggleAuto();
    }
  }
}

function resetCard() {
  stopAuto();
  page = 0;
  openControls.style.display = 'flex';
  navControls.style.display = 'none';
  audio.pause();
  audio.currentTime = 0;
  updateState();
}

function toggleAuto() {
  const interval = parseInt(document.getElementById('autoTime').value);

  if (autoTimer) {
    stopAuto();
  } else {
    autoBtn.textContent = 'Stop';
    autoBtn.style.background = '#ff4444';
    autoBtn.style.color = '#fff';

    autoTimer = setInterval(() => {
      if (page < pages - 1) {
        nextPage();
      } else {
        stopAuto(); // Stop once we hit the last page
      }
    }, interval);
  }
}

function stopAuto() {
  clearInterval(autoTimer);
  autoTimer = null;
  autoBtn.textContent = 'Auto';
  autoBtn.style.background = 'rgba(255,255,255,0.85)';
  autoBtn.style.color = '#111';
}

function updateAutoInterval() {
  if (autoTimer) {
    stopAuto();
    toggleAuto();
  }
}

function muteAudio() {
  audio.muted = !audio.muted;  // toggle mute
  muteBtn.textContent = audio.muted ? 'Unmute' : 'Mute';
}

function shareLink() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: document.title, url });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard');
    });
  }
}

loadConfig(configName);