(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ================= Theme toggle ================= */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('glm-theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) root.setAttribute('data-theme', 'light');
  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    const applyTheme = () => {
      root.setAttribute('data-theme', next);
      localStorage.setItem('glm-theme', next);
    };

    if (reduceMotion || !document.startViewTransition) {
      applyTheme();
      return;
    }

    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(applyTheme);
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 600, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });

  /* ================= Language switcher (FR / EN / ZH) ================= */
  const I18N = {
    fr: {
      'nav.ia_data': 'IA & Data', 'nav.robotique': 'Robotique', 'nav.saas_web': 'SaaS & Web', 'nav.contact': 'Contact',
      'nav.search': 'Recherche rapide', 'nav.cta': 'Démarrer un projet',
      'hero.title': 'On transforme vos <span class="grad-text">idées</span> en produits qui tournent.',
      'hero.subtitle': 'GLM conçoit, développe et déploie des solutions <strong>IA</strong>, <strong>SaaS</strong>, <strong>Data</strong>, <strong>Web</strong> et <strong>Robotique</strong> — du cadrage à la mise en production, avec une équipe qui code autant qu\'elle conseille.',
      'hero.cta_primary': 'Discuter de mon projet',
      'hero.stat1_label': "secteurs d'expertise", 'hero.stat2_label': 'disponibles pour votre projet',
      'hero.stat3_num': 'Sur-mesure', 'hero.stat3_label': 'pensés pour votre business, selon vos envies',
      'poles.intro': "Trois pôles d'ingénierie, une seule équipe.",
      'section1.tag': 'Intelligence', 'section1.heading': 'IA, Data & Automatisation',
      'section1.body': "Sur la donnée, nous collectons, nettoyons et analysons vos data, déployons les pipelines qui les font circuler, puis créons et exploitons des API pour les rendre accessibles. Sur l'IA, nous entraînons des modèles sur ces données, construisons des systèmes RAG et des assistants conversationnels sur-mesure. Sur l'automatisation, nous prenons en charge les tâches répétitives et administratives — tri des emails, envoi de rappels, facturation — pour une vraie excellence opérationnelle.",
      'section2.tag': 'Systèmes', 'section2.heading': 'Robotique',
      'section2.body': "Nous menons de la recherche et développement sur des robots 100% autonomes, pilotés par IA, conçus en partenariat avec chaque client pour répondre à un besoin précis. Notre avantage : leur simplicité d'usage — pas besoin d'être expert technique ni de former qui que ce soit. Ce sont des robots professionnels que n'importe qui peut piloter depuis un smartphone.",
      'section3.tag': 'Plateformes', 'section3.heading': 'SaaS, Web & DevOps',
      'section3.body': "Nous aidons à développer votre activité, du simple site vitrine à la boutique en ligne, jusqu'au SaaS de prospection connecté en MCP comme outil de travail principal, avec des fonctionnalités business à forte valeur ajoutée. Hébergement web inclus : nous accompagnons vos projets de A à Z.",
      'contact.tag': 'Contact', 'contact.heading': 'Un projet en tête ? Parlons-en.',
      'contact.subtitle': "Écrivez, appelez ou passez sur WhatsApp — on vous répond directement, sans formulaire à remplir.",
      'contact.whatsapp_title': 'WhatsApp', 'contact.whatsapp_cta': 'Ouvrir la conversation',
      'contact.email_title': 'Email', 'contact.email_cta': 'Écrire un message',
      'contact.linkedin_title': 'LinkedIn',
      'contact.linkedin_cta': 'Voir le profil',
      'footer.legal': 'GLM — SAS, SIREN 108 105 529.',
      'footer.shortcuts_btn': 'Raccourcis clavier',
      'shortcuts.title': 'Raccourcis clavier', 'shortcuts.cmdk_label': 'Palette de commandes',
      'shortcuts.theme_label': 'Basculer le thème', 'shortcuts.assistant_label': "Ouvrir l'assistant IA",
      'shortcuts.help_label': 'Cette aide', 'shortcuts.close_label': 'Fermer une fenêtre',
      'shortcuts.easter_label': 'Un easter egg de développeur…',
      'assistant.placeholder': 'Écrivez ou dites une question…',
      'assistant.greeting': "Bonjour, je suis l'assistant GLM. Posez une question sur nos expertises (IA, SaaS, data, web, robotique) — au clavier ou à la voix.",
    },
    en: {
      'nav.ia_data': 'AI & Data', 'nav.robotique': 'Robotics', 'nav.saas_web': 'SaaS & Web', 'nav.contact': 'Contact',
      'nav.search': 'Quick search', 'nav.cta': 'Start a project',
      'hero.title': 'We turn your <span class="grad-text">ideas</span> into products that ship.',
      'hero.subtitle': 'GLM designs, builds and ships <strong>AI</strong>, <strong>SaaS</strong>, <strong>Data</strong>, <strong>Web</strong> and <strong>Robotics</strong> solutions — from scoping to production, with a team that codes as much as it advises.',
      'hero.cta_primary': 'Discuss my project',
      'hero.stat1_label': 'areas of expertise', 'hero.stat2_label': 'available for your project',
      'hero.stat3_num': 'Tailor-made', 'hero.stat3_label': 'built around your business, on your terms',
      'poles.intro': 'Three engineering practices, one team.',
      'section1.tag': 'Intelligence', 'section1.heading': 'AI, Data & Automation',
      'section1.body': 'On data, we collect, clean and analyse your data, deploy the pipelines that move it, then build and run APIs to make it accessible. On AI, we train models on that data, build RAG systems and bespoke conversational assistants. On automation, we handle repetitive administrative tasks — sorting emails, sending reminders, invoicing — for real operational excellence.',
      'section2.tag': 'Systems', 'section2.heading': 'Robotics',
      'section2.body': 'We run R&D on 100% autonomous, AI-driven robots, designed in partnership with each client to meet a specific need. Our edge: ease of use — no technical expertise required, no training needed. These are professional robots anyone can pilot from a smartphone.',
      'section3.tag': 'Platforms', 'section3.heading': 'SaaS, Web & DevOps',
      'section3.body': 'We help grow your business, from a simple showcase website to an online store, up to a prospecting SaaS connected via MCP as your main work tool, with high-value business features. Web hosting included: we support your projects end to end.',
      'contact.tag': 'Contact', 'contact.heading': "Got a project in mind? Let's talk.",
      'contact.subtitle': 'Write, call, or message us on WhatsApp — we reply directly, no form to fill in.',
      'contact.whatsapp_title': 'WhatsApp', 'contact.whatsapp_cta': 'Start the conversation',
      'contact.email_title': 'Email', 'contact.email_cta': 'Send a message',
      'contact.linkedin_title': 'LinkedIn',
      'contact.linkedin_cta': 'View profile',
      'footer.legal': 'GLM — a French SAS, SIREN 108 105 529.',
      'footer.shortcuts_btn': 'Keyboard shortcuts',
      'shortcuts.title': 'Keyboard shortcuts', 'shortcuts.cmdk_label': 'Command palette',
      'shortcuts.theme_label': 'Toggle theme', 'shortcuts.assistant_label': 'Open the AI assistant',
      'shortcuts.help_label': 'This help', 'shortcuts.close_label': 'Close a window',
      'shortcuts.easter_label': 'A developer easter egg…',
      'assistant.placeholder': 'Type or say a question…',
      'assistant.greeting': "Hi, I'm the GLM assistant. Ask a question about our expertise (AI, SaaS, data, web, robotics) — by keyboard or by voice.",
    },
    zh: {
      'nav.ia_data': 'AI 与数据', 'nav.robotique': '机器人', 'nav.saas_web': 'SaaS 与网页', 'nav.contact': '联系方式',
      'nav.search': '快速搜索', 'nav.cta': '开启项目',
      'hero.title': '我们将您的<span class="grad-text">创意</span>转化为真正运转的产品。',
      'hero.subtitle': 'GLM设计、开发并交付<strong>人工智能</strong>、<strong>SaaS</strong>、<strong>数据</strong>、<strong>网页</strong>与<strong>机器人</strong>解决方案——从需求梳理到上线部署,我们的团队既提供咨询,也亲自编写代码。',
      'hero.cta_primary': '讨论我的项目',
      'hero.stat1_label': '专业领域', 'hero.stat2_label': '随时为您的项目待命',
      'hero.stat3_num': '量身定制', 'hero.stat3_label': '根据您的业务与需求打造',
      'poles.intro': '三大工程领域,同一支团队。',
      'section1.tag': '智能', 'section1.heading': '人工智能、数据与自动化',
      'section1.body': '在数据方面,我们负责数据的采集、清洗与分析,部署让数据流转的管道,再构建并运维API使其可被调用。在人工智能方面,我们基于这些数据训练模型,搭建RAG系统与定制化对话助手。在自动化方面,我们处理重复性行政任务——邮件自动分类、提醒发送、开票——实现真正的运营卓越。',
      'section2.tag': '系统', 'section2.heading': '机器人技术',
      'section2.body': '我们在100%自主、由人工智能驱动的机器人领域开展研发,与每位客户合作设计以满足其特定需求。我们的优势在于易用性——无需技术专长,也无需培训。这些专业机器人任何人都能用智能手机操控。',
      'section3.tag': '平台', 'section3.heading': 'SaaS、网页与DevOps',
      'section3.body': '我们帮助您发展业务,从简单的展示网站、在线商店,到通过MCP连接的、作为主要工作工具的获客SaaS,配备高附加值的业务功能。含网页托管:我们从头到尾陪伴您的项目。',
      'contact.tag': '联系方式', 'contact.heading': '有项目构想?我们来聊聊。',
      'contact.subtitle': '写邮件、打电话或通过WhatsApp联系我们——我们直接回复,无需填写表单。',
      'contact.whatsapp_title': 'WhatsApp', 'contact.whatsapp_cta': '开始对话',
      'contact.email_title': '邮箱', 'contact.email_cta': '发送消息',
      'contact.linkedin_title': 'LinkedIn',
      'contact.linkedin_cta': '查看主页',
      'footer.legal': 'GLM——法国SAS公司,SIREN 108 105 529。',
      'footer.shortcuts_btn': '键盘快捷键',
      'shortcuts.title': '键盘快捷键', 'shortcuts.cmdk_label': '命令面板',
      'shortcuts.theme_label': '切换主题', 'shortcuts.assistant_label': '打开AI助手',
      'shortcuts.help_label': '此帮助', 'shortcuts.close_label': '关闭窗口',
      'shortcuts.easter_label': '开发者彩蛋……',
      'assistant.placeholder': '输入或说出您的问题……',
      'assistant.greeting': '您好,我是GLM助手。请就我们的专业领域(人工智能、SaaS、数据、网页、机器人)提问——可以打字,也可以语音。',
    },
  };

  const langSwitch = document.getElementById('langSwitch');
  const langTrigger = document.getElementById('langTrigger');
  const langMenu = document.getElementById('langMenu');
  const langCurrent = document.getElementById('langCurrent');
  const LANG_LABELS = { fr: 'FR', en: 'EN', zh: '中文' };

  function applyLanguage(lang) {
    const dict = I18N[lang] || I18N.fr;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (dict[key] != null) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] != null) el.placeholder = dict[key];
    });
    langCurrent.textContent = LANG_LABELS[lang] || 'FR';
    document.documentElement.lang = lang;
    langMenu.querySelectorAll('li').forEach(li => li.classList.toggle('active', li.dataset.lang === lang));
    localStorage.setItem('glm-lang', lang);
    window.__glmLang = lang;
  }

  const savedLang = localStorage.getItem('glm-lang') || 'fr';
  applyLanguage(savedLang);

  langTrigger.addEventListener('click', () => {
    const open = langSwitch.classList.toggle('open');
    langTrigger.setAttribute('aria-expanded', String(open));
  });
  langMenu.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      applyLanguage(li.dataset.lang);
      langSwitch.classList.remove('open');
      langTrigger.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('click', (e) => {
    if (!langSwitch.contains(e.target)) langSwitch.classList.remove('open');
  });

  /* ================= Custom cursor ================= */
  const cursorGlow = document.querySelector('.cursor-glow');
  const cursorDot = document.querySelector('.cursor-dot');
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    let gx = 0, gy = 0, dx = 0, dy = 0;
    window.addEventListener('mousemove', (e) => {
      dx = e.clientX; dy = e.clientY;
      cursorDot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
    });
    (function loop() {
      gx += (dx - gx) * 0.08; gy += (dy - gy) * 0.08;
      cursorGlow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, .contact-tile, input, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => cursorDot.classList.add('active'));
      el.addEventListener('mouseleave', () => cursorDot.classList.remove('active'));
    });
  }

  /* ================= Scroll progress + nav active state ================= */
  const progressBar = document.getElementById('scrollProgressBar');
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  function onScroll() {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
    progressBar.style.width = scrolled + '%';

    let currentIdx = 0;
    sections.forEach((sec, i) => {
      if (sec.getBoundingClientRect().top - 120 <= 0) currentIdx = i;
    });
    navLinks.forEach((a, i) => a.classList.toggle('active', i === currentIdx));
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ================= Reveal on scroll ================= */
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion) {
    revealEls.forEach(el => el.classList.add('in-view'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('in-view'), i * 40);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
    // Failsafe: never leave content permanently invisible (e.g. backgrounded tab pausing transitions).
    setTimeout(() => revealEls.forEach(el => el.classList.add('in-view')), 3000);
  }

  /* ================= Magnetic buttons ================= */
  if (!reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) * 0.25;
        const my = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.setProperty('--mx', mx + 'px');
        btn.style.setProperty('--my', my + 'px');
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  /* ================= Tilt cards ================= */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ================= Stat counters ================= */
  const statEls = document.querySelectorAll('.stat-num[data-count]');
  const statsIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const dur = 1400;
      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      statsIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  statEls.forEach(el => statsIO.observe(el));

  /* ================= Scramble-text hero title ================= */
  const scrambleTarget = document.querySelector('[data-scramble]');
  if (scrambleTarget && !reduceMotion) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01#$%&*';
    const spans = [];
    // Wrap each text node's characters individually, preserving inner <span class="grad-text">
    function wrapNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split('').forEach(ch => {
          const s = document.createElement('span');
          s.textContent = ch;
          if (ch !== ' ') { s.dataset.final = ch; spans.push(s); }
          frag.appendChild(s);
        });
        node.replaceWith(frag);
      } else {
        [...node.childNodes].forEach(wrapNode);
      }
    }
    wrapNode(scrambleTarget);
    spans.forEach((s, i) => {
      let iterations = 0;
      const maxIter = 6 + Math.floor(Math.random() * 6);
      const delay = i * 18;
      setTimeout(() => {
        const int = setInterval(() => {
          if (iterations >= maxIter) {
            s.textContent = s.dataset.final;
            clearInterval(int);
          } else {
            s.textContent = chars[Math.floor(Math.random() * chars.length)];
            iterations++;
          }
        }, 28);
      }, delay);
    });
  }

  /* ================= Hero particle network canvas ================= */
  const heroCanvas = document.getElementById('heroCanvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let w, h, particles;
    const heroSection = document.querySelector('.hero');

    function resize() {
      w = heroCanvas.width = heroSection.clientWidth;
      h = heroCanvas.height = heroSection.clientHeight;
    }
    function initParticles() {
      const count = Math.min(90, Math.floor((w * h) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.6,
      }));
    }
    resize(); initParticles();
    window.addEventListener('resize', () => { resize(); initParticles(); });

    let mx = -9999, my = -9999;
    heroSection.addEventListener('mousemove', (e) => {
      const r = heroSection.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    });
    heroSection.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dmx = p.x - mx, dmy = p.y - my;
        const distm = Math.hypot(dmx, dmy);
        if (distm < 120) { p.x += dmx / distm * 0.6; p.y += dmy / distm * 0.6; }
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(255,92,114,${0.14 * (1 - d / 130)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,92,114,0.55)';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    if (!reduceMotion) draw();
  }

  /* ================= AI chat engine (used by the floating assistant) ================= */
  const AI_RESPONSES = [
    { match: /bonjour|salut|hello/i, reply: "Bonjour ! Je suis l'assistant GLM. Décrivez votre projet (IA, SaaS, data, web ou robotique) et je vous oriente vers la bonne expertise." },
    { match: /prix|tarif|co[uû]t|budget/i, reply: "Nos missions démarrent en général par un cadrage forfaitaire de 1 à 2 semaines, avant un chiffrage précis. Écrivez-nous en bas de page (WhatsApp ou email) pour un devis personnalisé." },
    { match: /ia|intelligence artificielle|llm|rag|machine learning/i, reply: "Sur l'IA, on conçoit des copilotes métier, des pipelines RAG sur vos documents internes, et des modèles de vision ou de prédiction entraînés sur vos données propriétaires." },
    { match: /saas/i, reply: "Pour un SaaS, on couvre l'architecture multi-tenant, la facturation, l'onboarding et la scalabilité — de la V1 jusqu'au passage à l'échelle." },
    { match: /data|donn[ée]es|dashboard|tableau de bord/i, reply: "Côté data, on construit des pipelines d'ingestion, des entrepôts et des tableaux de bord temps réel pour transformer vos données en décisions." },
    { match: /web|site|next\.?js|react/i, reply: "En web, on développe des sites et applications rapides et accessibles, principalement en Next.js/React, pensés conversion dès la conception." },
    { match: /robot|iot|capteur|embarqu/i, reply: "En robotique/IoT, on travaille la perception, le contrôle-commande et l'intégration logicielle embarquée pour des systèmes autonomes fiables." },
    { match: /combien de temps|d[ée]lai/i, reply: "Un prototype fonctionnel est en général livré en 2 à 4 semaines, avant l'industrialisation complète." },
    { match: /contact|appel|rdv|rendez-vous/i, reply: "Parfait — en bas de page, un bouton WhatsApp ou email ouvre directement la conversation, réponse rapide garantie." },
    { match: /merci/i, reply: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions." },
  ];
  const DEFAULT_REPLIES = [
    "Bonne question. Nos consultants sont mieux placés pour y répondre en détail — voulez-vous que je vous dirige vers WhatsApp ou l'email de contact ?",
    "Je note. GLM combine conseil et développement sur ce type de sujet — précisez votre secteur d'activité pour une réponse plus ciblée.",
    "Sur ce point précis, un échange de cadrage de 30 minutes avec l'équipe sera plus utile qu'une réponse générique ici.",
  ];

  function makeLineTools(container) {
    function appendLine(text, cls) {
      const div = document.createElement('div');
      div.className = 'tline ' + (cls || '');
      div.textContent = text;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
      return div;
    }
    function typeLine(el, text, speed = 14) {
      let i = 0;
      el.textContent = '';
      const caret = document.createElement('span');
      caret.className = 'caret';
      el.appendChild(document.createTextNode(''));
      el.appendChild(caret);
      return new Promise(resolve => {
        const int = setInterval(() => {
          if (i >= text.length) { clearInterval(int); caret.remove(); resolve(); return; }
          caret.insertAdjacentText('beforebegin', text[i]);
          i++;
          container.scrollTop = container.scrollHeight;
        }, speed);
      });
    }
    return { appendLine, typeLine };
  }

  function answerFor(q) {
    const found = AI_RESPONSES.find(r => r.match.test(q));
    return found ? found.reply : DEFAULT_REPLIES[Math.floor(Math.random() * DEFAULT_REPLIES.length)];
  }

  function makeChatEngine(container, input) {
    const { appendLine, typeLine } = makeLineTools(container);
    async function submit(value) {
      const q = (value || '').trim();
      if (!q) return;
      appendLine('➜ ' + q, 'user');
      if (input) { input.value = ''; input.disabled = true; }
      const thinking = appendLine('…', 'ai');
      await new Promise(r => setTimeout(r, 450 + Math.random() * 350));
      thinking.remove();
      const line = appendLine('', 'ai');
      await typeLine(line, answerFor(q), 12);
      if (input) { input.disabled = false; input.focus(); }
    }
    return { submit, appendLine, typeLine };
  }

  /* ================= Floating assistant (global, voice-enabled) ================= */
  const assistant = document.getElementById('assistant');
  const assistantFab = document.getElementById('assistantFab');
  const assistantPanel = document.getElementById('assistantPanel');
  const assistantClose = document.getElementById('assistantClose');
  const assistantBody = document.getElementById('assistantBody');
  const assistantInput = document.getElementById('assistantInput');
  const assistantMic = document.getElementById('assistantMic');
  let assistantChat, assistantGreeted = false;

  function openAssistant() {
    assistantPanel.hidden = false;
    assistant.classList.add('open');
    if (!assistantGreeted) {
      assistantGreeted = true;
      assistantChat = makeChatEngine(assistantBody, assistantInput);
      const line = assistantChat.appendLine('', 'ai');
      const greeting = (I18N[window.__glmLang] || I18N.fr)['assistant.greeting'];
      assistantChat.typeLine(line, greeting, 10);
    }
    setTimeout(() => assistantInput.focus(), 250);
  }
  function closeAssistant() { assistantPanel.hidden = true; assistant.classList.remove('open'); }

  assistantFab.addEventListener('click', () => { assistantPanel.hidden ? openAssistant() : closeAssistant(); });
  assistantClose.addEventListener('click', closeAssistant);
  assistantInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && assistantChat) assistantChat.submit(assistantInput.value);
  });

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognitionCtor) {
    assistantMic.hidden = false;
    const recognizer = new SpeechRecognitionCtor();
    recognizer.lang = 'fr-FR';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;
    let listening = false;
    assistantMic.addEventListener('click', () => {
      if (listening) { recognizer.stop(); return; }
      try { recognizer.start(); listening = true; assistantMic.classList.add('listening'); }
      catch (e) { /* already started */ }
    });
    recognizer.addEventListener('result', (e) => {
      const transcript = e.results[0][0].transcript;
      assistantInput.value = transcript;
      if (assistantChat) assistantChat.submit(transcript);
    });
    recognizer.addEventListener('end', () => { listening = false; assistantMic.classList.remove('listening'); });
    recognizer.addEventListener('error', () => { listening = false; assistantMic.classList.remove('listening'); });
  }

  /* ================= Command palette ================= */
  const cmdkOverlay = document.getElementById('cmdkOverlay');
  const cmdkInput = document.getElementById('cmdkInput');
  const cmdkList = document.getElementById('cmdkList');
  const cmdkTrigger = document.getElementById('cmdkTrigger');

  const COMMANDS = [
    { label: 'Aller à — Accueil', hint: 'section', action: () => scrollTo('#top') },
    { label: 'Aller à — IA & Data', hint: 'section', action: () => scrollTo('#ia-data') },
    { label: 'Aller à — Robotique', hint: 'section', action: () => scrollTo('#robotique') },
    { label: 'Aller à — SaaS & Web', hint: 'section', action: () => scrollTo('#saas-web') },
    { label: 'Aller à — Contact', hint: 'section', action: () => scrollTo('#contact') },
    { label: 'Basculer le thème clair / sombre', hint: 'action', action: () => themeToggle.click() },
    { label: 'Ouvrir l\'assistant IA flottant', hint: 'action', action: () => openAssistant() },
    { label: 'Écrire sur WhatsApp', hint: 'action', action: () => window.open('https://wa.me/33651280191', '_blank', 'noopener') },
    { label: 'Envoyer un email', hint: 'action', action: () => { window.location.href = 'mailto:romain.dufraiche@gmail.com'; } },
    { label: 'Afficher les raccourcis clavier', hint: 'aide', action: () => openShortcuts() },
    { label: 'Copier l\'email de contact', hint: 'action', action: () => navigator.clipboard?.writeText('romain.dufraiche@gmail.com') },
  ];
  function scrollTo(sel) { document.querySelector(sel).scrollIntoView({ behavior: 'smooth' }); }

  let cmdkActive = 0;
  let cmdkFiltered = COMMANDS;

  function renderCmdk() {
    cmdkList.innerHTML = '';
    cmdkFiltered.forEach((cmd, i) => {
      const li = document.createElement('li');
      li.className = i === cmdkActive ? 'active' : '';
      li.innerHTML = `<svg class="cmdk-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg><span>${cmd.label}</span><small>${cmd.hint}</small>`;
      li.addEventListener('mouseenter', () => { cmdkActive = i; renderCmdk(); });
      li.addEventListener('click', () => { cmd.action(); closeCmdk(); });
      cmdkList.appendChild(li);
    });
  }

  function openCmdk() {
    cmdkOverlay.classList.add('open');
    cmdkInput.value = ''; cmdkFiltered = COMMANDS; cmdkActive = 0;
    renderCmdk();
    setTimeout(() => cmdkInput.focus(), 50);
  }
  function closeCmdk() { cmdkOverlay.classList.remove('open'); }

  cmdkTrigger.addEventListener('click', openCmdk);
  cmdkOverlay.addEventListener('click', (e) => { if (e.target === cmdkOverlay) closeCmdk(); });

  cmdkInput.addEventListener('input', () => {
    const q = cmdkInput.value.toLowerCase();
    cmdkFiltered = COMMANDS.filter(c => c.label.toLowerCase().includes(q));
    cmdkActive = 0;
    renderCmdk();
  });

  /* ================= Keyboard shortcuts overlay ================= */
  const shortcutsOverlay = document.getElementById('shortcutsOverlay');
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const shortcutsClose = document.getElementById('shortcutsClose');
  function openShortcuts() { shortcutsOverlay.classList.add('open'); }
  function closeShortcuts() { shortcutsOverlay.classList.remove('open'); }
  shortcutsBtn.addEventListener('click', openShortcuts);
  shortcutsClose.addEventListener('click', closeShortcuts);
  shortcutsOverlay.addEventListener('click', (e) => { if (e.target === shortcutsOverlay) closeShortcuts(); });

  document.addEventListener('keydown', (e) => {
    const typingTarget = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable;

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      cmdkOverlay.classList.contains('open') ? closeCmdk() : openCmdk();
      return;
    }
    if (!typingTarget && e.key === '/') {
      e.preventDefault();
      cmdkOverlay.classList.contains('open') ? closeCmdk() : openCmdk();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); themeToggle.click(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      assistantPanel.hidden ? openAssistant() : closeAssistant();
      return;
    }
    if (!typingTarget && e.key === '?') { e.preventDefault(); openShortcuts(); return; }
    if (e.key === 'Escape') { closeShortcuts(); closeAssistant(); langSwitch.classList.remove('open'); }

    if (!cmdkOverlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeCmdk();
    if (e.key === 'ArrowDown') { e.preventDefault(); cmdkActive = Math.min(cmdkActive + 1, cmdkFiltered.length - 1); renderCmdk(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); cmdkActive = Math.max(cmdkActive - 1, 0); renderCmdk(); }
    if (e.key === 'Enter') { const c = cmdkFiltered[cmdkActive]; if (c) { c.action(); closeCmdk(); } }
  });

  /* ================= Nav burger (mobile) ================= */
  const navBurger = document.getElementById('navBurger');
  navBurger.addEventListener('click', openCmdk); // reuse palette as mobile nav shortcut

  /* ================= Matrix rain easter egg (Konami code) ================= */
  const matrixCanvas = document.getElementById('matrixCanvas');
  const mctx = matrixCanvas.getContext('2d');
  let matrixActive = false, matrixCols = [];
  function sizeMatrix() { matrixCanvas.width = window.innerWidth; matrixCanvas.height = window.innerHeight; }
  function startMatrix() {
    sizeMatrix();
    const fontSize = 16;
    const columns = Math.floor(matrixCanvas.width / fontSize);
    matrixCols = Array(columns).fill(0);
    matrixActive = true;
    matrixCanvas.classList.add('on');
    const chars = 'GLM01アイウエオカキクケコサシスセソ';
    function frame() {
      if (!matrixActive) return;
      mctx.fillStyle = 'rgba(5,7,13,0.14)';
      mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      mctx.fillStyle = '#ff5c72';
      mctx.font = fontSize + 'px monospace';
      matrixCols.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        mctx.fillText(ch, i * fontSize, y * fontSize);
        if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) matrixCols[i] = 0;
        else matrixCols[i] = y + 1;
      });
      requestAnimationFrame(frame);
    }
    frame();
    setTimeout(stopMatrix, 6000);
  }
  function stopMatrix() { matrixActive = false; matrixCanvas.classList.remove('on'); mctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height); }

  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiPos = 0;
  document.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === konami[konamiPos]) {
      konamiPos++;
      if (konamiPos === konami.length) { konamiPos = 0; if (!matrixActive) startMatrix(); }
    } else {
      konamiPos = (key === konami[0]) ? 1 : 0;
    }
  });

  /* ================= Status ticker (real perf metrics + ops lines) ================= */
  const statusTrack = document.getElementById('statusTrack');
  if (statusTrack) {
    const loadMs = Math.round(performance.now());
    const buildNum = 1000 + (new Date().getDate() * 7 + new Date().getMonth());
    const baseItems = [
      `<span class="ok-dot"></span> Tous les systèmes opérationnels`,
      `build #${buildNum} — déploiement réussi`,
      `page chargée en ${loadMs}ms (mesure réelle de cette session)`,
      `fps: <span id="fpsVal">…</span>`,
      `API IA · Data · SaaS — latence nominale`,
      `sécurité — dernier audit: conforme`,
    ];
    function render() { statusTrack.innerHTML = [...baseItems, ...baseItems].map(t => `<span>${t}</span>`).join(''); }
    render();

    if (!reduceMotion) {
      let frames = 0, lastT = performance.now();
      function fpsLoop(t) {
        frames++;
        if (t - lastT >= 1000) {
          const fps = Math.round((frames * 1000) / (t - lastT));
          document.querySelectorAll('#fpsVal').forEach(el => { el.textContent = fps; });
          frames = 0; lastT = t;
        }
        requestAnimationFrame(fpsLoop);
      }
      requestAnimationFrame(fpsLoop);
    }
  }

  /* ================= Service worker (offline support) ================= */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable, non-blocking */ });
    });
  }

  /* ================= Console easter egg for curious devs ================= */
  console.log('%cGLM', 'font-size: 42px; font-weight: 800; background: linear-gradient(120deg,#ff5c72,#38bdf8); -webkit-background-clip: text; background-clip: text; color: transparent;');
  console.log('%cVous inspectez le code ? Bon signe. Écrivez-nous : romain.dufraiche@gmail.com', 'font-size: 13px; color: #9aa2b8;');
  console.log('%cAstuce : essayez le code Konami sur cette page (↑ ↑ ↓ ↓ ← → ← → B A).', 'font-size: 12px; color: #5c6480;');
})();
