// pageName can load config from windows file system without query string
const pageName = (() => { let p = location.pathname.split('/').pop(); return p ? p.replace(/\.[^/.]+$/, '') : 'index'; })();
const book = document.getElementById('book');
const audio = document.getElementById('ambientAudio');
  
let page = 0;
  
// Config loaded dynamically based on query string
// Load config without fetch (works from file://)
const params = new URLSearchParams(window.location.search);
const configName = params.get('cfg') || pageName;
const debug = params.has('debug');

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
  document.getElementById('errorPage').style.opacity = '1';
  document.getElementById('errorPage').style.visibility = 'visible';
  document.getElementById('openControls').style.display = 'none';
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

loadConfig(configName);

function initCard(config) {
  // set scene orientation, default to landscape(horizontal)
  const scene = document.getElementById('scene');
  const orient = (config.orientation || 'landscape').toLowerCase();

  scene.classList.remove('portrait', 'landscape'); //remove default value
  scene.classList.add(orient === 'portrait' ? 'portrait' : 'landscape');

  // assign images
  document.getElementById('imgFront').src = config.images.front;
  document.getElementById('imgInsideTop').src = config.images.insideTop;
  document.getElementById('imgInsideBottom').src = config.images.insideBottom;
  document.getElementById('imgBack').src = config.images.back;

  // preload images
  Object.values(config.images).forEach(src => {
    const img = new Image();
    img.src = src;
    img.alt = 'Image source is unavailable. Please use Cntrl+F5 to refresh the page and try again.';
  });

  // audio
  audio.src = config.audio;
  audio.muted = false;
}

function updateState() {
  book.className = 'book';
  if (page === 0) book.classList.add('show-front');
  if (page === 1) book.classList.add('show-inside-top');
  if (page === 2) book.classList.add('show-inside-bot');
  if (page === 3) book.classList.add('show-back');

  prevBtn.style.visibility = page === 0 ? 'hidden' : 'visible';
  nextBtn.style.display = page === 3 ? 'none' : 'inline';
  resetBtn.style.display = page === 3 ? 'inline' : 'none';
}

function openCard() {
  openControls.style.display = 'none';
  navControls.style.display = 'flex';
  audio.muted = false;
  audio.volume = 0.35;
  audio.play().catch(() => {});
  updateState();
}

function nextPage() {
  if (page < 3) page++;
  updateState();
}

function prevPage() {
  if (page > 0) page--;
  updateState();
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

function resetCard() {
  page = 0;
  updateState();
}
