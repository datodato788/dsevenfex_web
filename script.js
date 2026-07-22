// script.js

document.addEventListener('DOMContentLoaded', () => {
  // === CONFIGURATION ===
  // Replace with your actual Discord webhook URL
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1529042566815678496/Kn9wecDxpo2EYsPrbuTvFB6LC4SiZuvZoZ4xAuemTpl46qr_oe6fLTFhfutaW_U3JDqb';
 // VINC WEBHOOK GASPAMOS IMIS DEDASHEVECI BIWOO MOGITYAN BOZI DEDA TU GASPAMAV
  // === MOBILE NAVIGATION ===
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-link');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    nav.classList.toggle('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      nav.classList.remove('active');
    });
  });

  // === SMOOTH SCROLL OFFSET FOR FIXED HEADER ===
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const headerHeight = document.getElementById('header')?.offsetHeight || 70;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });

  // === BACK TO TOP BUTTON ===
  const backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // === SCROLL REVEAL ===
  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => observer.observe(el));

  // === CUSTOM REQUEST FORM ===
  const form = document.getElementById('request-form');
  const successDiv = document.getElementById('form-success');
  const cooldownMsg = document.createElement('div');
  cooldownMsg.className = 'cooldown-msg';
  form.parentNode.insertBefore(cooldownMsg, form);

  // Get user IP
  async function getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (err) {
      console.error('IP fetch failed:', err);
      return null;
    }
  }

  // Cooldown check (1 hour)
  function checkCooldown(ip) {
    const key = `last_submission_${ip}`;
    const lastTime = localStorage.getItem(key);
    if (!lastTime) return false;
    const elapsed = Date.now() - parseInt(lastTime, 10);
    return elapsed < 3600000;
  }

  function setCooldown(ip) {
    const key = `last_submission_${ip}`;
    localStorage.setItem(key, Date.now().toString());
  }

  function updateCooldownMessage(ip) {
    const key = `last_submission_${ip}`;
    const lastTime = localStorage.getItem(key);
    const remaining = 3600000 - (Date.now() - parseInt(lastTime, 10));
    const minutes = Math.ceil(remaining / 60000);
    cooldownMsg.textContent = `⏳ Too many requests. Please wait ${minutes} minute(s) before submitting again.`;
    cooldownMsg.classList.add('show');
  }

  // Send to Discord webhook (IP included)
  async function sendToWebhook(data, ip) {
    const embed = {
      title: '🛠️ New Custom Script Request',
      color: 0x00ff88,
      fields: [
        { name: 'Discord', value: data.discord, inline: true },
        { name: 'Language', value: data.language, inline: true },
        { name: 'Budget', value: `${data.budget} GEL`, inline: true },
        { name: 'Description', value: data.description || 'No description provided' },
        { name: 'IP Address', value: ip || 'Not available', inline: false }
      ],
      footer: { text: 'DSevenFex Request Form' },
      timestamp: new Date().toISOString()
    };

    const payload = { embeds: [embed] };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}`);
    }
    return response;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    cooldownMsg.classList.remove('show');

    // Validate fields
    let isValid = true;
    document.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));

    const discord = document.getElementById('discord');
    if (!discord.value.trim()) {
      discord.closest('.form-group').classList.add('error');
      isValid = false;
    }

    const description = document.getElementById('description');
    if (!description.value.trim()) {
      description.closest('.form-group').classList.add('error');
      isValid = false;
    }

    const language = document.getElementById('language');
    if (!language.value) {
      language.closest('.form-group').classList.add('error');
      isValid = false;
    }

    const budget = document.getElementById('budget');
    const budgetValue = parseFloat(budget.value);
    if (!budget.value || isNaN(budgetValue) || budgetValue < 5) {
      budget.closest('.form-group').classList.add('error');
      isValid = false;
    }

    if (!isValid) return;

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

    try {
      // Fetch IP once, then use it for cooldown and webhook
      const ip = await getUserIP();

      // Check cooldown based on IP
      if (ip && checkCooldown(ip)) {
        updateCooldownMessage(ip);
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = 'Send Request';
        return;
      }

      const formData = {
        discord: discord.value.trim(),
        description: description.value.trim(),
        language: language.value,
        budget: budgetValue
      };

      // Send to Discord with IP
      await sendToWebhook(formData, ip);

      // Set cooldown after successful send
      if (ip) setCooldown(ip);

      // Success UI
      form.style.display = 'none';
      successDiv.hidden = false;
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        form.reset();
        form.style.display = 'flex';
        successDiv.hidden = true;
      }, 5000);

    } catch (err) {
      console.error('Submission error:', err);
      alert('Something went wrong. Please try again later or contact us on Discord.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.innerHTML = 'Send Request';
    }
  });

  // === HERO CANVAS BACKGROUND ===
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let animationId;
    let dots = [];
    const dotCount = 120;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initDots();
    };

    const initDots = () => {
      dots = [];
      for (let i = 0; i < dotCount; i++) {
        dots.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.15,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
      dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fill();

        dot.x += dot.speedX;
        dot.y += dot.speedY;

        if (dot.x < 0) dot.x = canvas.width;
        if (dot.x > canvas.width) dot.x = 0;
        if (dot.y < 0) dot.y = canvas.height;
        if (dot.y > canvas.height) dot.y = 0;
      });

      // Draw connections
      dots.forEach((a, i) => {
        dots.slice(i + 1).forEach(b => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(0, 255, 136, ${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
  }
});
