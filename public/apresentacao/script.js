const header = document.querySelector('.site-header');
const revealEls = document.querySelectorAll('.reveal');


window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.13, rootMargin: '0px 0px -30px 0px' });

revealEls.forEach((el) => observer.observe(el));

// Mapa de ritmo: determinístico para manter o visual consistente.
const heatmap = document.querySelector('.heatmap');
for (let i = 0; i < 168; i++) {
  const cell = document.createElement('i');
  const value = (i * 37 + Math.floor(i / 7) * 19 + 11) % 100;
  if (value > 84) cell.className = 'l4';
  else if (value > 65) cell.className = 'l3';
  else if (value > 44) cell.className = 'l2';
  else if (value > 26) cell.className = 'l1';
  heatmap.appendChild(cell);
}

// Micro-demo da Kira.
const responseBubble = document.getElementById('responseBubble');
document.querySelectorAll('[data-reply]').forEach((button) => {
  button.addEventListener('click', () => {
    responseBubble.hidden = false;
    responseBubble.textContent = button.dataset.reply;
    document.querySelectorAll('[data-reply]').forEach((b) => b.style.opacity = b === button ? '1' : '.42');
  });
});

// Demo do Modo Caverna — curta, propositalmente visual.
const focusButton = document.getElementById('focusButton');
const focusTime = document.getElementById('focusTime');
const ring = document.querySelector('.ring-progress');
let focusInterval = null;
let remaining = 25 * 60;
let running = false;

function renderFocus() {
  const min = String(Math.floor(remaining / 60)).padStart(2, '0');
  const sec = String(remaining % 60).padStart(2, '0');
  focusTime.textContent = `${min}:${sec}`;
  const progress = 1 - (remaining / (25 * 60));
  ring.style.strokeDashoffset = String(540 - (progress * 540));
}

focusButton.addEventListener('click', () => {
  if (!running) {
    running = true;
    focusButton.textContent = 'Ⅱ Pausar';
    focusInterval = setInterval(() => {
      remaining = Math.max(0, remaining - 15); // acelera a demonstração
      renderFocus();
      if (remaining === 0) {
        clearInterval(focusInterval);
        running = false;
        focusButton.textContent = '↻ Reiniciar';
      }
    }, 1000);
  } else {
    clearInterval(focusInterval);
    running = false;
    focusButton.textContent = '▶ Continuar';
  }
});

// Se terminou, próximo clique reinicia.
focusButton.addEventListener('click', () => {
  if (remaining === 0) {
    clearInterval(focusInterval);
    remaining = 25 * 60;
    running = false;
    renderFocus();
    focusButton.textContent = '▶ Iniciar demonstração';
  }
});

// Alternância de preços baseada no próprio app enviado.
const planButtons = document.querySelectorAll('[data-plan]');
const priceValue = document.getElementById('priceValue');
const priceSub = document.getElementById('priceSub');
const priceBadge = document.getElementById('priceBadge');
planButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    planButtons.forEach((b) => b.classList.toggle('active', b === btn));
    if (btn.dataset.plan === 'monthly') {
      priceValue.textContent = '18,99';
      priceSub.textContent = 'cobrado mensalmente · cancele quando quiser';
      priceBadge.textContent = 'FLEXÍVEL';
    } else {
      priceValue.textContent = '15,82';
      priceSub.textContent = 'cobrado R$ 189,90 por ano';
      priceBadge.textContent = 'PLANO ANUAL';
    }
  });
});

// =========================================================
// Motion refinements
// =========================================================
const finePointer = window.matchMedia('(pointer:fine)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (finePointer && !reduceMotion) {
  const heroProduct = document.querySelector('.hero-product');
  const heroPhone = document.querySelector('.phone-main');
  if (heroProduct && heroPhone) {
    heroProduct.addEventListener('pointermove', (e) => {
      const r = heroProduct.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      heroPhone.style.transform = `rotate(2.2deg) rotateY(${x * 8}deg) rotateX(${-y * 7}deg) translate3d(${x * 6}px,${y * 5}px,0)`;
    });
    heroProduct.addEventListener('pointerleave', () => {
      heroPhone.style.transform = 'rotate(2.2deg)';
    });
  }
}

// =========================================================
// Interactive app showroom
// =========================================================
const demoTabs = [...document.querySelectorAll('[data-demo-target]')];
const demoBottom = [...document.querySelectorAll('[data-bottom-target]')];
const demoViews = [...document.querySelectorAll('[data-demo-view]')];
const demoPhone = document.getElementById('demoPhone');
const demoWrap = document.getElementById('demoDeviceWrap');
let currentDemo = 'dashboard';
let currentDemoIndex = 0;

function switchDemo(target) {
  const nextIndex = demoViews.findIndex(v => v.dataset.demoView === target);
  if (nextIndex < 0 || target === currentDemo) return;
  const directionBack = nextIndex < currentDemoIndex;
  demoViews.forEach((view) => {
    view.classList.toggle('enter-back', directionBack && view.dataset.demoView === target);
    view.classList.toggle('active', view.dataset.demoView === target);
  });
  requestAnimationFrame(() => demoViews.forEach(v => v.classList.remove('enter-back')));
  const parent = target === 'postits' ? 'enem' : target;
  demoTabs.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.demoTarget === parent);
    btn.setAttribute('aria-pressed', String(btn.dataset.demoTarget === parent));
  });
  demoBottom.forEach(btn => btn.classList.toggle('active', btn.dataset.bottomTarget === (parent === 'settings' ? 'progress' : parent)));
  currentDemo = target;
  currentDemoIndex = nextIndex;
}

demoTabs.forEach(btn => btn.addEventListener('click', () => switchDemo(btn.dataset.demoTarget)));
document.querySelectorAll('[data-show-demo]').forEach(btn => btn.addEventListener('click', () => switchDemo(btn.dataset.showDemo)));
demoBottom.forEach(btn => btn.addEventListener('click', () => switchDemo(btn.dataset.bottomTarget)));

if (finePointer && !reduceMotion && demoWrap && demoPhone) {
  demoWrap.addEventListener('pointermove', (e) => {
    const r = demoWrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    demoPhone.style.transform = `rotateY(${-5 + x * 7}deg) rotateX(${2 - y * 6}deg) translate3d(${x * 5}px,${y * 5}px,0)`;
  });
  demoWrap.addEventListener('pointerleave', () => demoPhone.style.transform = 'rotateY(-5deg) rotateX(2deg)');
}

// Kira mini demo
const kiraDynamic = document.getElementById('kiraDynamic');
const kiraQuickActions = document.getElementById('kiraQuickActions');
let kiraTimer;
function showTyping(callback){
  clearTimeout(kiraTimer);
  kiraDynamic.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>';
  kiraTimer = setTimeout(callback, 650);
}
function bindQuizAnswers(){
  kiraDynamic.querySelectorAll('[data-quiz-answer]').forEach(btn => btn.addEventListener('click', () => {
    kiraDynamic.querySelectorAll('[data-quiz-answer]').forEach(b => b.disabled = true);
    const correct = btn.dataset.quizAnswer === 'correct';
    btn.classList.add(correct ? 'correct' : 'wrong');
    const feedback = document.createElement('div');
    feedback.className = 'mini-bubble bot';
    feedback.style.marginTop = '7px';
    feedback.innerHTML = correct ? '<b>Exato.</b> Oxidação = perda de elétrons.' : '<b>Quase.</b> Oxidação é perda de elétrons. Tenta lembrar: OIL RIG.';
    kiraDynamic.appendChild(feedback);
  }));
}
document.querySelectorAll('[data-kira-demo]').forEach(btn => btn.addEventListener('click', () => {
  kiraQuickActions.style.opacity = '.35';
  if (btn.dataset.kiraDemo === 'quiz') {
    showTyping(() => {
      kiraDynamic.innerHTML = '<div class="mini-bubble user">Me faça um quiz.</div><div class="quiz-card"><small>QUIZ · QUÍMICA</small><strong>Em uma reação de oxirredução, quem oxida...</strong><div class="quiz-options"><button data-quiz-answer="correct">perde elétrons</button><button data-quiz-answer="wrong">ganha elétrons</button><button data-quiz-answer="wrong">mantém o NOX</button></div></div>';
      bindQuizAnswers();
    });
  } else {
    showTyping(() => {
      kiraDynamic.innerHTML = '<div class="mini-bubble user">Explica em 20s.</div><div class="mini-bubble bot"><b>Oxidação</b> é perda de elétrons e aumento do NOX. <b>Redução</b> é ganho de elétrons e diminuição do NOX. Atalho: <b>OIL RIG</b>.</div>';
    });
  }
}));

// Post-it demo
const addPostit = document.getElementById('addPostit');
const postitBoard = document.getElementById('postitBoard');
let postitAdded = false;
if (addPostit && postitBoard) addPostit.addEventListener('click', () => {
  if (postitAdded) {
    const existing = postitBoard.querySelector('.new-post');
    existing?.remove();
    postitAdded = false;
    return;
  }
  const note = document.createElement('button');
  note.className = 'mini-post p-purple new-post';
  note.innerHTML = '<small>REVISÃO</small><b>Química</b><span>20:30 · revisão</span>';
  postitBoard.insertBefore(note, postitBoard.querySelector('.postit-hint'));
  postitAdded = true;
});

const landingKira = document.querySelector('.landing-kira');
if (landingKira && !reduceMotion) {
  const kiraVisibility = new IntersectionObserver(([entry]) => landingKira.classList.toggle('is-visible', entry.isIntersecting));
  kiraVisibility.observe(landingKira);
}
