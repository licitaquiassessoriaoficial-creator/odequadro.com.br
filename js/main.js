// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', function() {
  // Hero video management
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    // Fallback para quando o vídeo não carrega
    heroVideo.addEventListener('error', function() {
      console.log('Vídeo não pôde ser carregado, usando imagem de fallback');
      heroVideo.style.display = 'none';
    });
    
    // Otimização para dispositivos móveis
    if (window.innerWidth <= 768) {
      heroVideo.style.display = 'none';
    }
    
    // Pausa o vídeo quando não está visível (economia de recursos)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          heroVideo.play();
        } else {
          heroVideo.pause();
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(heroVideo);
  }

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navLinks.classList.toggle('active');
      
      // Update button text
      navToggle.textContent = isExpanded ? 'Menu' : 'Fechar';
    });
    
    // Close menu when clicking on a link
    navLinks.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.textContent = 'Menu';
      }
    });
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Cookie notice functionality
  const btnAccept = document.querySelector('.btn-accept');
  const btnReject = document.querySelector('.btn-reject');
  const cookieNotice = document.querySelector('.cookie-notice');
  
  if (btnAccept && cookieNotice) {
    btnAccept.addEventListener('click', function() {
      cookieNotice.style.display = 'none';
      localStorage.setItem('cookieConsent', 'accepted');
    });
  }
  
  if (btnReject && cookieNotice) {
    btnReject.addEventListener('click', function() {
      cookieNotice.style.display = 'none';
      localStorage.setItem('cookieConsent', 'rejected');
    });
  }
  
  // Check if user has already made a cookie choice
  if (localStorage.getItem('cookieConsent') && cookieNotice) {
    cookieNotice.style.display = 'none';
  }
  
  // Enhanced intersection observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const fadeObserver = new IntersectionObserver(function(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        entry.unobserve && fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements for staggered animation
  document.querySelectorAll('.section, .segment, .cert, .news-card, .stat').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
    fadeObserver.observe(el);
  });
  
  // Hover effects for interactive elements
  document.querySelectorAll('.btn, .segment, .cert').forEach(el => {
    el.addEventListener('mouseenter', function() {
      this.style.transform = this.style.transform + ' scale(1.02)';
    });
    
    el.addEventListener('mouseleave', function() {
      this.style.transform = this.style.transform.replace(' scale(1.02)', '');
    });
  });
  
  // Enhanced scroll effects
  let ticking = false;
  
  function updateScrollEffects() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const header = document.querySelector('.site-header');
    
    // Header scroll effect
    if (header) {
      if (scrolled > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
    
    // Parallax effect for hero
    if (hero) {
      hero.style.transform = `translateY(${scrolled * 0.2}px)`;
    }
    
    ticking = false;
  }
  
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateScrollEffects);
      ticking = true;
    }
  });
  
  // Enhanced back to top functionality
  const backToTop = document.createElement('button');
  backToTop.innerHTML = '↑';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Voltar ao topo');
  backToTop.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2EB85C 0%, #27AE60 100%);
    color: white;
    border: none;
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1000;
    box-shadow: 0 8px 25px rgba(46, 184, 92, 0.3);
  `;
  
  document.body.appendChild(backToTop);
  
  backToTop.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  backToTop.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(0) scale(1.1)';
    this.style.boxShadow = '0 12px 35px rgba(46, 184, 92, 0.4)';
  });
  
  backToTop.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
    this.style.boxShadow = '0 8px 25px rgba(46, 184, 92, 0.3)';
  });
  
  // Show/hide back to top button with smooth animation
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 400) {
      backToTop.style.opacity = '1';
      backToTop.style.transform = 'translateY(0) scale(1)';
    } else {
      backToTop.style.opacity = '0';
      backToTop.style.transform = 'translateY(20px) scale(0.8)';
    }
  });
  
  // Add loading animation
  window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Animate hero elements sequentially
    const heroElements = document.querySelectorAll('.hero h1, .hero p, .stats');
    heroElements.forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 200);
    });
  });

  // Form handling
  const contactForm = document.querySelector('.contact-form');
  const newsletterForm = document.querySelector('.newsletter-form');

  // Contact form handling
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent default form submission
      
      const submitBtn = this.querySelector('#submit-btn');
      const formData = new FormData(this);
      
      // Show loading state
      submitBtn.classList.add('loading');
      
      // Basic validation
      const requiredFields = this.querySelectorAll('[required]');
      let isValid = true;
      
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = '#dc3545';
          field.style.borderWidth = '2px';
        } else {
          field.style.borderColor = '#28a745';
          field.style.borderWidth = '2px';
        }
      });
      
      if (!isValid) {
        submitBtn.classList.remove('loading');
        showFormMessage('Por favor, preencha todos os campos obrigatórios.', 'error', contactForm);
        return;
      }
      
      // Email validation
      const emailField = this.querySelector('[type="email"]');
      if (emailField && !isValidEmail(emailField.value)) {
        submitBtn.classList.remove('loading');
        emailField.style.borderColor = '#dc3545';
        emailField.style.borderWidth = '2px';
        showFormMessage('Por favor, insira um e-mail válido.', 'error', contactForm);
        return;
      }

      // Submit to Formspree
      fetch('https://formspree.io/f/movyxqku', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      })
      .then(response => {
        if (response.ok) {
          submitBtn.classList.remove('loading');
          showFormMessage('Mensagem enviada com sucesso!', 'success', contactForm);
          this.reset();
          // Optional: redirect to thank you page
          setTimeout(() => {
            window.location.href = 'obrigado.html';
          }, 2000);
        } else {
          throw new Error('Erro no envio');
        }
      })
      .catch((error) => {
        submitBtn.classList.remove('loading');
        showFormMessage('Erro ao enviar mensagem. Tente novamente.', 'error', contactForm);
      });
    });
  }

  // Newsletter form handling
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent default form submission
      
      const submitBtn = this.querySelector('#newsletter-btn');
      const emailField = this.querySelector('[type="email"]');
      const formData = new FormData(this);
      
      // Show loading state
      submitBtn.classList.add('loading');
      
      // Email validation
      if (!emailField.value.trim() || !isValidEmail(emailField.value)) {
        submitBtn.classList.remove('loading');
        emailField.style.borderColor = '#dc3545';
        emailField.style.borderWidth = '2px';
        showFormMessage('Por favor, insira um e-mail válido.', 'error', newsletterForm);
        return;
      } else {
        emailField.style.borderColor = '#28a745';
        emailField.style.borderWidth = '2px';
      }

      // Submit to Formspree (mesmo endpoint, você pode criar outro se quiser separar)
      fetch('https://formspree.io/f/movyxqku', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailField.value,
          form_type: 'newsletter'
        })
      })
      .then(response => {
        if (response.ok) {
          submitBtn.classList.remove('loading');
          showFormMessage('Inscrição realizada com sucesso!', 'success', newsletterForm);
          this.reset();
        } else {
          throw new Error('Erro no envio');
        }
      })
      .catch((error) => {
        submitBtn.classList.remove('loading');
        showFormMessage('Erro ao fazer inscrição. Tente novamente.', 'error', newsletterForm);
      });
    });
  }

  // Helper functions
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function showFormMessage(message, type, form) {
    // Remove existing messages
    const existingMessage = form.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `form-message ${type}`;
    messageEl.textContent = message;
    
    // Insert message at the beginning of the form
    form.insertBefore(messageEl, form.firstChild);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 5000);
  }

  // Reset field styles on input
  document.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('input', function() {
      this.style.borderColor = '';
      this.style.borderWidth = '';
    });
  });

  // Reviews Carousel
  const reviewsCarousel = {
    track: document.getElementById('reviewsTrack'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    dotsContainer: document.getElementById('carouselDots'),
    currentIndex: 0,
    cardsVisible: 3,
    totalCards: 0,
    cardWidth: 0,
    autoPlayInterval: null,

    init() {
      if (!this.track) return;

      this.totalCards = this.track.children.length;
      this.updateCardsVisible();
      this.createDots();
      this.updateCarousel();
      this.bindEvents();
      this.startAutoPlay();
    },

    updateCardsVisible() {
      const containerWidth = this.track.parentElement.offsetWidth;
      if (containerWidth <= 768) {
        this.cardsVisible = 1;
      } else if (containerWidth <= 1024) {
        this.cardsVisible = 2;
      } else {
        this.cardsVisible = 3;
      }
      
      // Calcula a largura do card baseada no container
      this.cardWidth = (containerWidth - (this.cardsVisible - 1) * 32) / this.cardsVisible; // 32px = gap entre cards
      
      // Atualiza a largura dos cards
      Array.from(this.track.children).forEach(card => {
        card.style.flex = `0 0 ${this.cardWidth}px`;
      });
    },

    createDots() {
      if (!this.dotsContainer) return;
      
      this.dotsContainer.innerHTML = '';
      const maxSlides = Math.max(0, this.totalCards - this.cardsVisible + 1);
      
      for (let i = 0; i < maxSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Ir para slide ${i + 1}`);
        dot.addEventListener('click', () => this.goToSlide(i));
        this.dotsContainer.appendChild(dot);
      }
    },

    updateCarousel() {
      if (!this.track) return;
      
      const maxIndex = Math.max(0, this.totalCards - this.cardsVisible);
      this.currentIndex = Math.min(this.currentIndex, maxIndex);
      
      const translateX = -(this.currentIndex * (this.cardWidth + 32)); // 32px = margin-right
      this.track.style.transform = `translateX(${translateX}px)`;
      
      // Update navigation buttons
      if (this.prevBtn) {
        this.prevBtn.disabled = this.currentIndex === 0;
      }
      if (this.nextBtn) {
        this.nextBtn.disabled = this.currentIndex >= maxIndex;
      }
      
      // Update dots
      if (this.dotsContainer) {
        const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
          dot.classList.toggle('active', index === this.currentIndex);
        });
      }
    },

    goToSlide(index) {
      this.currentIndex = index;
      this.updateCarousel();
      this.resetAutoPlay();
    },

    nextSlide() {
      const maxIndex = Math.max(0, this.totalCards - this.cardsVisible);
      if (this.currentIndex < maxIndex) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0; // Loop back to start
      }
      this.updateCarousel();
    },

    prevSlide() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        this.currentIndex = Math.max(0, this.totalCards - this.cardsVisible); // Loop to end
      }
      this.updateCarousel();
    },

    bindEvents() {
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => {
          this.nextSlide();
          this.resetAutoPlay();
        });
      }
      
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => {
          this.prevSlide();
          this.resetAutoPlay();
        });
      }

      // Pause autoplay on hover
      if (this.track) {
        this.track.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.track.addEventListener('mouseleave', () => this.startAutoPlay());
      }

      // Handle window resize
      window.addEventListener('resize', () => {
        this.updateCardsVisible();
        this.createDots();
        this.updateCarousel();
      });

      // Touch events for mobile swipe
      this.addTouchEvents();
    },

    addTouchEvents() {
      if (!this.track) return;
      
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      this.track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        this.pauseAutoPlay();
      });

      this.track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
      });

      this.track.addEventListener('touchend', () => {
        if (!isDragging) return;
        
        const diffX = startX - currentX;
        const threshold = 50;
        
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0) {
            this.nextSlide();
          } else {
            this.prevSlide();
          }
        }
        
        isDragging = false;
        this.startAutoPlay();
      });
    },

    startAutoPlay() {
      this.pauseAutoPlay();
      this.autoPlayInterval = setInterval(() => {
        this.nextSlide();
      }, 5000); // Change slide every 5 seconds
    },

    pauseAutoPlay() {
      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    },

    resetAutoPlay() {
      this.pauseAutoPlay();
      this.startAutoPlay();
    }
  };

  // Initialize reviews carousel
  reviewsCarousel.init();

  // Funcionalidade das Tabs (Página de Soluções)
  function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const targetContent = document.getElementById(`tab-${targetTab}`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  // Filtros de Empreendimentos (Página Incorporadora)
  function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const empreendimentoCards = document.querySelectorAll('.empreendimento-card');

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filterValue = button.dataset.filter;
        
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show/hide cards based on filter
        empreendimentoCards.forEach(card => {
          if (filterValue === 'all' || card.dataset.category === filterValue) {
            card.style.display = 'block';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 10);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        });
      });
    });
  }

  // Smooth scroll para âncoras
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // Inicializar funcionalidades
  initTabs();
  initFilters();
  initSmoothScroll();
  
  // ===== MODERN INTERACTIVE FEATURES =====
  
  // Particles Animation
  function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 50;
    
    // Resize canvas
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
      
      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      
      draw() {
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#2EB85C';
        ctx.fill();
      }
    }
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    
    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      // Draw connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.globalAlpha = (100 - distance) / 100 * 0.1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = '#2EB85C';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });
      
      requestAnimationFrame(animate);
    }
    
    animate();
  }
  
  // Counter Animation
  function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
      const target = parseInt(counter.closest('.modern-stat').dataset.count) || 0;
      const increment = target / 100;
      let count = 0;
      
      const updateCounter = () => {
        if (count < target) {
          count += increment;
          counter.textContent = Math.ceil(count);
          setTimeout(updateCounter, 20);
        } else {
          counter.textContent = target;
        }
      };
      
      // Start animation when element is visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updateCounter();
            observer.unobserve(entry.target);
          }
        });
      });
      
      observer.observe(counter);
    });
  }
  
  // Enhanced Scroll Effects
  function initEnhancedScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
      const scrolled = window.pageYOffset;
      const windowHeight = window.innerHeight;
      
      // Parallax for floating shapes
      const shapes = document.querySelectorAll('.shape');
      shapes.forEach((shape, index) => {
        const speed = 0.5 + (index * 0.1);
        shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
      });
      
      // Hero content parallax
      const heroContent = document.querySelector('.hero-content-modern');
      if (heroContent) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
      }
      
      // Section reveal animations
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < windowHeight && rect.bottom > 0;
        
        if (isVisible) {
          section.classList.add('animate-in');
        }
      });
      
      ticking = false;
    }
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
      }
    });
  }
  
  // Interactive Button Effects
  function initInteractiveButtons() {
    const modernBtns = document.querySelectorAll('.modern-btn');
    
    modernBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        btn.style.setProperty('--x', x + 'px');
        btn.style.setProperty('--y', y + 'px');
      });
    });
  }
  
  // Loading Animation
  function initLoadingAnimation() {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-logo">
          <div class="loader-circle"></div>
          <span>O de Quadro</span>
        </div>
        <div class="loader-progress">
          <div class="progress-bar"></div>
        </div>
      </div>
    `;
    
    // Add loader styles
    const loaderStyles = `
      .page-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease, visibility 0.5s ease;
      }
      
      .loader-content {
        text-align: center;
        color: white;
      }
      
      .loader-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
        margin-bottom: 30px;
        font-size: 1.5rem;
        font-weight: 700;
      }
      
      .loader-circle {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(46, 184, 92, 0.3);
        border-top: 3px solid #2EB85C;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      .loader-progress {
        width: 200px;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }
      
      .progress-bar {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #2EB85C, #27AE60);
        border-radius: 2px;
        animation: progress 2s ease-in-out forwards;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes progress {
        0% { width: 0%; }
        100% { width: 100%; }
      }
      
      .page-loader.hidden {
        opacity: 0;
        visibility: hidden;
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = loaderStyles;
    document.head.appendChild(style);
    document.body.appendChild(loader);
    
    // Hide loader when page is loaded
    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.classList.add('loaded');
        setTimeout(() => {
          loader.remove();
        }, 500);
      }, 1000);
    });
  }
  
  // Initialize all modern features
  if (document.querySelector('.modern-hero')) {
    initParticles();
    animateCounters();
    initEnhancedScrollEffects();
    initInteractiveButtons();
    initLoadingAnimation();
  }
});