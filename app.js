/**
 * Lawrence Chen Portfolio - Client-Side App
 * Coordinates modern APIs, fallbacks, and responsive menu behaviors.
 */

// ==========================================================================
// 1. Invoker Commands Polyfill Import
// ==========================================================================
const initInvokerPolyfill = async () => {
  const hasNativeSupport = 'commandForElement' in HTMLButtonElement.prototype;
  if (!hasNativeSupport) {
    try {
      await import('https://cdn.jsdelivr.net/npm/invokers-polyfill@latest/dist/index.min.js');
      console.log('Invoker Commands API polyfill loaded');
    } catch (err) {
      console.error('Error importing Invoker Commands polyfill:', err);
    }
  }
};

// ==========================================================================
// 2. Adaptive Theme Engine
// ==========================================================================
const initThemeEngine = () => {
  const themeToggle = document.getElementById('theme-toggle');
  
  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark-theme');
      html.classList.remove('light-theme');
    } else {
      html.classList.add('light-theme');
      html.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark-theme') || 
                    (!document.documentElement.classList.contains('light-theme') && 
                     window.matchMedia('(prefers-color-scheme: dark)').matches);
      applyTheme(isDark ? 'light' : 'dark');
    });

    // Apply the saved theme or device default immediately
    applyTheme(getPreferredTheme());
  }
};

// ==========================================================================
// 3. Responsive Mobile Drawer
// ==========================================================================
const initMobileNavigation = () => {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');

  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      mainNav.classList.toggle('active');
    });

    // Dismiss drawer when clicking any link
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mainNav.classList.remove('active');
      });
    });
  }
};

// ==========================================================================
// 4. Scroll-Driven Animation Fallbacks
// ==========================================================================
const initScrollFallbacks = () => {
  const supportsScrollDrivenAnimations = CSS.supports('(animation-timeline: scroll())');

  if (!supportsScrollDrivenAnimations) {
    console.log('Scroll-Driven animations unsupported. Initializing JS fallbacks...');

    // A. Scroll Progress Bar
    const progressFill = document.getElementById('scroll-progress');
    if (progressFill) {
      window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const scrollPercent = window.scrollY / docHeight;
          progressFill.style.transform = `scaleX(${scrollPercent})`;
        }
      }, { passive: true });
    }

    // B. Timeline Progress Fill Bar
    const timelineFill = document.querySelector('.timeline-progress-fill');
    const timelineContainer = document.querySelector('.timeline-container');
    if (timelineFill && timelineContainer) {
      const updateTimelineFill = () => {
        const rect = timelineContainer.getBoundingClientRect();
        const viewHeight = window.innerHeight;
        const containerHeight = rect.height;

        // Calculate progress percentage of container relative to viewport center
        const startOffset = viewHeight * 0.75;
        const totalRange = containerHeight + (viewHeight * 0.25);
        const relativeProgress = Math.max(0, Math.min(1, (startOffset - rect.top) / totalRange));
        
        timelineFill.style.height = `${relativeProgress * 100}%`;
      };
      
      window.addEventListener('scroll', updateTimelineFill, { passive: true });
      updateTimelineFill(); // Set initial
    }

    // C. Timeline Cards Fade-In Reveals (using IntersectionObserver)
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length > 0) {
      const itemObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) scale(1)';
            entry.target.style.transition = 'opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          }
        });
      }, { threshold: 0.15 });

      timelineItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px) scale(0.95)';
        itemObserver.observe(item);
      });
    }
  }
};

// ==========================================================================
// 5. Input Validation States & ARIA Sync
// ==========================================================================
const initFormValidation = () => {
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('form-feedback');

  if (!contactForm) return;

  // A. Keep aria-invalid in sync with visual validation :user-invalid state
  const syncAria = (el) => {
    if (!el || !el.matches) return;
    const isInvalid = el.matches(':user-invalid') || el.classList.contains('user-invalid-fallback');
    el.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
  };

  document.addEventListener('blur', (e) => syncAria(e.target), true);
  document.addEventListener('input', (e) => {
    if (e.target.hasAttribute('aria-invalid')) {
      syncAria(e.target);
    }
  });

  // B. Polyfilling :user-invalid for older browsers
  const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
  const dirtyState = new WeakMap();

  if (!supportsUserInvalid) {
    console.log(':user-invalid selector unsupported. Loading fallback listeners...');
    
    const updateFallbackState = (input) => {
      const isValid = input.checkValidity();
      input.classList.toggle('user-invalid-fallback', !isValid);
      input.classList.toggle('user-valid-fallback', isValid);
      input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
    };

    const handleValidationEvents = (e) => {
      const input = e.target;
      if (!input || !input.checkValidity) return;

      if (e.type === 'reset') {
        const controls = e.currentTarget.elements || [];
        for (const control of controls) {
          dirtyState.delete(control);
          control.classList.remove('user-invalid-fallback', 'user-valid-fallback');
          control.removeAttribute('aria-invalid');
        }
        return;
      }

      if (e.type === 'input' || e.type === 'change') {
        const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
        state.hasInteracted = true;
        dirtyState.set(input, state);
        if (state.hasBlurred) {
          updateFallbackState(input);
        }
      } else if (e.type === 'blur') {
        const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
        state.hasBlurred = true;
        dirtyState.set(input, state);
        if (state.hasInteracted) {
          updateFallbackState(input);
        }
      }
    };

    contactForm.addEventListener('blur', handleValidationEvents, true);
    contactForm.addEventListener('input', handleValidationEvents);
    contactForm.addEventListener('change', handleValidationEvents);
    contactForm.addEventListener('reset', handleValidationEvents, true);
  }

  // C. Intercept Submit Actions
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Trigger validation fallback styling if native selector doesn't exist
    if (!supportsUserInvalid) {
      const inputs = contactForm.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        const isValid = input.checkValidity();
        input.classList.toggle('user-invalid-fallback', !isValid);
        input.classList.toggle('user-valid-fallback', isValid);
        input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
      });
    }

    if (!contactForm.checkValidity()) {
      // Focus the first invalid field
      const firstInvalid = contactForm.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();

      if (formFeedback) {
        formFeedback.textContent = '❌ Please correct the errors in the form before sending.';
        formFeedback.className = 'form-feedback error';
      }
    } else {
      // Form matches constraints. Send using Web3Forms
      if (formFeedback) {
        formFeedback.textContent = '⌛ Sending message...';
        formFeedback.className = 'form-feedback';
      }

      const formData = new FormData(contactForm);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: json
      })
      .then(async (response) => {
        let json = await response.json();
        if (response.status == 200) {
          if (formFeedback) {
            formFeedback.textContent = '🎉 Thank you! Your message has been sent successfully.';
            formFeedback.className = 'form-feedback success';
          }
          contactForm.reset();
          
          // Clear dirty state classes
          const inputs = contactForm.querySelectorAll('input, textarea');
          inputs.forEach(input => {
            input.classList.remove('user-invalid-fallback', 'user-valid-fallback');
            input.removeAttribute('aria-invalid');
          });
        } else {
          console.log(response);
          if (formFeedback) {
            formFeedback.textContent = '❌ ' + json.message;
            formFeedback.className = 'form-feedback error';
          }
        }
      })
      .catch(error => {
        console.log(error);
        if (formFeedback) {
          formFeedback.textContent = '❌ Something went wrong. Please try again later.';
          formFeedback.className = 'form-feedback error';
        }
      });
    }
  });
};

// ==========================================================================
// 6. Application Bootstrap
// ==========================================================================
const bootstrap = () => {
  initInvokerPolyfill();
  initThemeEngine();
  initMobileNavigation();
  initScrollFallbacks();
  initFormValidation();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
