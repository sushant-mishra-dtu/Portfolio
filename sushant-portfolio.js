(function () {
    "use strict";
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    /* ---------- MOBILE NAV ---------- */
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    if (toggle) {
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }

    /* ---------- NAV: scrolled border + active section ---------- */
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    var sections = ['experience', 'projects', 'skills', 'contact']
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

    // sentinel-based scrolled state (no scroll listener)
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:8px;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
        nav.classList.toggle('scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);

    // active-section highlight
    sections.forEach(function (s) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
        }, { rootMargin: '-45% 0px -50% 0px' }).observe(s);
    });

    /* ---------- DIRECTIONAL BUTTON FILL ---------- */
    document.querySelectorAll('.btn-primary').forEach(function (btn) {
        btn.addEventListener('mouseenter', function (e) {
            var r = btn.getBoundingClientRect();
            btn.style.setProperty('--ox', (e.clientX - r.left) < r.width / 2 ? '0%' : '100%');
        });
    });

    /* ---------- COUNT-UPS ---------- */
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
    var counts = Array.prototype.slice.call(document.querySelectorAll('.count'));

    /* ---------- MOTION ---------- */
    // Content is visible by default (no CSS hiding). GSAP hides then reveals,
    // so a failed CDN or disabled JS still shows the full page.
    if (!reduce && hasGsap) {

        counts.forEach(function (el) {
            el.textContent = (0).toFixed(parseInt(el.dataset.decimals, 10) || 0);
            ScrollTrigger.create({
                trigger: el, start: 'top 88%', once: true,
                onEnter: function () { runCount(el); }
            });
        });

        // hero: masked line reveal for the name, fade-up stagger for the rest
        var h1Line = document.querySelector('.h1-line');
        var heroEls = gsap.utils.toArray('[data-hero]');
        gsap.set(h1Line, { yPercent: 110 });
        gsap.set(heroEls, { opacity: 0, y: 22 });
        gsap.timeline({ defaults: { ease: 'power3.out' } })
            .to(h1Line, { yPercent: 0, duration: 0.9, ease: 'power4.out' })
            .to(heroEls, { opacity: 1, y: 0, duration: 0.7, stagger: 0.09 }, '-=0.55');

        // section headings + blocks: fade-up per section, children staggered
        gsap.utils.toArray('section.section-pad').forEach(function (sec) {
            var els = sec.querySelectorAll('[data-sec]');
            if (!els.length) return;
            gsap.set(els, { opacity: 0, y: 24 });
            ScrollTrigger.create({
                trigger: sec, start: 'top 80%', once: true,
                onEnter: function () {
                    gsap.to(els, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 });
                }
            });
        });

        // experience entries: cascade within their column
        gsap.utils.toArray('[data-item]').forEach(function (item, i) {
            gsap.set(item, { opacity: 0, y: 16 });
            ScrollTrigger.create({
                trigger: item, start: 'top 88%', once: true,
                onEnter: function () {
                    gsap.to(item, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: (i % 3) * 0.06 });
                }
            });
        });

        // project cards: each animates on its own entry, image settles from a zoom
        gsap.utils.toArray('[data-card]').forEach(function (card) {
            var img = card.querySelector('img');
            gsap.set(card, { opacity: 0, y: 28 });
            gsap.set(img, { scale: 1.14 });
            ScrollTrigger.create({
                trigger: card, start: 'top 88%', once: true,
                onEnter: function () {
                    gsap.to(card, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
                    gsap.to(img, { scale: 1, duration: 1.1, ease: 'power3.out' });
                }
            });
        });

        // featured image: settle-in zoom + gentle scrub parallax
        var fImg = document.getElementById('featuredImg');
        if (fImg) {
            gsap.set(fImg, { scale: 1.12 });
            gsap.to(fImg, {
                scale: 1.06, duration: 1.2, ease: 'power3.out',
                scrollTrigger: { trigger: '.featured', start: 'top 80%', once: true }
            });
            gsap.to(fImg, {
                yPercent: 6, ease: 'none',
                scrollTrigger: { trigger: '.featured', start: 'top bottom', end: 'bottom top', scrub: 0.6 }
            });
        }

        // skill chips: micro-cascade per group
        gsap.utils.toArray('.skill-group').forEach(function (group) {
            var chips = group.querySelectorAll('[data-chip]');
            gsap.set(chips, { opacity: 0, y: 10 });
            ScrollTrigger.create({
                trigger: group, start: 'top 88%', once: true,
                onEnter: function () {
                    gsap.to(chips, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.035 });
                }
            });
        });

    } else {
        // reduced motion or no GSAP: everything stays visible, counts show final values
        counts.forEach(function (el) { runCount(el); });
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
            // Status 0 = NOERROR, and Answer array should contain MX records
            return data.Status === 0 && data.Answer && data.Answer.length > 0;
        }).catch(function () {
            // If the DNS check fails (network issue), allow submission as a fallback
            return true;
        });
    }

    if (form) {
        // clear error state as the user corrects a field
        form.querySelectorAll('input, textarea').forEach(function (el) {
            el.addEventListener('input', function () {
                var field = el.closest('.field');
                if (field) field.classList.remove('invalid');
            });
        });

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            var originalHtml = submitBtn.innerHTML;

            // rate limiting
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

            // block disposable/throwaway emails
            if (isDisposableEmail(emailValue)) {
                setFieldInvalid('f-email', true);
                showFormStatus('Please use a permanent email address.', 'error');
                emailInput.focus();
                return;
            }

            // verify the email domain has mail servers
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
