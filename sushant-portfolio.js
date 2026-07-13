(function () {
    "use strict";
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    /* ================= CIRCUIT-MESH BACKGROUND ================= */
    (function mesh() {
        var canvas = document.getElementById('mesh');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = 0, h = 0, nodes = [], raf = null, running = false;
        var mouse = { x: -9999, y: -9999 };
        var LINK_DIST = 150;

        function resize() {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var target = Math.round((w * h) / 26000);
            target = Math.max(24, Math.min(target, 70));
            nodes = [];
            for (var i = 0; i < target; i++) {
                nodes.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.22,
                    vy: (Math.random() - 0.5) * 0.22
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;

                // gentle cursor attraction
                var dxm = mouse.x - n.x, dym = mouse.y - n.y;
                var dm = Math.sqrt(dxm * dxm + dym * dym);
                if (dm < 180 && dm > 0.1) {
                    n.x += (dxm / dm) * 0.35;
                    n.y += (dym / dm) * 0.35;
                }
            }
            // links
            for (var a = 0; a < nodes.length; a++) {
                for (var b = a + 1; b < nodes.length; b++) {
                    var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
                    var d = Math.sqrt(dx * dx + dy * dy);
                    if (d < LINK_DIST) {
                        var al = (1 - d / LINK_DIST) * 0.16;
                        ctx.strokeStyle = 'rgba(76, 194, 217, ' + al.toFixed(3) + ')';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(nodes[a].x, nodes[a].y);
                        ctx.lineTo(nodes[b].x, nodes[b].y);
                        ctx.stroke();
                    }
                }
            }
            // nodes
            for (var k = 0; k < nodes.length; k++) {
                ctx.fillStyle = 'rgba(76, 194, 217, 0.5)';
                ctx.beginPath();
                ctx.arc(nodes[k].x, nodes[k].y, 1.4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function loop() { draw(); raf = requestAnimationFrame(loop); }
        function start() { if (!running) { running = true; loop(); } }
        function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

        resize();
        if (reduce) { draw(); return; } // one static frame, no animation
        start();

        window.addEventListener('resize', function () { dpr = Math.min(window.devicePixelRatio || 1, 2); resize(); });
        window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
        window.addEventListener('pointerleave', function () { mouse.x = -9999; mouse.y = -9999; });
        document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    })();

    /* ================= MOBILE NAV ================= */
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    if (toggle) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    /* ================= NAV: scrolled + active section ================= */
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    var sections = ['projects', 'experience', 'skills', 'contact']
        .map(function (id) { return document.getElementById(id); })
        .filter(Boolean);

    function setActive(id) {
        navLinks.forEach(function (a) { a.classList.toggle('active', a.dataset.nav === id); });
    }
    navLinks.forEach(function (a) {
        a.addEventListener('click', function () {
            nav.classList.remove('open');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
    });

    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:8px;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
        nav.classList.toggle('scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);

    sections.forEach(function (s) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
        }, { rootMargin: '-45% 0px -50% 0px' }).observe(s);
    });

    /* ================= DIRECTIONAL BUTTON FILL ================= */
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
        btn.addEventListener('mouseenter', function (e) {
            var r = btn.getBoundingClientRect();
            btn.style.setProperty('--ox', (e.clientX - r.left) < r.width / 2 ? '0%' : '100%');
        });
    });

    /* ================= SKILLS SPOTLIGHT (pointer-tracked) ================= */
    if (!('ontouchstart' in window)) {
        document.querySelectorAll('.cap-card').forEach(function (card) {
            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });
    }

    /* ================= COUNT-UPS ================= */
    function runCount(el) {
        var target = parseFloat(el.dataset.target);
        var decimals = parseInt(el.dataset.decimals, 10) || 0;
        if (reduce || !hasGsap) { el.textContent = target.toFixed(decimals); return; }
        var obj = { v: 0 };
        gsap.to(obj, {
            v: target, duration: 1.4, ease: 'power2.out',
            onUpdate: function () { el.textContent = obj.v.toFixed(decimals); }
        });
    }

    /* ================= MOTION ================= */
    if (!reduce && hasGsap) {

        // hero: masked line reveal + fade-up stagger + stat count-up
        var lines = gsap.utils.toArray('.hero-title .line-inner');
        var heroEls = gsap.utils.toArray('[data-hero]');
        gsap.set(lines, { yPercent: 115 });
        gsap.set(heroEls, { opacity: 0, y: 22 });
        var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        heroTl.to(lines, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.09 })
              .to(heroEls, { opacity: 1, y: 0, duration: 0.7, stagger: 0.09 }, '-=0.6')
              .add(function () { document.querySelectorAll('#home .count').forEach(runCount); }, '-=0.3');

        // section headings + blocks reveal
        gsap.utils.toArray('section.section-pad').forEach(function (sec) {
            var els = sec.querySelectorAll('[data-sec]');
            if (!els.length) return;
            gsap.set(els, { opacity: 0, y: 24 });
            ScrollTrigger.create({
                trigger: sec, start: 'top 78%', once: true,
                onEnter: function () { gsap.to(els, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }); }
            });
        });

        // timeline items + line draw
        var tlItems = gsap.utils.toArray('[data-item]');
        gsap.set(tlItems, { opacity: 0, y: 18 });
        ScrollTrigger.create({
            trigger: '.timeline', start: 'top 75%', once: true,
            onEnter: function () { gsap.to(tlItems, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.12 }); }
        });
        var linePath = document.querySelector('.timeline-line path');
        if (linePath) {
            gsap.set(linePath, { strokeDasharray: 1, strokeDashoffset: 1 });
            gsap.to(linePath, {
                strokeDashoffset: 0, ease: 'none',
                scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 75%', scrub: 0.6 }
            });
        }

        // skills cards + chips cascade
        gsap.utils.toArray('.cap-card').forEach(function (card) {
            var chips = card.querySelectorAll('[data-chip]');
            gsap.set(card, { opacity: 0, y: 26 });
            gsap.set(chips, { opacity: 0, y: 10 });
            ScrollTrigger.create({
                trigger: card, start: 'top 85%', once: true,
                onEnter: function () {
                    gsap.to(card, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
                    gsap.to(chips, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.035, delay: 0.1 });
                }
            });
        });

        // project count-ups fire once when the section is reached
        ScrollTrigger.create({
            trigger: '#projects', start: 'top 70%', once: true,
            onEnter: function () { document.querySelectorAll('#projects .count').forEach(runCount); }
        });

        // horizontal project pan (desktop + motion only, cleans up on resize)
        var mm = gsap.matchMedia();
        mm.add('(min-width: 721px)', function () {
            var pin = document.getElementById('projectsPin');
            var track = document.getElementById('projectsTrack');
            var progress = document.getElementById('projProgress');
            if (!pin || !track) return;

            var getDistance = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 32); };

            var tween = gsap.to(track, {
                x: function () { return -getDistance(); },
                ease: 'none',
                scrollTrigger: {
                    trigger: pin,
                    start: 'top top',
                    end: function () { return '+=' + getDistance(); },
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    onUpdate: function (self) { if (progress) progress.style.width = (self.progress * 100).toFixed(1) + '%'; }
                }
            });

            // parallax each panel image slightly as it pans
            var imgs = gsap.utils.toArray('.panel-media img');
            imgs.forEach(function (img) {
                gsap.fromTo(img, { scale: 1.12 }, {
                    scale: 1, ease: 'none',
                    scrollTrigger: { trigger: img.closest('.panel'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
                });
            });

            return function () { /* cleanup handled by matchMedia revert */ };
        });

        // refresh once images have loaded so pin distance is correct
        window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    } else {
        // reduced motion or no GSAP: show final stat values, no hidden state
        document.querySelectorAll('.count').forEach(runCount);
    }

    /* ================= CONTACT FORM ================= */
    var lastSubmitTime = 0;
    var SUBMIT_COOLDOWN_MS = 60000; // 60 second cooldown between submissions

    var form = document.getElementById('contactForm');
    var statusEl = document.getElementById('formStatus');
    var submitBtn = document.getElementById('submitBtn');

    function showFormStatus(msg, type) {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.className = 'form-status';
        if (type === 'error') statusEl.classList.add('status-error');
        else if (type === 'success') statusEl.classList.add('status-success');
        clearTimeout(showFormStatus._t);
        showFormStatus._t = setTimeout(function () {
            statusEl.textContent = '';
            statusEl.className = 'form-status';
        }, 6000);
    }

    function setFieldInvalid(id, invalid) {
        var wrap = document.getElementById(id);
        if (wrap) wrap.classList.toggle('invalid', invalid);
    }

    // Disposable/throwaway email domain blocklist
    var DISPOSABLE_EMAIL_DOMAINS = new Set([
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
        'inboxalias.com','koszmail.pl','mailexpire.com',
        'mailforspam.com','mailimate.com','mailmoat.com','mailnator.com',
        'mailsac.com','mailslurp.com','mailzilla.com','meltmail.com',
        'mintemail.com','mt2015.com','mytemp.email','nobulk.com',
        'noclickemail.com','nogmailspam.info','notsomuch.com','ownmail.net',
        'purcell.email','putthisinyouremail.com','reallymymail.com','recode.me',
        'regbypass.com','rmqkr.net','royal.net','safersignup.de','safetymail.info',
        'sendspamhere.com','sharedmailbox.org','shieldedmail.com',
        'soodonims.com','spambob.net','spamfree24.org','spamgourmet.com',
        'spamhole.com','spamify.com','spaml.de','spamtrap.ro','superrito.com',
        'suremail.info','teleworm.us','tempe4mail.com','tempinbox.com',
        'tempmaildemo.com','tempomail.fr','temporaryemail.net','temporarymail.org',
        'thankyou2010.com','thisisnotmyrealemail.com','trashemail.de','trashymail.com',
        'trashymail.net','wegwerfmail.de','wegwerfmail.net','wetrainbayarea.com',
        'wh4f.org','whyspam.me','wilemail.com','willselfdestruct.com',
        'yep.it','yogamaven.com','zetmail.com','zoemail.org',
        'guerrillamail.biz','spam4.me','maildu.de','trashmail.io',
        'mohmal.com','getnada.com','emailfake.com','crazymailing.com','armyspy.com',
        'dayrep.com','einrot.com','fleckens.hu','gustr.com','jourrapide.com',
        'rhyta.com'
    ]);

    var emailRe = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    function isDisposableEmail(email) {
        var domain = email.split('@')[1];
        return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain.toLowerCase()) : false;
    }

    function verifyEmailDomain(email) {
        // Check the email domain for valid MX (mail) records via
        // Cloudflare's free DNS-over-HTTPS API. No API key needed.
        var domain = email.split('@')[1];
        if (!domain) return Promise.resolve(false);
        return fetch(
            'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(domain) + '&type=MX',
            { headers: { 'Accept': 'application/dns-json' } }
        ).then(function (response) {
            return response.json();
        }).then(function (data) {
            return data.Status === 0 && data.Answer && data.Answer.length > 0;
        }).catch(function () {
            return true; // network fallback: allow
        });
    }

    if (form) {
        form.querySelectorAll('input, textarea').forEach(function (el) {
            el.addEventListener('input', function () {
                var field = el.closest('.field');
                if (field) field.classList.remove('invalid');
            });
        });

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            var originalHtml = submitBtn.innerHTML;

            var now = Date.now();
            if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
                var remaining = Math.ceil((SUBMIT_COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
                showFormStatus('Please wait ' + remaining + 's before sending another message.', 'error');
                return;
            }

            var nameInput = form.querySelector('#name');
            var emailInput = form.querySelector('#email');
            var msgInput = form.querySelector('#message');
            var nameValue = nameInput ? nameInput.value.trim() : '';
            var emailValue = emailInput ? emailInput.value.trim() : '';
            var msgValue = msgInput ? msgInput.value.trim() : '';

            var okName = nameValue.length >= 2;
            var okEmail = emailRe.test(emailValue);
            var okMsg = msgValue.length >= 10;
            setFieldInvalid('f-name', !okName);
            setFieldInvalid('f-email', !okEmail);
            setFieldInvalid('f-message', !okMsg);
            if (!okName || !okEmail || !okMsg) {
                (!okName ? nameInput : !okEmail ? emailInput : msgInput).focus();
                return;
            }

            if (isDisposableEmail(emailValue)) {
                setFieldInvalid('f-email', true);
                showFormStatus('Please use a permanent email address.', 'error');
                emailInput.focus();
                return;
            }

            showFormStatus('Checking email address...');
            var domainValid = await verifyEmailDomain(emailValue);
            if (!domainValid) {
                setFieldInvalid('f-email', true);
                showFormStatus("That email domain doesn't appear to accept mail.", 'error');
                emailInput.focus();
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending...';
            showFormStatus('');

            try {
                var formData = new FormData(form);
                var response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: formData
                });
                var result = await response.json();

                if (result.success) {
                    lastSubmitTime = Date.now();
                    showFormStatus("Message sent. I'll get back to you soon.", 'success');
                    form.reset();
                    if (typeof hcaptcha !== 'undefined') hcaptcha.reset();
                } else {
                    showFormStatus("Couldn't send your message. Please try again.", 'error');
                }
            } catch (error) {
                showFormStatus('Network error. Check your connection and try again.', 'error');
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
        });
    }
})();
