// ===== MOBILE MENU =====
function toggleMenu() {
    const nav = document.getElementById('navLinks');
    const btn = document.querySelector('.menu-toggle');
    nav.classList.toggle('active');
    btn.classList.toggle('active');
}

function closeMenu() {
    const nav = document.getElementById('navLinks');
    const btn = document.querySelector('.menu-toggle');
    nav.classList.remove('active');
    btn.classList.remove('active');
}

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(15, 10, 20, 0.95)';
    } else {
        nav.style.background = 'rgba(15, 10, 20, 0.9)';
    }
});

// ===== CAROUSEL SYSTEM =====
const carouselState = {};

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Generate all carousels dynamically from window.MEDIA_DATA
function renderModalCarousels() {
    if (!window.MEDIA_DATA) {
        console.warn("window.MEDIA_DATA no esta cargado. Ejecuta generate-media.bat para sincronizar.");
        return;
    }

    const containers = document.querySelectorAll('.modal-media-container[data-media]');

    containers.forEach((container) => {
        const mediaKey = container.getAttribute('data-media');
        const rawCarousels = window.MEDIA_DATA[mediaKey];

        if (!rawCarousels || rawCarousels.length === 0) {
            container.innerHTML = `
                <div class="carousel-placeholder" style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-hover); border-radius: 12px;">
                    <p>No se encontraron imagenes o videos en Media/${escapeHtml(mediaKey)}/Modal</p>
                </div>`;
            return;
        }

        // Ensure any carousel titled 'Team' or 'Equipo' is moved to the end
        const nonTeam = rawCarousels.filter(c => !/^(team|equipo)$/i.test((c.title || '').trim()));
        const teamCarousels = rawCarousels.filter(c => /^(team|equipo)$/i.test((c.title || '').trim()));
        const carousels = [...nonTeam, ...teamCarousels];

        const wrapper = document.createElement('div');
        wrapper.className = 'modal-media-wrapper';

        // 1. If multiple carousels exist, create category tabs
        if (carousels.length > 1) {
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'carousel-tabs';

            carousels.forEach((carousel, cIdx) => {
                const carouselId = `${mediaKey.toLowerCase()}-c${cIdx}`;
                const tabBtn = document.createElement('button');
                tabBtn.type = 'button';
                tabBtn.className = `carousel-tab-btn ${cIdx === 0 ? 'active' : ''}`;
                tabBtn.innerHTML = `${escapeHtml(carousel.title)} <span class="carousel-tab-badge">${carousel.items.length}</span>`;
                tabBtn.onclick = function() {
                    switchCarouselTab(tabBtn, carouselId, container);
                };
                tabsContainer.appendChild(tabBtn);
            });

            wrapper.appendChild(tabsContainer);
        }

        // 2. Render each carousel container
        carousels.forEach((carousel, cIdx) => {
            const carouselId = `${mediaKey.toLowerCase()}-c${cIdx}`;

            const itemContainer = document.createElement('div');
            itemContainer.className = `carousel-container-item ${cIdx === 0 ? 'active' : ''}`;
            itemContainer.id = carouselId;

            const total = carousel.items.length;

            // Collect item names for the title bar
            const itemNames = carousel.items.map(item => item.name || '');

            let slidesHtml = '';
            carousel.items.forEach((item) => {
                if (item.type === 'video') {
                    slidesHtml += `
                        <div class="carousel-slide carousel-slide-video">
                            <video src="${escapeHtml(item.src)}" controls playsinline preload="none"></video>
                            <div class="video-badge" aria-hidden="true">&#9654; Video</div>
                        </div>`;
                } else {
                    slidesHtml += `
                        <div class="carousel-slide">
                            <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">
                        </div>`;
                }
            });

            itemContainer.innerHTML = `
                <div class="carousel" data-carousel="${carouselId}">
                    <div class="carousel-counter"><span class="curr">1</span> / <span class="total">${total}</span></div>
                    <div class="carousel-track">
                        ${slidesHtml}
                    </div>
                    ${total > 1 ? `
                    <button type="button" class="carousel-nav prev" onclick="moveCarousel('${carouselId}', -1)" aria-label="Anterior">&lsaquo;</button>
                    <button type="button" class="carousel-nav next" onclick="moveCarousel('${carouselId}', 1)" aria-label="Siguiente">&rsaquo;</button>
                    <div class="carousel-dots"></div>
                    ` : ''}
                </div>
                <div class="carousel-item-title" data-carousel-title="${carouselId}">${escapeHtml(itemNames[0] || '')}</div>`;

            // Store item names for updateCarousel to access
            itemContainer._itemNames = itemNames;

            wrapper.appendChild(itemContainer);
        });

        // NOTE: Video event listeners are bound in initCarousel, NOT here.
        // Binding here would create duplicates.

        container.innerHTML = '';
        container.appendChild(wrapper);
    });
}

function switchCarouselTab(tabBtn, targetCarouselId, container) {
    // 1. Update tab active state
    const tabs = container.querySelectorAll('.carousel-tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    tabBtn.classList.add('active');

    // 2. Pause any videos in previous carousels
    container.querySelectorAll('video').forEach(v => {
        v.pause();
        const slide = v.closest('.carousel-slide');
        if (slide) slide.classList.remove('is-playing');
    });

    // 3. Switch visible carousel item
    const items = container.querySelectorAll('.carousel-container-item');
    items.forEach(item => {
        if (item.id === targetCarouselId) {
            item.classList.add('active');
            const carouselEl = item.querySelector('.carousel');
            if (carouselEl) initCarousel(carouselEl);
        } else {
            item.classList.remove('active');
        }
    });
}

function initCarousel(carouselEl) {
    if (!carouselEl) return;
    const id = carouselEl.dataset.carousel;
    if (carouselState[id]) return;

    const track = carouselEl.querySelector('.carousel-track');
    const slides = carouselEl.querySelectorAll('.carousel-slide');
    const dotsContainer = carouselEl.querySelector('.carousel-dots');
    const counterCurr = carouselEl.querySelector('.carousel-counter .curr');
    const total = slides.length;

    if (total === 0) return;

    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < total; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Slide ' + (i + 1));
            dot.onclick = () => goToSlide(id, i);
            dotsContainer.appendChild(dot);
        }
    }


    // Find the title element outside the carousel (sibling)
    const itemContainer = carouselEl.closest('.carousel-container-item');
    const titleEl = itemContainer ? itemContainer.querySelector(`[data-carousel-title="${id}"]`) : null;
    const itemNames = (itemContainer && itemContainer._itemNames) ? itemContainer._itemNames : [];

    carouselState[id] = {
        current: 0,
        total: total,
        track: track,
        slides: slides,
        dots: dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [],
        counterCurr: counterCurr,
        titleEl: titleEl,
        itemNames: itemNames,
        touchStartX: 0,
        touchEndX: 0
    };

    carouselEl.addEventListener('touchstart', (e) => {
        carouselState[id].touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselEl.addEventListener('touchend', (e) => {
        carouselState[id].touchEndX = e.changedTouches[0].screenX;
        handleSwipe(id);
    }, { passive: true });

    // Preload only the CURRENT slide's video on demand — never auto-start others
    // (leave preload='none' to prevent unexpected audio from other slides)

    updateCarousel(id);
}

function handleSwipe(id) {
    const state = carouselState[id];
    if (!state) return;
    const diff = state.touchStartX - state.touchEndX;
    if (Math.abs(diff) > 50) {
        if (diff > 0) moveCarousel(id, 1);
        else moveCarousel(id, -1);
    }
}

function moveCarousel(id, direction) {
    if (!carouselState[id]) return;
    const state = carouselState[id];
    let next = state.current + direction;
    if (next < 0) next = state.total - 1;
    if (next >= state.total) next = 0;
    goToSlide(id, next);
}

function goToSlide(id, index) {
    const state = carouselState[id];
    if (!state || index === state.current) return;

    // Pause video in current slide if any
    const currentSlide = state.slides[state.current];
    if (currentSlide) {
        const currentVideo = currentSlide.querySelector('video');
        if (currentVideo) {
            currentVideo.pause();
            currentSlide.classList.remove('is-playing');
        }
    }

    state.current = index;

    updateCarousel(id);
}

function updateCarousel(id) {
    const state = carouselState[id];
    if (!state) return;

    if (state.track) {
        state.track.style.transform = 'translateX(-' + (state.current * 100) + '%)';
    }

    if (state.dots && state.dots.length > 0) {
        state.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === state.current);
        });
    }

    if (state.counterCurr) {
        state.counterCurr.textContent = state.current + 1;
    }

    // Update the title bar below the carousel
    if (state.titleEl && state.itemNames.length > 0) {
        state.titleEl.textContent = state.itemNames[state.current] || '';
    }
}

// ===== MODALS =====
function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialize all visible carousels inside this modal
    modal.querySelectorAll('.carousel-container-item.active .carousel, .modal-media-container > .modal-media-wrapper > .carousel').forEach(carousel => {
        initCarousel(carousel);
    });
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // Pause all videos when closing the modal
    modal.querySelectorAll('video').forEach(v => v.pause());
}

function closeModalOnOverlay(event, id) {
    if (event.target === event.currentTarget) {
        closeModal(id);
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    const activeModal = document.querySelector('.modal-overlay.active');
    if (!activeModal) return;

    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
            modal.querySelectorAll('video').forEach(v => {
                v.pause();
                const slide = v.closest('.carousel-slide');
                if (slide) slide.classList.remove('is-playing');
            });
        });
        document.body.style.overflow = '';
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const activeCarouselEl = activeModal.querySelector('.carousel-container-item.active .carousel') || activeModal.querySelector('.carousel');
        if (activeCarouselEl && activeCarouselEl.dataset.carousel) {
            const carouselId = activeCarouselEl.dataset.carousel;
            if (e.key === 'ArrowLeft') moveCarousel(carouselId, -1);
            if (e.key === 'ArrowRight') moveCarousel(carouselId, 1);
        }
    }
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    renderModalCarousels();

    // Scroll animation for project cards
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.project-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease ' + (index * 0.08) + 's, transform 0.6s ease ' + (index * 0.08) + 's';
        observer.observe(card);
    });
});
