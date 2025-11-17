// Main JavaScript file for Finlay Brewer International Landing Page

document.addEventListener('DOMContentLoaded', function() {
    // Header scroll behavior
    const header = document.getElementById('header');
    let lastScroll = 0;
    
    function handleScroll() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Close mobile menu on scroll
    window.addEventListener('scroll', function() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        if (mobileMenuToggle && mobileMenu && mobileMenu.classList.contains('open')) {
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('open');
        }
    }, { passive: true });
    
    // Smooth scroll for anchor links
    function setupSmoothScroll(links) {
        links.forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '#header') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // Setup smooth scroll for desktop nav links
    setupSmoothScroll(document.querySelectorAll('.nav-link'));
    // Setup smooth scroll for mobile nav links
    setupSmoothScroll(document.querySelectorAll('.mobile-nav-link'));
    
    // Set active nav link based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function setActiveNavLink() {
        let current = '';
        const scrollPosition = window.pageYOffset + 200;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', setActiveNavLink, { passive: true });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                // Close menu
                this.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.remove('open');
            } else {
                // Open menu
                this.setAttribute('aria-expanded', 'true');
                mobileMenu.classList.add('open');
            }
        });
        
        // Close menu when clicking on a link
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.remove('open');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                if (mobileMenu.classList.contains('open')) {
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    mobileMenu.classList.remove('open');
                }
            }
        });
    }
    
    console.log('Finlay Brewer Landing Page loaded');
});
