;(() => {
  /* ============================================================
     FexOsint — Premium Interactive Frontend Script
     v3 — Integrated Three.js Flowing Wave Shader
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
    let last = 0
    let pendingArgs = null
    let timer = null
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
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
  const rand = (min, max) => min + Math.random() * (max - min)

  /* ---------- HEADER SCROLL STATE ---------- */
  if (header) {
    const onScrollHeader = throttle(() => {
      header.classList.toggle('scrolled', window.scrollY > 20)
    }, 100)
    window.addEventListener('scroll', onScrollHeader, { passive: true })
    onScrollHeader()
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
    const onScrollTop = throttle(() => {
      backToTop.classList.toggle('visible', window.scrollY > 600)
    }, 100)
    window.addEventListener('scroll', onScrollTop, { passive: true })
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    })
  }

  /* ---------- SCROLL REVEAL (with stagger) ---------- */
  const revealElements = document.querySelectorAll('.reveal')
  if (revealElements.length) {
    const groups = new Map()
    revealElements.forEach(el => {
      const parent = el.parentElement
      if (!groups.has(parent)) groups.set(parent, [])
      groups.get(parent).push(el)
    })
    groups.forEach(siblings => {
      siblings.forEach((el, i) => {
        el.style.transitionDelay = prefersReducedMotion ? '0ms' : `${Math.min(i * 80, 400)}ms`
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
      } catch {
        return null
      }
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
        color: 0x3b82f6,
        fields: [
          { name: 'Discord', value: data.discord, inline: true },
          { name: 'Language', value: data.language, inline: true },
          { name: 'Budget', value: `${data.budget} GEL`, inline: true },
          { name: 'Description', value: data.description || 'No description provided' },
          { name: 'IP Address', value: ip || 'Not available', inline: false }
        ],
        footer: { text: 'FexOsint Request Form' },
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

  /* ---------- HERO INTERACTIVE BACKGROUND (THREE.JS SHADER) ---------- */
  if (canvas && heroSection && !prefersReducedMotion && typeof THREE !== 'undefined') {
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    } catch (err) {
      console.error('WebGL not supported', err)
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const clock = new THREE.Clock()

    // Shaders
    const vertexShader = `
      varying vec2 vTextureCoord;
      void main() {
        vTextureCoord = uv;
        gl_Position = vec4(position, 1.0);
      }
    `

    // Premium Indigo/Cyan themed flowing wave shader
    const fragmentShader = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      varying vec2 vTextureCoord;

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

        for(float i = 1.0; i < 10.0; i++){
          uv.x += 0.6 / i * cos(i * 2.5 * uv.y + iTime);
          uv.y += 0.6 / i * cos(i * 1.5 * uv.x + iTime);
        }
        
        // Match CSS variables: Indigo (#6366f1) and Cyan (#22d3ee)
        vec3 colorA = vec3(0.38, 0.40, 0.94); 
        vec3 colorB = vec3(0.13, 0.82, 0.93); 
        vec3 finalColor = mix(colorA, colorB, abs(sin(iTime * 0.2 + uv.x)));
        
        fragColor = vec4(finalColor / abs(sin(iTime - uv.y - uv.x)), 1.0);
      }

      void main() {
        vec4 color;
        mainImage(color, vTextureCoord * iResolution);
        gl_FragColor = color;
      }
    `

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2() }
    }

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })
    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const onResize = () => {
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

    // Performance optimization: pause when scrolled out of view
    const visibilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        running = entry.isIntersecting
        if (running && !rafId) rafId = requestAnimationFrame(animate)
        if (!running && rafId) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
      })
    }, { threshold: 0 })
    visibilityObserver.observe(heroSection)

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      } else if (!document.hidden && running && !rafId) {
        rafId = requestAnimationFrame(animate)
      }
    })

    let resizeTimer
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(onResize, 150)
    })

    onResize()
    rafId = requestAnimationFrame(animate)
  }

  /* ---------- HERO PARALLAX ON MOUSE MOVE ---------- */
  if (heroContent && heroSection && !prefersReducedMotion) {
    const parallaxStrength = 14
    let rafId = null
    let targetX = 0, targetY = 0
    let currentX = 0, currentY = 0

    const animate = () => {
      currentX = lerp(currentX, targetX, 0.12)
      currentY = lerp(currentY, targetY, 0.12)
      heroContent.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        rafId = requestAnimationFrame(animate)
      } else {
        rafId = null
      }
    }

    heroSection.addEventListener('mousemove', throttle(e => {
      const rect = heroSection.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      targetX = ((x / rect.width) - 0.5) * parallaxStrength
      targetY = ((y / rect.height) - 0.5) * parallaxStrength
      if (!rafId) rafId = requestAnimationFrame(animate)
    }, 16))

    heroSection.addEventListener('mouseleave', () => {
      targetX = 0
      targetY = 0
      if (!rafId) rafId = requestAnimationFrame(animate)
    })
  }

  /* ---------- CARD TILT + GLOW ON HOVER ---------- */
  const addTiltEffect = selector => {
    document.querySelectorAll(selector).forEach(card => {
      card.style.transformStyle = 'preserve-3d'
      card.style.willChange = 'transform'
      let rafId = null

      card.addEventListener('mousemove', e => {
        if (rafId) cancelAnimationFrame(rafId)

        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const centerX = rect.width / 2
          const centerY = rect.height / 2

          const rotateY = ((x - centerX) / centerX) * 6
          const rotateX = -((y - centerY) / centerY) * 6
          const shadowX = (x - centerX) / 15
          const shadowY = (y - centerY) / 15

          card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`
          card.style.boxShadow = `${shadowX}px ${shadowY}px 25px rgba(0,0,0,0.2), 0 0 0 1px rgba(59,130,246,0.15)`

          const glow = card.querySelector('.card-glow')
          if (glow) {
            glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(59,130,246,0.15), transparent 60%)`
          }
        })
      })

      card.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId)
        card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg)'
        card.style.boxShadow = ''
        card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.5s ease'
        const glow = card.querySelector('.card-glow')
        if (glow) glow.style.background = ''
      })

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'none'
      })
    })
  }

  addTiltEffect('.service-card')
  addTiltEffect('.tool-card')
  addTiltEffect('.discord-card')
  addTiltEffect('.why-item')

  /* ---------- CLICK RIPPLE ON INTERACTIVE ELEMENTS ---------- */
  const addRipple = selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.position = el.style.position || 'relative'
      el.style.overflow = 'hidden'
      el.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect()
        const ripple = document.createElement('span')
        const size = Math.max(rect.width, rect.height) * 2
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

