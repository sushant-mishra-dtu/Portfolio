document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    initPreloader();
    initCursor();
    initAudio();
    initSplitText();
    initNav();
    initHeroAnimations();
    initProjectsTrackSelector();
    initMatrixAnimations();
    initContact();
});

// --- AUDIO CONTEXT ---
let audioCtx;
function playClickSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'square'; // More "electronic" sound
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function initAudio() {
    const hoverTargets = document.querySelectorAll('.hover-target, a, button');
    hoverTargets.forEach(target => {
        target.addEventListener('mouseenter', () => {
            if (audioCtx && audioCtx.state === 'running') {
                playClickSound();
            }
        });
    });
    
    document.body.addEventListener('click', () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }, { once: true });
}

// --- PRELOADER ---
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    
    setTimeout(() => {
        gsap.to(preloader, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => preloader.style.display = 'none'
        });
    }, 1500);
}

// --- CUSTOM CURSOR ---
function initCursor() {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    gsap.set(cursor, { x: mouseX, y: mouseY });

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    gsap.ticker.add(() => {
        gsap.to(cursor, {
            x: mouseX,
            y: mouseY,
            duration: 0.1,
            ease: "power2.out"
        });
    });

    const hoverTargets = document.querySelectorAll('.hover-target, a, button, input, textarea');
    hoverTargets.forEach(target => {
        target.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        target.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
}

// --- SPLIT TEXT ---
function initSplitText() {
    const splitTargets = document.querySelectorAll('.split-target');
    
    splitTargets.forEach(target => {
        const text = new SplitType(target, { types: 'chars, words' });
        
        gsap.set(text.chars, { y: 20, opacity: 0 });
        
        ScrollTrigger.create({
            trigger: target,
            start: 'top 90%',
            onEnter: () => {
                gsap.to(text.chars, {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.02,
                    ease: "back.out(1.5)"
                });
            },
            once: true
        });
    });
}

// --- NAVIGATION ---
function initNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const navOverlay = document.querySelector('.nav-overlay');
    const links = document.querySelectorAll('.overlay-link');
    const scrollProgress = document.querySelector('.scroll-progress');

    let isOpen = false;

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            isOpen = !isOpen;
            navToggle.classList.toggle('active');
            
            if (isOpen) {
                navOverlay.classList.add('open');
                gsap.fromTo(links, 
                    { y: '100%' }, 
                    { y: '0%', duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
                );
            } else {
                navOverlay.classList.remove('open');
            }
        });
    }

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            isOpen = false;
            if(navToggle) navToggle.classList.remove('active');
            if(navOverlay) navOverlay.classList.remove('open');
            
            // Smooth scroll manually to avoid instant jump
            const targetId = link.getAttribute('href');
            if(targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetEl = document.querySelector(targetId);
                if(targetEl) {
                    window.scrollTo({
                        top: targetEl.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrolled / maxScroll;
        if(scrollProgress) gsap.to(scrollProgress, { scaleX: progress, duration: 0.1 });
    });
}

// --- HERO ANIMATIONS ---
function initHeroAnimations() {
    setTimeout(() => {
        const tl = gsap.timeline();
        tl.from('.hero-line', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' })
          .from('.hero-desc', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
          .from('.hero-cta', { opacity: 0, duration: 0.6 }, '-=0.3')
          .from('.hardware-panel', { x: 50, opacity: 0, duration: 0.8, ease: 'back.out(1.2)' }, '-=0.6');
    }, 1500);

    gsap.to('.scrub-text', {
        backgroundSize: '0% 100%',
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero-split',
            start: 'top top',
            end: 'bottom center',
            scrub: true
        }
    });
}

// --- PROJECTS TRACK SELECTOR ---
function initProjectsTrackSelector() {
    const btns = document.querySelectorAll('.track-btn');
    const tracks = document.querySelectorAll('.project-track');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            btns.forEach(b => b.classList.remove('active'));
            tracks.forEach(t => t.classList.remove('active'));

            // Add active to clicked
            btn.classList.add('active');
            const targetTrackId = btn.getAttribute('data-track');
            document.getElementById(targetTrackId).classList.add('active');
            
            if (audioCtx && audioCtx.state === 'running') playClickSound();
        });
    });

    // Fade in project cards on scroll
    gsap.utils.toArray('.project-card').forEach(card => {
        gsap.from(card, {
            y: 50,
            opacity: 0,
            duration: 0.6,
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });
}

// --- MATRIX ANIMATIONS ---
function initMatrixAnimations() {
    gsap.utils.toArray('.matrix-card').forEach((card, i) => {
        gsap.from(card, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none none'
            }
        });
    });
}

// --- CONTACT FORM ---
function initContact() {
    const form = document.querySelector('.terminal-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('.submit-btn-minimal');
            const originalText = btn.innerHTML;
            btn.innerHTML = '[ PAYLOAD TRANSMITTED ]';
            btn.style.color = 'var(--accent-cyan)';
            btn.style.borderColor = 'var(--accent-cyan)';
            
            setTimeout(() => {
                form.reset();
                btn.innerHTML = originalText;
            }, 3000);
        });
    }

    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}