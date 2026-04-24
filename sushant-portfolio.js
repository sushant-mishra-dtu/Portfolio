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
let lastSubmitTime = 0;
const SUBMIT_COOLDOWN_MS = 60000; // 60 second cooldown between submissions

function showFormStatus(msg, type) {
    const statusEl = document.getElementById('form-status');
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'form-status-msg';
    if (type === 'error') statusEl.classList.add('status-error');
    else if (type === 'success') statusEl.classList.add('status-success');
    else statusEl.classList.add('status-warning');
    
    // Auto-clear after 5 seconds
    setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'form-status-msg';
    }, 5000);
}

// Disposable/throwaway email domain blocklist
const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com','guerrillamail.com','guerrillamail.de','grr.la','guerrillamailblock.com',
    'tempmail.com','temp-mail.org','throwaway.email','fakeinbox.com','sharklasers.com',
    'guerrillamail.info','guerrillamail.net','yopmail.com','yopmail.fr','cool.fr.nf',
    'jetable.fr.nf','nospam.ze.tc','nomail.xl.cx','mega.zik.dj','speed.1s.fr',
    'courriel.fr.nf','moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf',
    'dispostable.com','trashmail.com','trashmail.me','trashmail.net','trashmail.org',
    'mailnesia.com','maildrop.cc','discard.email','discardmail.com','discardmail.de',
    'mailcatch.com','mailnull.com','mailscrap.com','mailseal.de','mailtemp.info',
    'tempail.com','tempr.email','tempmailaddress.com','throwawaymail.com',
    'trbvn.com','10minutemail.com','10minutemail.net','minutemail.io',
    'binkmail.com','bobmail.info','chammy.info','devnullmail.com',
    'emailisvalid.com','emailondeck.com','emailsensei.com','fakedemail.com',
    'filzmail.com','gishpuppy.com','harakirimail.com','imstations.com',
    'inboxalias.com','koszmail.pl','mailcatch.com','mailexpire.com',
    'mailforspam.com','mailimate.com','mailmoat.com','mailnator.com',
    'mailsac.com','mailslurp.com','mailzilla.com','meltmail.com',
    'mintemail.com','mt2015.com','mytemp.email','nobulk.com',
    'noclickemail.com','nogmailspam.info','notsomuch.com','ownmail.net',
    'purcell.email','putthisinyouremail.com','reallymymail.com','recode.me',
    'regbypass.com','rmqkr.net','royal.net','safersignup.de','safetymail.info',
    'sendspamhere.com','sharedmailbox.org','sharklasers.com','shieldedmail.com',
    'soodonims.com','spambob.net','spamfree24.org','spamgourmet.com',
    'spamhole.com','spamify.com','spaml.de','spamtrap.ro','superrito.com',
    'suremail.info','teleworm.us','tempe4mail.com','tempinbox.com',
    'tempmaildemo.com','tempomail.fr','temporaryemail.net','temporarymail.org',
    'thankyou2010.com','thisisnotmyrealemail.com','trashemail.de','trashymail.com',
    'trashymail.net','wegwerfmail.de','wegwerfmail.net','wetrainbayarea.com',
    'wh4f.org','whyspam.me','wilemail.com','willselfdestruct.com',
    'yep.it','yogamaven.com','zetmail.com','zoemail.org',
    'guerrillamail.biz','spam4.me','grr.la','maildu.de','trashmail.io',
    'mohmal.com','getnada.com','emailfake.com','crazymailing.com','armyspy.com',
    'dayrep.com','einrot.com','fleckens.hu','gustr.com','jourrapide.com',
    'rhyta.com','superrito.com','teleworm.us'
]);

function validateEmailFormat(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

function isDisposableEmail(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

async function verifyEmailDomain(email) {
    // Check if the email domain has valid MX (mail) records
    // Uses Cloudflare's free DNS-over-HTTPS API — no API key needed
    const domain = email.split('@')[1];
    if (!domain) return false;

    try {
        const response = await fetch(
            `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
            { headers: { 'Accept': 'application/dns-json' } }
        );
        const data = await response.json();
        // Status 0 = NOERROR, and Answer array should contain MX records
        return data.Status === 0 && data.Answer && data.Answer.length > 0;
    } catch {
        // If DNS check fails (network issue), allow submission as a fallback
        return true;
    }
}

function initContact() {
    const form = document.querySelector('.terminal-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('.submit-btn-minimal');
            const originalText = btn.innerHTML;

            // --- ANTI-SPAM: Rate limiting ---
            const now = Date.now();
            if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
                const remaining = Math.ceil((SUBMIT_COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
                showFormStatus(`⏳ COOLDOWN ACTIVE: Wait ${remaining}s before re-transmitting.`, 'warning');
                return;
            }

            const emailInput = form.querySelector('#email');
            const emailValue = emailInput ? emailInput.value.trim() : '';

            // --- ANTI-SPAM: Validate email format ---
            if (!validateEmailFormat(emailValue)) {
                showFormStatus('✗ INVALID EMAIL ADDRESS FORMAT', 'error');
                emailInput.focus();
                return;
            }

            // --- ANTI-SPAM: Block disposable/throwaway emails ---
            if (isDisposableEmail(emailValue)) {
                showFormStatus('✗ DISPOSABLE EMAIL DETECTED — use a real address.', 'error');
                emailInput.focus();
                return;
            }

            // --- ANTI-SPAM: Verify email domain has mail servers ---
            showFormStatus('⏳ VERIFYING EMAIL DOMAIN...', 'warning');
            const domainValid = await verifyEmailDomain(emailValue);
            if (!domainValid) {
                showFormStatus('✗ EMAIL DOMAIN INVALID — no mail server found.', 'error');
                emailInput.focus();
                return;
            }

            // --- ANTI-SPAM: Validate minimum message length ---
            const msgInput = form.querySelector('#message');
            if (msgInput && msgInput.value.trim().length < 10) {
                showFormStatus('✗ MESSAGE TOO SHORT — minimum 10 characters required.', 'error');
                msgInput.focus();
                return;
            }

            // Show sending state
            btn.innerHTML = '[ TRANSMITTING... ]';
            btn.style.color = 'var(--accent-amber)';
            btn.style.borderColor = 'var(--accent-amber)';
            btn.disabled = true;

            try {
                const formData = new FormData(form);
                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    lastSubmitTime = Date.now(); // Set cooldown timer
                    btn.innerHTML = '[ PAYLOAD TRANSMITTED ✓ ]';
                    btn.style.color = 'var(--accent-green)';
                    btn.style.borderColor = 'var(--accent-green)';
                    showFormStatus('✓ MESSAGE DELIVERED SUCCESSFULLY', 'success');
                    form.reset();
                    // Reset hCaptcha if it exists
                    if (typeof hcaptcha !== 'undefined') {
                        hcaptcha.reset();
                    }
                } else {
                    btn.innerHTML = '[ TRANSMISSION FAILED ✗ ]';
                    btn.style.color = 'var(--accent-danger)';
                    btn.style.borderColor = 'var(--accent-danger)';
                    showFormStatus('✗ TRANSMISSION FAILED — please try again.', 'error');
                }
            } catch (error) {
                btn.innerHTML = '[ NETWORK ERROR ✗ ]';
                btn.style.color = 'var(--accent-danger)';
                btn.style.borderColor = 'var(--accent-danger)';
                showFormStatus('✗ NETWORK ERROR — check your connection.', 'error');
            }

            // Reset button after 3 seconds
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.color = '';
                btn.style.borderColor = '';
                btn.disabled = false;
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