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
});