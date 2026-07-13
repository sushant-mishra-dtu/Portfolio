(function () {
    "use strict";

    document.documentElement.classList.add('js');

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    /* ================= LIVE CLOCK (Ghaziabad / IST) ================= */
    (function clock() {
        var clockEl = document.getElementById('clock');
        var menuClockEl = document.getElementById('menuClock');
        if (!clockEl && !menuClockEl) return;
        var fmt;
        try {
            fmt = new Intl.DateTimeFormat('en-GB', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false, timeZone: 'Asia/Kolkata'
            });
        } catch (e) {
            fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        }
        function tick() {
            var t = fmt.format(new Date());
            if (clockEl) clockEl.textContent = t;
            if (menuClockEl) menuClockEl.textContent = t;
        }
        tick();
        setInterval(tick, 1000);
    })();

    /* ================= LIVE GITHUB SIGNAL ================= */
    (function github() {
        var panel = document.getElementById('ghPanel');
        if (!panel) return;
        var USER = 'sushant-mishra-dtu';

        function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

        function relTime(iso) {
            var d = new Date(iso), s = Math.floor((Date.now() - d) / 1000);
            if (isNaN(s)) return '';
            if (s < 60) return 'just now';
            var m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
            var h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
            var days = Math.floor(h / 24); if (days < 30) return days + 'd ago';
            var mo = Math.floor(days / 30); if (mo < 12) return mo + 'mo ago';
            return Math.floor(mo / 12) + 'y ago';
        }

        function ok(r) { return r.ok ? r.json() : Promise.reject(r.status); }

        Promise.all([
            fetch('https://api.github.com/users/' + USER).then(ok),
            fetch('https://api.github.com/users/' + USER + '/repos?per_page=100&sort=pushed').then(ok)
        ]).then(function (res) {
            var u = res[0], repos = Array.isArray(res[1]) ? res[1] : [];
            set('ghRepos', u.public_repos != null ? u.public_repos : repos.length);
            set('ghFollowers', u.followers != null ? u.followers : 0);
            set('ghStars', repos.reduce(function (a, r) { return a + (r.stargazers_count || 0); }, 0));

            var owned = repos.filter(function (r) { return !r.fork; });
            var latest = (owned.length ? owned : repos).slice().sort(function (a, b) {
                return new Date(b.pushed_at) - new Date(a.pushed_at);
            })[0];
            set('ghPush', latest ? (latest.name + ' · ' + relTime(latest.pushed_at)) : '—');

            var langs = {};
            repos.forEach(function (r) { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
            var top = Object.keys(langs).sort(function (a, b) { return langs[b] - langs[a]; }).slice(0, 4);
            var wrap = document.getElementById('ghLangs');
            if (wrap && top.length) {
                wrap.innerHTML = '';
                top.forEach(function (l) {
                    var s = document.createElement('span');
                    s.className = 'gh-lang mono';
                    s.textContent = l + ' · ' + langs[l];
                    wrap.appendChild(s);
                });
            }
            panel.classList.add('gh-live');
        }).catch(function () {
            panel.classList.add('gh-offline');
            set('ghPush', 'signal unavailable');
            var wrap = document.getElementById('ghLangs');
            if (wrap) wrap.innerHTML = '<span class="gh-lang mono">github · offline</span>';
        });
    })();

    /* ================= MENU OVERLAY + NAV ================= */
    var body = document.body;
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var menuOverlay = document.getElementById('menuOverlay');
    var menuLinks = Array.prototype.slice.call(document.querySelectorAll('.menu-list a'));

    function closeMenu() {
        if (!body.classList.contains('menu-open')) return;
        body.classList.remove('menu-open');
        if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); }
        if (menuOverlay) menuOverlay.setAttribute('aria-hidden', 'true');
    }
    if (toggle && menuOverlay) {
        toggle.addEventListener('click', function () {
            var open = body.classList.toggle('menu-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            menuOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
        });
        menuLinks.forEach(function (a) { a.addEventListener('click', closeMenu); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    }

    // nav "scrolled" state
    if (nav) {
        var sentinel = document.createElement('div');
        sentinel.style.cssText = 'position:absolute;top:6px;left:0;width:1px;height:1px;pointer-events:none;';
        body.prepend(sentinel);
        new IntersectionObserver(function (entries) {
            nav.classList.toggle('scrolled', !entries[0].isIntersecting);
        }).observe(sentinel);
    }

    // active section -> aria-current on menu links
    var navSections = ['home', 'about', 'projects', 'experience', 'skills', 'contact']
        .map(function (id) { return document.getElementById(id); }).filter(Boolean);
    function setActive(id) {
        menuLinks.forEach(function (a) {
            var on = a.getAttribute('data-menu') === id;
            a.classList.toggle('active', on);
            if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
    }
    navSections.forEach(function (s) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
        }, { rootMargin: '-45% 0px -50% 0px' }).observe(s);
    });

    /* ================= MAGNETIC BUTTONS + DIRECTIONAL FILL ================= */
    if (window.matchMedia('(pointer:fine)').matches && !reduce) {
        document.querySelectorAll('[data-magnetic]').forEach(function (el) {
            var strength = 0.32;
            el.addEventListener('pointermove', function (e) {
                var r = el.getBoundingClientRect();
                var x = e.clientX - (r.left + r.width / 2);
                var y = e.clientY - (r.top + r.height / 2);
                el.style.transition = 'transform 0.12s linear';
                el.style.transform = 'translate(' + (x * strength).toFixed(2) + 'px,' + (y * strength).toFixed(2) + 'px)';
            });
            el.addEventListener('pointerleave', function () {
                el.style.transition = 'transform 0.45s cubic-bezier(0.16,1,0.3,1)';
                el.style.transform = '';
            });
        });
    }
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
        btn.addEventListener('mouseenter', function (e) {
            var r = btn.getBoundingClientRect();
            btn.style.setProperty('--ox', (e.clientX - r.left) < r.width / 2 ? '0%' : '100%');
        });
    });

    /* ================= CAPABILITY-CARD SPOTLIGHT ================= */
    if (!('ontouchstart' in window) && !reduce) {
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
            v: target, duration: 1.5, ease: 'power2.out',
            onUpdate: function () { el.textContent = obj.v.toFixed(decimals); }
        });
    }

    /* ================= HERO INTRO TIMELINE (built, played after preloader) ================= */
    var heroTl = null;
    function buildHeroIntro() {
        if (!hasGsap || reduce) return null;
        var lines = gsap.utils.toArray('.hero-title .line-inner');
        var heroEls = gsap.utils.toArray('[data-hero]');
        gsap.set(lines, { yPercent: 120 });
        gsap.set(heroEls, { opacity: 0, y: 24 });
        var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
        tl.to(lines, { yPercent: 0, duration: 1.05, ease: 'power4.out', stagger: 0.1 })
          .to(heroEls, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, '-=0.55')
          .add(function () { document.querySelectorAll('#home .count').forEach(runCount); }, '-=0.35');
        return tl;
    }

    /* ================= SCROLL CHOREOGRAPHY ================= */
    function buildScrollAnimations() {
        if (!hasGsap || reduce) return;

        // section blocks reveal
        ['#about', '#projects', '#experience', '#skills', '#contact'].forEach(function (sel) {
            var sec = document.querySelector(sel);
            if (!sec) return;
            var els = sec.querySelectorAll('[data-sec]');
            if (!els.length) return;
            gsap.set(els, { opacity: 0, y: 26 });
            ScrollTrigger.create({
                trigger: sec, start: 'top 78%', once: true,
                onEnter: function () { gsap.to(els, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }); }
            });
        });

        // manifesto: pinned word-by-word ignite (faint -> bone) on scrub
        var mWords = gsap.utils.toArray('.manifesto-text .word');
        if (mWords.length) {
            gsap.set(mWords, { color: '#55524B' });
            gsap.timeline({
                scrollTrigger: { trigger: '.manifesto-pin', start: 'top top', end: '+=110%', pin: true, scrub: 0.6 }
            }).to(mWords, { color: '#EDEDE8', ease: 'none', stagger: 0.6 });
        }

        // projects: stacked-card cascade (desktop) + progress bar
        var mm = gsap.matchMedia();
        mm.add('(min-width: 768px)', function () {
            var cards = gsap.utils.toArray('.stack-card');
            cards.forEach(function (card, i) {
                if (i === cards.length - 1) return;
                var inner = card.querySelector('.card-inner');
                if (!inner) return;
                gsap.to(inner, {
                    scale: 0.94, ease: 'none', transformOrigin: '50% 0%',
                    scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true }
                });
            });
            var prog = document.getElementById('stackProgress');
            ScrollTrigger.create({
                trigger: '#projects', start: 'top top', end: 'bottom bottom',
                onUpdate: function (self) { if (prog) prog.style.width = (self.progress * 100).toFixed(1) + '%'; }
            });
        });

        // project metric count-ups
        ScrollTrigger.create({
            trigger: '#projects', start: 'top 70%', once: true,
            onEnter: function () { document.querySelectorAll('#projects .count').forEach(runCount); }
        });

        // timeline: items fade + SVG line draw
        var tlItems = gsap.utils.toArray('[data-item]');
        if (tlItems.length) {
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
                    scrollTrigger: { trigger: '.timeline', start: 'top 72%', end: 'bottom 78%', scrub: 0.6 }
                });
            }
        }

        // capability cards + chips cascade
        gsap.utils.toArray('.cap-card').forEach(function (card) {
            var chips = card.querySelectorAll('[data-chip]');
            gsap.set(card, { opacity: 0, y: 28 });
            gsap.set(chips, { opacity: 0, y: 10 });
            ScrollTrigger.create({
                trigger: card, start: 'top 85%', once: true,
                onEnter: function () {
                    gsap.to(card, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
                    gsap.to(chips, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.04, delay: 0.1 });
                }
            });
        });

        window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }

    /* ================= PRELOADER (boot sequence) ================= */
    function initPreloader(onDone) {
        var pre = document.getElementById('preloader');
        if (!pre || reduce) {
            if (pre) pre.style.display = 'none';
            onDone();
            return;
        }
        var bar = document.getElementById('preBar');
        var pct = document.getElementById('prePct');
        var skip = document.getElementById('preSkip');
        var lines = pre.querySelectorAll('.pre-line');
        var done = false;

        function finish() {
            if (done) return;
            done = true;
            pre.classList.add('preloader-hidden');
            setTimeout(function () { pre.style.display = 'none'; }, 900);
            onDone();
        }

        if (hasGsap) {
            gsap.set(lines, { opacity: 0, x: -6 });
            gsap.to(lines, { opacity: 1, x: 0, duration: 0.25, stagger: 0.14, ease: 'power2.out' });
        } else {
            lines.forEach(function (l) { l.style.opacity = 1; });
        }

        var start = performance.now();
        var DUR = 1400;
        function frame(now) {
            var t = Math.min(1, (now - start) / DUR);
            var v = Math.round(t * 100);
            if (bar) bar.style.width = v + '%';
            if (pct) pct.textContent = ('000' + v).slice(-3);
            if (t < 1 && !done) requestAnimationFrame(frame);
            else finish();
        }
        requestAnimationFrame(frame);
        // Hard fallback: guarantee dismissal even if rAF is throttled (e.g. background tab).
        setTimeout(finish, DUR + 700);

        if (skip) skip.addEventListener('click', finish);
        pre.addEventListener('click', function (e) { if (e.target === pre) finish(); });
        document.addEventListener('keydown', function (e) {
            if (!done && (e.key === 'Escape' || e.key === 'Enter')) finish();
        });
    }

    /* ================= BOOT ================= */
    if (reduce || !hasGsap) {
        // Motion off or GSAP unavailable: everything visible, final values, no pinning.
        document.querySelectorAll('.count').forEach(runCount);
        var preEl = document.getElementById('preloader');
        if (preEl) preEl.style.display = 'none';
    } else {
        heroTl = buildHeroIntro();
        buildScrollAnimations();
        initPreloader(function () { if (heroTl) heroTl.play(); });
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
