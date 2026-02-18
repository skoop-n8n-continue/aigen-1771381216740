// ====================================================
// CONFIGURATION
// ====================================================
const PRODUCTS_PER_CYCLE = 1; // Single hero focus

let PRODUCTS = [];

// ====================================================
// INITIALIZATION
// ====================================================
async function loadProducts() {
  try {
    const response = await fetch('./products.json?v=' + Date.now());
    const data = await response.json();
    PRODUCTS = data.products || [];
  } catch (error) {
    console.error('Failed to load products.json:', error);
    // Fallback logic could go here
  }
  
  if (PRODUCTS.length > 0) {
    startCycle();
  }
}

function createDustParticles() {
  const container = document.querySelector('.dust-particles');
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    container.appendChild(p);
    
    // Random initial position
    gsap.set(p, {
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      scale: Math.random() * 0.5 + 0.5,
      opacity: Math.random() * 0.3 + 0.1
    });
    
    // Float animation
    gsap.to(p, {
      duration: Math.random() * 10 + 10,
      y: '-=100',
      x: '+=' + (Math.random() * 50 - 25),
      rotation: Math.random() * 360,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }
}

function startCycle() {
  animateCycle(0);
}

function getBatch(batchIndex) {
  const start = (batchIndex * PRODUCTS_PER_CYCLE) % Math.max(PRODUCTS.length, 1);
  const batch = [];
  for (let i = 0; i < PRODUCTS_PER_CYCLE; i++) {
    if (PRODUCTS.length > 0) {
      batch.push(PRODUCTS[(start + i) % PRODUCTS.length]);
    }
  }
  return batch;
}

// ====================================================
// RENDER LOGIC
// ====================================================
function createProductSlide(product, index) {
  const slide = document.createElement('div');
  slide.className = 'product-slide';
  slide.id = `slide-${index}`;
  
  // Parse meta tags if pipe-separated
  const metaTags = product.meta ? product.meta.split('|').map(s => s.trim()) : [];
  const metaHtml = metaTags.map(tag => `<span>${tag}</span>`).join('<div class="separator"></div>');

  slide.innerHTML = `
    <div class="car-container">
      <div class="car-image-wrapper">
        <img class="car-image" src="${product.image_url}" alt="${product.name}">
        <img class="car-reflection" src="${product.image_url}" alt="">
        <div class="light-sweep-overlay"></div>
      </div>
    </div>
    
    <div class="info-container">
      <h2 class="product-name">${product.name}</h2>
      <div class="product-meta-row">
        <div class="product-price">${product.price}</div>
        <div class="separator"></div>
        ${metaHtml}
      </div>
    </div>
  `;
  
  return slide;
}

// ====================================================
// ANIMATION CHOREOGRAPHY
// ====================================================
function animateCycle(batchIndex) {
  const container = document.getElementById('products-container');
  // Clear container for performance, though strictly we could swap
  container.innerHTML = '';
  
  const batch = getBatch(batchIndex);
  const product = batch[0]; // Since we're doing 1 per cycle
  
  const slide = createProductSlide(product, batchIndex);
  container.appendChild(slide);
  
  // Ensure visible for GSAP to grab
  gsap.set(slide, { autoAlpha: 1 });
  
  // Elements
  const carImage = slide.querySelector('.car-image');
  const reflection = slide.querySelector('.car-reflection');
  const lightSweep = slide.querySelector('.light-sweep-overlay');
  const title = slide.querySelector('.product-name');
  const metaRow = slide.querySelector('.product-meta-row');
  const spotlight = document.querySelector('.spotlight-beam');
  
  // Split text for title
  const splitTitle = new SplitText(title, { type: "chars" });
  
  // Master Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      // Cleanup SplitText
      splitTitle.revert();
      // Next cycle
      animateCycle(batchIndex + 1);
    }
  });

  // --------------------------------------------------
  // SEQUENCE
  // --------------------------------------------------
  
  // 1. SETUP
  tl.set(carImage, { x: 100, opacity: 0, scale: 0.95 });
  tl.set(reflection, { x: 100, opacity: 0, scale: 0.95 });
  tl.set(splitTitle.chars, { y: 100, opacity: 0 });
  tl.set(spotlight, { opacity: 0, rotation: 15 });
  
  // 2. ENTRANCE (2.5s)
  tl.addLabel('entrance');
  
  // Spotlight turns on
  tl.to(spotlight, { 
    duration: 2, 
    opacity: 0.8, 
    rotation: 0, 
    ease: "power2.out" 
  }, 'entrance');
  
  // Car slides in from darkness
  tl.to([carImage, reflection], {
    duration: 2.5,
    x: 0,
    opacity: 1,
    scale: 1,
    ease: "power3.out"
  }, 'entrance+=0.2');
  
  // Light sweep across the car (The "Reveal")
  tl.fromTo(lightSweep, 
    { x: '-100%' },
    { x: '100%', duration: 1.5, ease: "power2.inOut" },
    'entrance+=0.8'
  );
  
  // Title Characters stagger up
  tl.to(splitTitle.chars, {
    duration: 1,
    y: 0,
    opacity: 1,
    stagger: 0.05,
    ease: "back.out(1.7)"
  }, 'entrance+=1');
  
  // Meta row fades in
  tl.to(metaRow, {
    duration: 1,
    opacity: 1,
    y: 0,
    ease: "power2.out"
  }, 'entrance+=1.5');
  
  // 3. IDLE / LIVING MOMENT (5s)
  tl.addLabel('idle');
  
  // Subtle car breathe
  tl.to([carImage, reflection], {
    duration: 4,
    scale: 1.02,
    ease: "sine.inOut",
    yoyo: true,
    repeat: 1
  }, 'idle');
  
  // 4. EXIT (1.5s)
  tl.addLabel('exit');
  
  // Car accelerates out (or fades back depending on vibe) - Let's do accelerate out
  tl.to([carImage, reflection], {
    duration: 1.2,
    x: -200, // Move left
    opacity: 0,
    scale: 1.05, // Slight zoom as it leaves
    ease: "power2.in"
  }, 'exit');
  
  // Text falls away
  tl.to([splitTitle.chars, metaRow], {
    duration: 0.8,
    y: -50,
    opacity: 0,
    stagger: 0.02,
    ease: "power2.in"
  }, 'exit');
  
  // Spotlight fades
  tl.to(spotlight, {
    duration: 1,
    opacity: 0
  }, 'exit+=0.5');

}

// Start
window.addEventListener('DOMContentLoaded', () => {
  createDustParticles();
  loadProducts();
});
