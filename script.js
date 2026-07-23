;(() => {
  /* ============================================================
     Premium Interactive Script — Enhanced Three.js + Smooth UX
     ============================================================ */
  'use strict'

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ---------- DOM REFERENCES ---------- */
  const navToggle = document.getElementById('nav-toggle')
  const nav = document.querySelector('.nav-links')
  const navLinks = document.querySelectorAll('.nav-link')
  const backToTop = document.getElementById('back-to-top')
  const header = document.getElementById('header')
  const heroSection = document.querySelector('.hero')
  const heroContent = document.querySelector('.hero-content')
  const canvas = document.getElementById('hero-canvas')
  const form = document.getElementById('request-form')
  const successDiv = document.getElementById('form-success')

  /* ---------- UTILITIES ---------- */
  const throttle = (fn, delay) => {
    let last = 0, pendingArgs = null, timer = null
    return (...args) => {
      const now = Date.now()
      const remaining = delay - (now - last)
      if (remaining <= 0) {
        last = now
        fn(...args)
      } else {
        pendingArgs = args
        clearTimeout(timer)
        timer = setTimeout(() => {
          last = Date.now()
          fn(...pendingArgs)
        }, remaining)
      }
    }
  }

  const lerp = (a, b, t) => a + (b - a) * t
  const rand = (min, max) => min + Math.random() * (max - min)

  /* ---------- HEADER SCROLL STATE ---------- */
  if (header) {
    const updateHeader = throttle(() => {
      header.classList.toggle('scrolled', window.scrollY > 20)
    }, 100)
    window.addEventListener('scroll', updateHeader, { passive: true })
    updateHeader()
  }

  /* ---------- MOBILE NAVIGATION ---------- */
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('active')
      navToggle.classList.toggle('active', isOpen)
      navToggle.setAttribute('aria-expanded', String(isOpen))
      document.body.classList.toggle('nav-open', isOpen)
    })
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active')
        nav.classList.remove('active')
        navToggle.setAttribute('aria-expanded', 'false')
        document.body.classList.remove('nav-open')
      })
    })
  }

  /* ---------- SMOOTH SCROLL OFFSET ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href')
      if (targetId === '#') return
      const target = document.querySelector(targetId)
      if (!target) return
      e.preventDefault()
      const headerHeight = header?.offsetHeight || 80
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    })
  })

  /* ---------- BACK TO TOP ---------- */
  if (backToTop) {
    const toggleBackToTop = throttle(() => {
      backToTop.classList.toggle('visible', window.scrollY > 600)
    }, 100)
    window.addEventListener('scroll', toggleBackToTop, { passive: true })
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    })
  }

  /* ---------- SCROLL REVEAL (with smooth stagger) ---------- */
  const revealElements = document.querySelectorAll('.reveal')
  if (revealElements.length) {
    const groupMap = new Map()
    revealElements.forEach(el => {
      const parent = el.parentElement
      if (!groupMap.has(parent)) groupMap.set(parent, [])
      groupMap.get(parent).push(el)
    })
    groupMap.forEach(siblings => {
      siblings.forEach((el, i) => {
        el.style.transitionDelay = prefersReducedMotion ? '0ms' : `${Math.min(i * 70, 350)}ms`
      })
    })

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          revealObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    revealElements.forEach(el => revealObserver.observe(el))
  }

  /* ---------- CUSTOM REQUEST FORM ---------- */
  if (form) {
    const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1529042566815678496/Kn9wecDxpo2EYsPrbuTvFB6LC4SiZuvZoZ4xAuemTpl46qr_oe6fLTFhfutaW_U3JDqb'
    const cooldownMsg = document.createElement('div')
    cooldownMsg.className = 'cooldown-msg'
    form.parentNode.insertBefore(cooldownMsg, form)

    const getUserIP = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json')
        const data = await res.json()
        return data.ip
      } catch { return null }
    }

    const checkCooldown = ip => {
      const last = localStorage.getItem(`last_submission_${ip}`)
      return last && (Date.now() - parseInt(last, 10) < 3600000)
    }

    const setCooldown = ip => localStorage.setItem(`last_submission_${ip}`, Date.now().toString())

    const updateCooldownMessage = ip => {
      const last = localStorage.getItem(`last_submission_${ip}`)
      const remaining = 3600000 - (Date.now() - parseInt(last, 10))
      const minutes = Math.ceil(remaining / 60000)
      cooldownMsg.textContent = `⏳ Too many requests. Please wait ${minutes} minute(s) before submitting again.`
      cooldownMsg.classList.add('show')
    }

    const sendToWebhook = async (data, ip) => {
      const embed = {
        title: '🛠️ New Custom Script Request',
        color: 0x6366f1,
        fields: [
          { name: 'Discord', value: data.discord, inline: true },
          { name: 'Language', value: data.language, inline: true },
          { name: 'Budget', value: `${data.budget} GEL`, inline: true },
          { name: 'Description', value: data.description || 'No description provided' },
          { name: 'IP Address', value: ip || 'Not available', inline: false }
        ],
        footer: { text: 'DSevenFex Request Form' },
        timestamp: new Date().toISOString()
      }
      const res = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      })
      if (!res.ok) throw new Error(`Webhook responded with ${res.status}`)
    }

    form.addEventListener('submit', async e => {
      e.preventDefault()
      cooldownMsg.classList.remove('show')

      let isValid = true
      document.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'))

      const discord = document.getElementById('discord')
      const description = document.getElementById('description')
      const language = document.getElementById('language')
      const budget = document.getElementById('budget')

      if (!discord.value.trim()) { discord.closest('.form-group').classList.add('error'); isValid = false }
      if (!description.value.trim()) { description.closest('.form-group').classList.add('error'); isValid = false }
      if (!language.value) { language.closest('.form-group').classList.add('error'); isValid = false }
      const budgetValue = parseFloat(budget.value)
      if (!budget.value || isNaN(budgetValue) || budgetValue < 5) {
        budget.closest('.form-group').classList.add('error')
        isValid = false
      }
      if (!isValid) return

      const submitBtn = form.querySelector('button[type="submit"]')
      const originalHTML = submitBtn.innerHTML
      submitBtn.classList.add('loading')
      submitBtn.disabled = true
      submitBtn.innerHTML = '<span class="spinner"></span> Sending...'

      try {
        const ip = await getUserIP()
        if (ip && checkCooldown(ip)) {
          updateCooldownMessage(ip)
          return
        }
        await sendToWebhook({
          discord: discord.value.trim(),
          description: description.value.trim(),
          language: language.value,
          budget: budgetValue
        }, ip)
        if (ip) setCooldown(ip)
        form.style.display = 'none'
        successDiv.hidden = false
        successDiv.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
        setTimeout(() => {
          form.reset()
          form.style.display = 'flex'
          successDiv.hidden = true
        }, 5000)
      } catch (err) {
        console.error('Submission failed:', err)
        alert('Something went wrong. Please try again or contact us on Discord.')
      } finally {
        submitBtn.classList.remove('loading')
        submitBtn.disabled = false
        submitBtn.innerHTML = originalHTML
      }
    })
  }

  /* ---------- THREE.JS HERO BACKGROUND (Enhanced Wave Shader) ---------- */
  if (canvas && heroSection && !prefersReducedMotion && typeof THREE !== 'undefined') {
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    } catch (e) {
      console.warn('WebGL not supported')
      canvas.style.display = 'none'
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const clock = new THREE.Clock()

    // Enhanced fragment shader with mouse interaction
    const fragmentShader = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      varying vec2 vTextureCoord;

      void main() {
        vec2 uv = vTextureCoord;
        vec2 p = (2.0 * gl_FragCoord.xy - iResolution.xy) / min(iResolution.x, iResolution.y);

        // Mouse influence (soft distortion)
        float mx = iMouse.x > 0.0 ? (iMouse.x / iResolution.x - 0.5) * 2.0 : 0.0;
        float my = iMouse.y > 0.0 ? (iMouse.y / iResolution.y - 0.5) * 2.0 : 0.0;

        for(float i = 1.0; i < 12.0; i++) {
          p.x += 0.7 / i * cos(i * 2.5 * p.y + iTime * 0.3 + i) + mx * 0.05;
          p.y += 0.7 / i * cos(i * 1.8 * p.x + iTime * 0.2 + i) + my * 0.05;
        }

        vec3 indigo = vec3(0.39, 0.40, 0.95);
        vec3 cyan   = vec3(0.15, 0.83, 0.94);
        float blend = abs(sin(iTime * 0.2 + p.x * 0.5)) * abs(cos(iTime * 0.15 + p.y * 0.5));
        vec3 color = mix(indigo, cyan, blend);
        
        // Dynamic alpha based on wave intensity
        float alpha = 0.4 + 0.2 * abs(sin(p.x * 3.0 + iTime)) * abs(cos(p.y * 2.5 + iTime));
        gl_FragColor = vec4(color * alpha, alpha * 0.8);
      }
    `

    const vertexShader = `
      varying vec2 vTextureCoord;
      void main() {
        vTextureCoord = uv;
        gl_Position = vec4(position, 1.0);
      }
    `

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2(-1000, -1000) }
    }

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true })
    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      renderer.setSize(w, h, false)
      uniforms.iResolution.value.set(w, h)
    }

    let running = true
    let rafId = null

    const animate = () => {
      if (!running) return
      uniforms.iTime.value = clock.getElapsedTime()
      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }

    // Pause when hero not visible
    const visibilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        running = entry.isIntersecting
        if (running && !rafId) rafId = requestAnimationFrame(animate)
        if (!running && rafId) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
      })
    }, { threshold: 0.01 })
    visibilityObserver.observe(heroSection)

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      } else if (!document.hidden && running && !rafId) {
        rafId = requestAnimationFrame(animate)
      }
    })

    // Mouse tracking for shader (throttled)
    const updateMouse = throttle(e => {
      const rect = canvas.getBoundingClientRect()
      uniforms.iMouse.value.set(e.clientX - rect.left, e.clientY - rect.top)
    }, 30)
    canvas.addEventListener('mousemove', updateMouse)
    canvas.addEventListener('mouseleave', () => uniforms.iMouse.value.set(-1000, -1000))

    let resizeTimer
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resizeCanvas, 150)
    })

    resizeCanvas()
    rafId = requestAnimationFrame(animate)
  }

  /* ---------- HERO PARALLAX (Mouse + Scroll) ---------- */
  if (heroContent && heroSection && !prefersReducedMotion) {
    let targetX = 0, targetY = 0
    let currentX = 0, currentY = 0
    let rafId = null

    const animateParallax = () => {
      currentX = lerp(currentX, targetX, 0.1)
      currentY = lerp(currentY, targetY, 0.1)
      heroContent.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`
      if (Math.abs(targetX - currentX) > 0.02 || Math.abs(targetY - currentY) > 0.02) {
        rafId = requestAnimationFrame(animateParallax)
      } else {
        rafId = null
      }
    }

    const updateMouse = throttle(e => {
      const rect = heroSection.getBoundingClientRect()
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 18
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 10
      if (!rafId) rafId = requestAnimationFrame(animateParallax)
    }, 16)

    const updateScroll = throttle(() => {
      const scrollY = window.scrollY
      const heroHeight = heroSection.offsetHeight
      const scrolled = Math.min(scrollY / heroHeight, 1)
      targetY = scrolled * 20
      if (!rafId) rafId = requestAnimationFrame(animateParallax)
    }, 16)

    heroSection.addEventListener('mousemove', updateMouse)
    heroSection.addEventListener('mouseleave', () => {
      targetX = 0
      targetY = 0
      if (!rafId) rafId = requestAnimationFrame(animateParallax)
    })
    window.addEventListener('scroll', updateScroll, { passive: true })
    updateScroll()
  }

  /* ---------- CARD TILT + DYNAMIC GLOW ---------- */
  const addCardEffect = selector => {
    document.querySelectorAll(selector).forEach(card => {
      card.style.transformStyle = 'preserve-3d'
      card.style.willChange = 'transform, box-shadow'
      let rafId = null

      card.addEventListener('mousemove', e => {
        if (rafId) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const centerX = rect.width / 2
          const centerY = rect.height / 2

          const rotateY = ((x - centerX) / centerX) * 5
          const rotateX = -((y - centerY) / centerY) * 5
          const shadowX = (x - centerX) / 12
          const shadowY = (y - centerY) / 12

          card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`
          card.style.boxShadow = `${shadowX}px ${shadowY}px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.2)`

          const glow = card.querySelector('.card-glow')
          if (glow) {
            glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(99,102,241,0.2), transparent 60%)`
          }
        })
      })

      card.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId)
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)'
        card.style.boxShadow = ''
        card.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.6s ease'
        const glow = card.querySelector('.card-glow')
        if (glow) glow.style.background = ''
      })

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'none'
      })
    })
  }

  addCardEffect('.service-card')
  addCardEffect('.tool-card')
  addCardEffect('.discord-card')
  addCardEffect('.why-item')

  /* ---------- CLICK RIPPLE ---------- */
  const addRipple = selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (el.dataset.rippleBound) return
      el.dataset.rippleBound = true
      const isBtn = el.classList.contains('btn')
      el.style.position = isBtn ? undefined : 'relative'
      el.style.overflow = isBtn ? undefined : 'hidden'
      el.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height) * 2
        const ripple = document.createElement('span')
        ripple.style.position = 'absolute'
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`
        ripple.style.width = ripple.style.height = `${size}px`
        ripple.style.borderRadius = '50%'
        ripple.style.background = 'rgba(255,255,255,0.35)'
        ripple.style.pointerEvents = 'none'
        ripple.style.transform = 'scale(0)'
        ripple.style.opacity = '1'
        ripple.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out'
        this.appendChild(ripple)
        requestAnimationFrame(() => {
          ripple.style.transform = 'scale(1)'
          ripple.style.opacity = '0'
        })
        setTimeout(() => ripple.remove(), 650)
      })
    })
  }

  addRipple('.btn')
  addRipple('button[type="submit"]')
})()
