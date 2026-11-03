(() => {
  document.getElementById('yr').textContent = new Date().getFullYear();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  onScroll(); addEventListener('scroll', onScroll, {passive:true});
  const tog = document.querySelector('.nav-toggle'), menu = document.getElementById('navMenu');
  tog.addEventListener('click', () => {
    const open = tog.getAttribute('aria-expanded') !== 'true';
    tog.setAttribute('aria-expanded', open); menu.classList.toggle('open', open);
    nav.classList.add('scrolled');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { tog.setAttribute('aria-expanded', false); menu.classList.remove('open'); }));

  // active link
  const links = [...menu.querySelectorAll('a')];
  const map = { top:'#top', services:'#services', work:'#work', about:'#about', pricing:'#pricing', quote:'#quote' };
  const secs = Object.keys(map).map(id => id === 'top' ? document.querySelector('.hero') : document.getElementById(id));
  const spy = () => {
    let cur = '#top';
    secs.forEach((el, i) => { if (el && el.getBoundingClientRect().top < 140) cur = Object.values(map)[i]; });
    links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === cur));
  };
  addEventListener('scroll', spy, {passive:true}); spy();

  /* ---------- Our story ---------- */
  const sb = document.getElementById('storyBtn'), story = document.getElementById('story');
  sb.addEventListener('click', () => {
    const open = story.hidden;
    story.hidden = !open; sb.setAttribute('aria-expanded', open);
    sb.firstChild.textContent = open ? 'Hide Our Story ' : 'Our Story ';
    if (open) story.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block:'start'});
  });

  /* ---------- Reveal ---------- */
  if (!reduce && 'IntersectionObserver' in window){
    const els = document.querySelectorAll('.svc, .work, .steps li, .plan, .fdr, .vals, .inds-list li');
    els.forEach(e => e.classList.add('rv'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {rootMargin:'0px 0px -8% 0px'});
    els.forEach(e => io.observe(e));
  }

  /* ---------- Estimator ---------- */
  const form = document.getElementById('quoteForm');
  const estV = document.getElementById('estValue'), estP = document.getElementById('estPlan'), estF = document.getElementById('estFill');
  const MIN = 500, MAX = 1000;
  let shown = MIN;

  function calc(){
    let n = MIN;
    form.querySelectorAll('input[name=feat]:checked').forEach(i => n += +i.value);
    n += +form.querySelector('input[name=help]:checked').value;
    return Math.min(MAX, Math.round(n / 25) * 25);
  }
  function planFor(n){ return n <= 550 ? 'Starter package' : n <= 750 ? 'Business package' : 'Premium package'; }

  function update(){
    const target = calc();
    estP.textContent = planFor(target) + (target === MAX ? ' · max price' : '');
    estF.style.width = ((target - MIN) / (MAX - MIN) * 100) + '%';
    if (reduce){ estV.textContent = '$' + target.toLocaleString(); shown = target; return; }
    const from = shown, start = performance.now();
    (function step(now){
      const k = Math.min(1, (now - start) / 300);
      shown = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      estV.textContent = '$' + shown.toLocaleString();
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }
  form.addEventListener('change', update);

  // Plan buttons preselect the estimator
  const presets = { starter:{help:'0',feats:[]}, business:{help:'100',feats:[0,1]}, premium:{help:'200',feats:[0,1,2,3,4]} };
  document.querySelectorAll('[data-plan]').forEach(b => b.addEventListener('click', () => {
    const p = presets[b.dataset.plan];
    form.querySelector(`input[name=help][value="${p.help}"]`).checked = true;
    form.querySelectorAll('input[name=feat]').forEach((i, idx) => i.checked = p.feats.includes(idx));
    update();
  }));

  // Service "Learn more" links preselect interest
  document.querySelectorAll('[data-svc]').forEach(a => a.addEventListener('click', () => {
    const box = form.querySelector(`input[name=svc][value="${a.dataset.svc}"]`);
    if (box){ box.checked = true; }
  }));

  /* ---------- Submit ---------- */
  const QUOTE_TO = 'javier@northwest-pixel.com';
  const QUOTE_CC = 'javier@northwest-pixel.com';
  const msg = document.getElementById('formMsg');
  const submitBtn = form.querySelector('button[type=submit]');
  const fv = n => (form.elements.namedItem(n) || {value:''}).value;
  const chipText = i => i.closest('.chip').querySelector('span').textContent.trim();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (fv('_honey')) return; // bot trap
    let bad = null;
    form.querySelectorAll('[required]').forEach(i => {
      const ok = i.type === 'email' ? /\S+@\S+\.\S+/.test(i.value) : i.value.trim() !== '';
      i.setAttribute('aria-invalid', !ok);
      if (!ok && !bad) bad = i;
    });
    if (bad){ msg.className = 'form-msg err'; msg.textContent = 'Please add your name, business name and a valid email.'; bad.focus(); return; }

    const biz = fv('business').trim();
    const est = calc();
    const feats = [...form.querySelectorAll('input[name=feat]:checked')].map(chipText);
    const help = chipText(form.querySelector('input[name=help]:checked'));
    const payload = {
      access_key: 'e6da9c3d-6bb9-48d7-86f1-700448a229dc',
      subject: `New quote request: ${biz} ($${est})`,
      from_name: 'Northwest Pixel Website',
      replyto: fv('email').trim(),
      'Name': fv('name').trim(),
      'Business': biz,
      'Email': fv('email').trim(),
      'Phone': fv('phone').trim() || 'Not provided',
      'Instagram / social': fv('social').trim() || 'Not provided',
      'Features wanted': feats.length ? feats.join(', ') : 'None selected',
      'Setup help': help,
      'Also interested in': [...form.querySelectorAll('input[name=svc]:checked')].map(i => i.value).join(', ') || 'None',
      'Estimate': `$${est} (${planFor(est)})`,
      'Notes': fv('notes').trim() || 'None'
    };

    submitBtn.disabled = true; submitBtn.textContent = 'Sending...';
    msg.className = 'form-msg'; msg.textContent = '';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success !== true) { console.warn('Quote form:', res.status, data); throw new Error(data.message || 'Send failed'); }
      msg.className = 'form-msg ok';
      msg.textContent = `Thanks! We got your request for ${biz} (estimate $${est}). We'll be in touch soon.`;
      submitBtn.textContent = 'Request sent';
    } catch (err) {
      msg.className = 'form-msg err';
      msg.innerHTML = '';
      const body = Object.entries(payload).filter(([k]) => !['access_key','subject','from_name','replyto','botcheck'].includes(k)).map(([k, v]) => `${k}: ${v}`).join('\n');
      const href = `mailto:${QUOTE_CC}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`;
      msg.append('Our form is having trouble right now. ');
      const a = document.createElement('a'); a.href = href; a.textContent = 'Click here to email your request';
      msg.append(a, ` to ${QUOTE_CC}. Your details are already filled in.`);
      submitBtn.disabled = false; submitBtn.textContent = 'Send my quote request';
    }
  });
})();
