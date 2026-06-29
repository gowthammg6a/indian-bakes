// ============================================================
//  IBEE RESTO CAFE – Main JavaScript
// ============================================================

/* ---------- Branch Management ---------- */
const BRANCHES = {
  tiruchengode: { name: 'Tiruchengode', label: 'Tiruchengode Branch', coords: { lat: 11.3764, lng: 77.8964 } },
  sankagiri:    { name: 'Sankagiri',    label: 'Sankagiri Branch',    coords: { lat: 11.9833, lng: 78.1167 } },
  kootapalli:   { name: 'Kootapalli',   label: 'Kootapalli Branch',   coords: { lat: 11.5500, lng: 77.9500 } },
};

// Branch-specific menu availability (stock control)
const BRANCH_STOCK = {
  tiruchengode: { bread: true,  croissant: true,  cake: true,  burger: true,  fries: true,  momos: true,  juice: true,  pasta: true,  strips: true,  pannerfries: true, sticks: true },
  sankagiri:    { bread: true,  croissant: true,  cake: true,  burger: false, fries: true,  momos: true,  juice: true,  pasta: true,  strips: false, pannerfries: true, sticks: false },
  kootapalli:   { bread: true,  croissant: false, cake: true,  burger: true,  fries: true,  momos: false, juice: true,  pasta: true,  strips: true,  pannerfries: false, sticks: true },
};

function getCurrentBranch() {
  return localStorage.getItem('ibee_branch') || null;
}

function selectBranch(branchId) {
  localStorage.setItem('ibee_branch', branchId);
  const b = BRANCHES[branchId];

  // Update navbar indicator
  const navIndicator = document.getElementById('current-branch-nav');
  if (navIndicator) navIndicator.textContent = b.name;

  // Update hero text
  const heroBranch = document.getElementById('hero-branch-display');
  if (heroBranch) heroBranch.textContent = '📍 ' + b.label;

  // Update branch button styles
  Object.keys(BRANCHES).forEach(id => {
    const btn = document.getElementById('branch-' + id);
    if (btn) btn.classList.remove('selected');
  });
  const selectedBtn = document.getElementById('branch-' + branchId);
  if (selectedBtn) selectedBtn.classList.add('selected');

  // Hide overlay
  setTimeout(() => {
    const overlay = document.getElementById('branch-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => overlay.classList.remove('active'), 500);
    }
  }, 400);

  // Apply stock visibility on menu page
  applyBranchStock(branchId);
}

function changeBranch() {
  const overlay = document.getElementById('branch-overlay');
  if (overlay) {
    overlay.classList.add('active');
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
  }
}

function detectLocation() {
  const btn = document.getElementById('detect-location-btn');
  const status = document.getElementById('detect-status');
  if (!btn || !status) return;

  btn.disabled = true;
  btn.textContent = '⏳ Detecting...';
  status.textContent = 'Requesting location permission...';

  if (!navigator.geolocation) {
    status.textContent = '⚠️ Geolocation not supported. Please select manually.';
    btn.disabled = false;
    btn.innerHTML = '<span class="icon">📍</span> Auto Detect Location';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      const nearest = findNearestBranch(userLat, userLng);
      status.textContent = `✅ Nearest branch found: ${BRANCHES[nearest].name}`;
      status.style.color = '#27ae60';
      document.getElementById('branch-' + nearest)?.classList.add('selected');
      setTimeout(() => selectBranch(nearest), 1200);
    },
    (err) => {
      // Geolocation failed — try IP-based fallback
      status.textContent = '📡 Trying alternate detection...';
      tryIPLocation(btn, status);
    },
    {
      timeout: 8000,
      maximumAge: 60000,
      enableHighAccuracy: false
    }
  );
}

function tryIPLocation(btn, status) {
  // Use IP geolocation as fallback (free service)
  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(data => {
      if (data.latitude && data.longitude) {
        const nearest = findNearestBranch(data.latitude, data.longitude);
        status.textContent = `✅ Nearest branch: ${BRANCHES[nearest].name}`;
        status.style.color = '#27ae60';
        document.getElementById('branch-' + nearest)?.classList.add('selected');
        setTimeout(() => selectBranch(nearest), 1200);
      } else {
        showLocationError(btn, status);
      }
    })
    .catch(() => showLocationError(btn, status));
}

function showLocationError(btn, status) {
  status.textContent = '⚠️ Could not detect location. Please select your branch manually below.';
  status.style.color = '#e74c3c';
  btn.disabled = false;
  btn.innerHTML = '<span class="icon">📍</span> Try Again';
  // Highlight the branch buttons to guide user
  document.querySelectorAll('.branch-btn').forEach(b => {
    b.style.animation = 'pulse 1s ease 3';
  });
}

function findNearestBranch(lat, lng) {
  let nearest = null, minDist = Infinity;
  Object.entries(BRANCHES).forEach(([id, b]) => {
    const d = Math.sqrt(Math.pow(lat - b.coords.lat, 2) + Math.pow(lng - b.coords.lng, 2));
    if (d < minDist) { minDist = d; nearest = id; }
  });
  return nearest;
}


function applyBranchStock(branchId) {
  const stock = BRANCH_STOCK[branchId];
  if (!stock) return;
  const cards = document.querySelectorAll('[data-item]');
  cards.forEach(card => {
    const item = card.getAttribute('data-item');
    if (stock[item] === false) {
      card.classList.add('out-of-stock');
    } else {
      card.classList.remove('out-of-stock');
    }
  });

  // Update branch notice
  const noticeEl = document.getElementById('branch-notice-name');
  if (noticeEl && BRANCHES[branchId]) {
    noticeEl.textContent = BRANCHES[branchId].label;
  }
}

/* ---------- Navbar Scroll Effect ---------- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }
});

/* ---------- Mobile Menu ---------- */
function toggleMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  }
}

/* ---------- Menu Tab Filter ---------- */
function filterMenu(cat, btn) {
  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Show/hide cards
  document.querySelectorAll('.menu-card').forEach(card => {
    if (cat === 'all' || card.getAttribute('data-cat') === cat) {
      card.classList.remove('hidden');
      card.style.animation = 'fadeUp 0.4s ease both';
    } else {
      card.classList.add('hidden');
    }
  });
}

/* ---------- Hero Slider ---------- */
let currentSlide = 0;
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dotsContainer = document.getElementById('hero-dots');
  if (!slides.length) return;

  // Create dots
  if (dotsContainer) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.onclick = () => goToSlide(i);
      dotsContainer.appendChild(dot);
    });
  }

  // Add dot styles dynamically
  const style = document.createElement('style');
  style.textContent = `.hero-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.3);border:none;cursor:pointer;transition:all 0.3s;padding:0}.hero-dot.active{background:var(--gold);width:24px;border-radius:4px}`;
  document.head.appendChild(style);

  setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    goToSlide(currentSlide);
  }, 5000);
}

function goToSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  slides.forEach(s => s.classList.remove('active'));
  dots.forEach(d => d.classList.remove('active'));
  if (slides[index]) slides[index].classList.add('active');
  if (dots[index]) dots[index].classList.add('active');
  currentSlide = index;
}

/* ---------- Scroll Animations ---------- */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeUp 0.6s ease both';
        entry.target.style.opacity = '1';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.menu-card, .review-card, .contact-card, .branch-detail-card, .stat-card').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

/* ---------- Init on Page Load ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Check saved branch
  const saved = getCurrentBranch();
  if (saved) {
    selectBranch(saved);
  }

  initHeroSlider();
  initScrollAnimations();
  injectWhatsAppButton();

  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) link.classList.add('active');
    else if (currentPage === '' && href === 'index.html') link.classList.add('active');
  });
});
/* ---------- Floating WhatsApp Button ---------- */
function injectWhatsAppButton() {
  const branch = getCurrentBranch();
  const phones = { tiruchengode:'918438183898', sankagiri:'918489983898', kootapalli:'918438183898' };
  const waNumber = phones[branch] || '918438183898';
  const msg = encodeURIComponent('Hi! I want to know more about Ibee Resto Cafe.');
  const style = document.createElement('style');
  style.textContent = `.wa-float{position:fixed;bottom:24px;right:24px;z-index:8000;width:58px;height:58px;border-radius:50%;background:#25D366;box-shadow:0 6px 20px rgba(37,211,102,.45);display:flex;align-items:center;justify-content:center;cursor:pointer;text-decoration:none;animation:waIn .5s ease 2s both;transition:transform .25s,box-shadow .25s}.wa-float:hover{transform:scale(1.12);box-shadow:0 10px 30px rgba(37,211,102,.6)}.wa-float svg{width:30px;height:30px;fill:white}.wa-ring{position:fixed;bottom:18px;right:18px;z-index:7999;width:70px;height:70px;border-radius:50%;border:3px solid rgba(37,211,102,.5);animation:waPulse 2s ease-out 2.5s infinite;pointer-events:none}.wa-tip{position:fixed;bottom:34px;right:90px;z-index:8001;background:#1a1008;color:#FDF6EC;border-radius:10px;padding:8px 14px;font-size:.8rem;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.4);border:1px solid rgba(37,211,102,.3);transition:opacity .2s}.wa-float:hover~.wa-tip{opacity:1}@keyframes waPulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.6);opacity:0}}@keyframes waIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}@media(max-width:768px){.wa-float{width:50px;height:50px;bottom:76px;right:16px}.wa-ring{bottom:70px;right:10px;width:62px;height:62px}.wa-tip{display:none}}`;
  document.head.appendChild(style);
  const btn = document.createElement('a');
  btn.href='https://wa.me/'+waNumber+'?text='+msg;
  btn.target='_blank';btn.rel='noopener';btn.className='wa-float';
  btn.setAttribute('aria-label','Chat on WhatsApp');
  btn.innerHTML='<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  document.body.appendChild(btn);
  const ring=document.createElement('div');ring.className='wa-ring';document.body.appendChild(ring);
  const tip=document.createElement('div');tip.className='wa-tip';tip.textContent='Chat with us!';document.body.appendChild(tip);
}

/* ---------- Browser Push Notifications ---------- */
function requestNotificationPermission(){if('Notification'in window&&Notification.permission==='default')Notification.requestPermission();}
function sendBrowserNotification(title,body){if('Notification'in window&&Notification.permission==='granted')new Notification(title,{body:body,icon:'images/logo.jpg',requireInteraction:true});}