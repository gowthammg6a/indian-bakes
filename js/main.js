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
      document.getElementById('branch-' + nearest)?.classList.add('selected');
      setTimeout(() => selectBranch(nearest), 1200);
    },
    () => {
      status.textContent = '⚠️ Location denied. Please select your branch manually.';
      btn.disabled = false;
      btn.innerHTML = '<span class="icon">📍</span> Auto Detect Location';
    }
  );
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

  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) link.classList.add('active');
    else if (currentPage === '' && href === 'index.html') link.classList.add('active');
  });
});
