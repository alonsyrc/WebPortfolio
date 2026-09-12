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
                tabBtn.onclick = function () {
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

            // Collect item names and descriptions for the caption bar
            const itemNames = carousel.items.map(item => item.name || '');
            const carouselDesc = carousel.description || '';
            const itemDescriptions = carousel.items.map(item => item.description || carouselDesc || '');

            let slidesHtml = '';
            carousel.items.forEach((item) => {
                if (item.type === 'video') {
                    slidesHtml += `
                        <div class="carousel-slide carousel-slide-video">
                            <video src="${escapeHtml(item.src)}" controls playsinline preload="metadata"></video>
                            <div class="video-badge" aria-hidden="true">&#9654; Video</div>
                            <button type="button" class="video-play-overlay" aria-label="Reproducir video">
                                <span class="video-play-btn">
                                    <svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                                    <svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                </span>
                            </button>
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
                <div class="carousel-caption-container">
                    <div class="carousel-item-title" data-carousel-title="${carouselId}">${escapeHtml(itemNames[0] || '')}</div>
                    <div class="carousel-item-desc" data-carousel-desc="${carouselId}">${escapeHtml(itemDescriptions[0] || '')}</div>
                </div>`;

            // Store item names and descriptions for updateCarousel to access
            itemContainer._itemNames = itemNames;
            itemContainer._itemDescriptions = itemDescriptions;

            wrapper.appendChild(itemContainer);
        });

        // NOTE: Video event listeners are bound in initCarousel, NOT here.
        // Binding here would create duplicates.

        container.innerHTML = '';
        container.appendChild(wrapper);
    });
}

// ===== FEATURED PROJECTS =====
function renderFeaturedProjects() {
    if (!window.FEATURED_PROJECTS || window.FEATURED_PROJECTS.length === 0) {
        const grid = document.getElementById('featured-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="carousel-placeholder" style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-muted); background: var(--bg-hover); border-radius: 12px;">
                    <p>No hay proyectos destacados. Crea carpetas en <code>Media/Destacado/Modal/[NombreProyecto]/</code> y ejecuta <code>generate-media.bat</code></p>
                </div>`;
        }
        return;
    }

    const grid = document.getElementById('featured-grid');
    if (!grid) return;

    grid.innerHTML = '';

    window.FEATURED_PROJECTS.forEach((project, idx) => {
        const firstItem = project.items[0];
        const isVideo = firstItem.type === 'video';
        const thumbSrc = firstItem.src;

        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.transitionDelay = `${idx * 0.08}s`;
        card.onclick = () => openFeaturedModal(project);

        if (isVideo) {
            card.innerHTML = `
                <div class="project-media">
                    <video src="${escapeHtml(thumbSrc)}" muted playsinline preload="metadata"></video>
                    <div class="video-badge" aria-hidden="true">▶ Video</div>
                    <div class="card-hover-icon"></div>
                </div>
                <div class="project-info">
                    <h3>${escapeHtml(project.title)}</h3>
                </div>
            `;
            const mediaEl = card.querySelector('.project-media');
            const PLAY_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                <path d="M8 5v14l11-7z"/>
            </svg>`;
            const iconWrap = document.createElement('div');
            iconWrap.className = 'card-hover-icon';
            iconWrap.innerHTML = PLAY_SVG;
            mediaEl.appendChild(iconWrap);
        } else {
            card.innerHTML = `
                <div class="project-media">
                    <img src="${escapeHtml(thumbSrc)}" alt="${escapeHtml(project.title)}" loading="lazy" decoding="async">
                    <div class="card-hover-icon"></div>
                </div>
                <div class="project-info">
                    <h3>${escapeHtml(project.title)}</h3>
                </div>
            `;
        }

        // Inject play SVG for image case
        if (!isVideo) {
            const mediaEl = card.querySelector('.project-media');
            const PLAY_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                <path d="M8 5v14l11-7z"/>
            </svg>`;
            const iconWrap = document.createElement('div');
            iconWrap.className = 'card-hover-icon';
            iconWrap.innerHTML = PLAY_SVG;
            mediaEl.appendChild(iconWrap);
        }

        grid.appendChild(card);
    });

    // Observe for scroll reveal
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    grid.querySelectorAll('.project-card').forEach(card => {
        card.classList.add('scroll-reveal');
        revealObserver.observe(card);
    });
}

function openFeaturedModal(project) {
    // Create a temporary modal for this featured project
    const modalId = 'featured-modal-' + project.title.toLowerCase().replace(/\s+/g, '-');
    let modal = document.getElementById(modalId);

    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = modalId;
        modal.onclick = (e) => { if (e.target === modal) closeModal(modalId); };

        // Build carousel HTML similar to modal carousels
        const carouselId = modalId + '-c0';
        let slidesHtml = '';
        project.items.forEach((item) => {
            if (item.type === 'video') {
                slidesHtml += `
                    <div class="carousel-slide carousel-slide-video">
                        <video src="${escapeHtml(item.src)}" controls playsinline preload="metadata"></video>
                        <div class="video-badge" aria-hidden="true">▶ Video</div>
                        <button type="button" class="video-play-overlay" aria-label="Reproducir video">
                            <span class="video-play-btn">
                                <svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                                <svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            </span>
                        </button>
                    </div>`;
            } else {
                slidesHtml += `
                    <div class="carousel-slide">
                        <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">
                    </div>`;
            }
        });

        const itemNames = project.items.map(item => item.name || '');
        const itemDescriptions = project.items.map(item => item.description || project.description || '');

        modal.innerHTML = `
            <div class="modal">
                <button class="modal-close" onclick="closeModal('${modalId}')">&times;</button>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${escapeHtml(project.title)}</h2>
                        <div class="modal-meta">
                            <span class="modal-role">Proyecto Destacado</span>
                        </div>
                    </div>
                    <div class="modal-media-wrapper">
                        <div class="carousel-container-item active" id="${carouselId}">
                            <div class="carousel" data-carousel="${carouselId}">
                                <div class="carousel-counter"><span class="curr">1</span> / <span class="total">${project.items.length}</span></div>
                                <div class="carousel-track">
                                    ${slidesHtml}
                                </div>
                                ${project.items.length > 1 ? `
                                <button type="button" class="carousel-nav prev" onclick="moveCarousel('${carouselId}', -1)" aria-label="Anterior">&lsaquo;</button>
                                <button type="button" class="carousel-nav next" onclick="moveCarousel('${carouselId}', 1)" aria-label="Siguiente">&rsaquo;</button>
                                <div class="carousel-dots"></div>
                                ` : ''}
                            </div>
                            <div class="carousel-caption-container">
                                <div class="carousel-item-title" data-carousel-title="${carouselId}">${escapeHtml(itemNames[0] || '')}</div>
                                <div class="carousel-item-desc" data-carousel-desc="${carouselId}">${escapeHtml(itemDescriptions[0] || '')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Store item names/descriptions for the carousel
        const itemContainer = modal.querySelector('.carousel-container-item');
        itemContainer._itemNames = itemNames;
        itemContainer._itemDescriptions = itemDescriptions;
    }

    openModal(modalId);
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


    // Find the caption elements outside the carousel (sibling)
    const itemContainer = carouselEl.closest('.carousel-container-item');
    const titleEl = itemContainer ? itemContainer.querySelector(`[data-carousel-title="${id}"]`) : null;
    const descEl = itemContainer ? itemContainer.querySelector(`[data-carousel-desc="${id}"]`) : null;
    const itemNames = (itemContainer && itemContainer._itemNames) ? itemContainer._itemNames : [];
    const itemDescriptions = (itemContainer && itemContainer._itemDescriptions) ? itemContainer._itemDescriptions : [];

    carouselState[id] = {
        current: 0,
        total: total,
        track: track,
        slides: slides,
        dots: dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [],
        counterCurr: counterCurr,
        titleEl: titleEl,
        descEl: descEl,
        itemNames: itemNames,
        itemDescriptions: itemDescriptions,
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

    // Custom play overlay + poster frame from middle of video (avoids black screen)
    slides.forEach((slide) => {
        const video = slide.querySelector('video');
        const overlay = slide.querySelector('.video-play-overlay');
        if (!video || !overlay) return;

        const playIcon = overlay.querySelector('.icon-play');
        const pauseIcon = overlay.querySelector('.icon-pause');

        function updateOverlayUI() {
            const isPlaying = !video.paused && !video.ended;
            slide.classList.toggle('is-playing', isPlaying);
            if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
            if (pauseIcon) pauseIcon.style.display = isPlaying ? 'block' : 'none';
            overlay.setAttribute('aria-label', isPlaying ? 'Pausar video' : 'Reproducir video');
        }

        function togglePlay(e) {
            // Ignore clicks that target the native control bar area
            if (e.target === video) {
                const rect = video.getBoundingClientRect();
                const y = e.clientY - rect.top;
                // bottom ~15% is roughly where native controls live
                if (y > rect.height * 0.85) return;
            }
            e.preventDefault();
            e.stopPropagation();

            if (video.paused || video.ended) {
                const modal = video.closest('.modal-overlay');
                if (modal) {
                    modal.querySelectorAll('video').forEach((other) => {
                        if (other !== video) {
                            other.pause();
                            const otherSlide = other.closest('.carousel-slide');
                            if (otherSlide) otherSlide.classList.remove('is-playing');
                        }
                    });
}
        video.play().catch(() => { });
    } else {
        video.pause();
    }
}

overlay.addEventListener('click', togglePlay);
video.addEventListener('click', togglePlay);
video.addEventListener('play', updateOverlayUI);
video.addEventListener('pause', updateOverlayUI);
video.addEventListener('ended', updateOverlayUI);

updateOverlayUI();
    });

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

    // Stamp the active slide with .is-current so getActiveModalVideo can find it
    state.slides.forEach((slide, i) => {
        slide.classList.toggle('is-current', i === state.current);
    });

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
        const titleText = state.itemNames[state.current] || '';
        state.titleEl.textContent = titleText;
        state.titleEl.style.display = titleText ? '' : 'none';
    }

    // Update the description text below the title
    if (state.descEl && state.itemDescriptions.length > 0) {
        const descText = state.itemDescriptions[state.current] || '';
        state.descEl.textContent = descText;
        state.descEl.style.display = descText ? '' : 'none';
    }

    // Auto-play video in new active slide after 100ms
    const newSlide = state.slides[state.current];
    if (newSlide) {
        const video = newSlide.querySelector('video');
        if (video) {
            setTimeout(() => {
                video.play().catch(() => {
                    // Autoplay blocked
                });
            }, 100);
        }
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

    // Auto-play first video after 100ms if modal has a video
    setTimeout(() => {
        const video = modal.querySelector('video');
        if (video) {
            video.play().catch(() => {
                // Autoplay blocked by browser
            });
        }
    }, 100);
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

// ===== KEYBOARD OSD (On-Screen Display) =====
let _osdTimeout = null;
function showOSD(text) {
    let osd = document.getElementById('kbd-osd');
    if (!osd) {
        osd = document.createElement('div');
        osd.id = 'kbd-osd';
        osd.style.cssText = [
            'position:fixed', 'bottom:10%', 'left:50%', 'transform:translateX(-50%)',
            'background:rgba(0,0,0,0.75)', 'color:#fff', 'padding:8px 20px',
            'border-radius:8px', 'font-size:1rem', 'font-weight:600',
            'pointer-events:none', 'z-index:99999', 'transition:opacity 0.3s',
            'white-space:nowrap', 'letter-spacing:0.03em'
        ].join(';');
        document.body.appendChild(osd);
    }
    osd.textContent = text;
    osd.style.opacity = '1';
    clearTimeout(_osdTimeout);
    _osdTimeout = setTimeout(() => { osd.style.opacity = '0'; }, 1200);
}

// Helper: get the video in the currently visible slide of the active modal.
// Uses the DOM-truth `.is-current` class stamped by updateCarousel, so it's
// always accurate regardless of state-tracking edge cases.
// Returns null if the current slide is a photo (no video element).
function getActiveModalVideo() {
    const activeModal = document.querySelector('.modal-overlay.active');
    if (!activeModal) return null;

    // Primary: trust the .is-current stamp on the slide (set by updateCarousel)
    const currentSlide =
        activeModal.querySelector('.carousel-container-item.active .carousel-slide.is-current') ||
        activeModal.querySelector('.carousel-slide.is-current');

    if (currentSlide) {
        // Returns the video if the slide has one, or null if it's a photo
        return currentSlide.querySelector('video');
    }

    // Fallback: first slide of the active carousel (only reached before first updateCarousel call)
    const activeCarouselEl =
        activeModal.querySelector('.carousel-container-item.active .carousel') ||
        activeModal.querySelector('.carousel');
    if (activeCarouselEl && activeCarouselEl.dataset.carousel) {
        const state = carouselState[activeCarouselEl.dataset.carousel];
        if (state && state.slides && state.slides[state.current]) {
            return state.slides[state.current].querySelector('video');
        }
    }
    return null;
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    const activeModal = document.querySelector('.modal-overlay.active');
    if (!activeModal) return;

    // Don't hijack shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const tag = e.target.tagName;

    // --- ESC: close modal ---
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
        return;
    }

    // --- Arrow Left / Right: navigate slides ---
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const activeCarouselEl =
            activeModal.querySelector('.carousel-container-item.active .carousel') ||
            activeModal.querySelector('.carousel');
        if (activeCarouselEl && activeCarouselEl.dataset.carousel) {
            const carouselId = activeCarouselEl.dataset.carousel;
            if (e.key === 'ArrowLeft') moveCarousel(carouselId, -1);
            if (e.key === 'ArrowRight') moveCarousel(carouselId, 1);
        }
        return;
    }

    // --- Video shortcuts: Space / K = play-pause ---
    if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        const video = getActiveModalVideo();
        if (video) {
            e.preventDefault();
            if (video.paused || video.ended) {
                // Pause all others first
                activeModal.querySelectorAll('video').forEach(v => {
                    if (v !== video) {
                        v.pause();
                        const s = v.closest('.carousel-slide');
                        if (s) s.classList.remove('is-playing');
                    }
                });
                video.play().catch(() => { });
                showOSD('▶ Reproducir');
            } else {
                video.pause();
                showOSD('⏸ Pausar');
            }
        }
        return;
    }

    // --- Arrow Up / Down: volume ±10% ---
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const video = getActiveModalVideo();
        if (video) {
            e.preventDefault();
            const step = 0.1;
            video.volume = Math.min(1, Math.max(0, video.volume + (e.key === 'ArrowUp' ? step : -step)));
            video.muted = false;
            const pct = Math.round(video.volume * 100);
            showOSD(`🔊 Volumen: ${pct}%`);
        }
        return;
    }

    // --- M: mute toggle ---
    if (e.key === 'm' || e.key === 'M') {
        const video = getActiveModalVideo();
        if (video) {
            e.preventDefault();
            video.muted = !video.muted;
            showOSD(video.muted ? '🔇 Silenciado' : `🔊 Volumen: ${Math.round(video.volume * 100)}%`);
        }
        return;
    }

    // --- F: fullscreen toggle ---
    if (e.key === 'f' || e.key === 'F') {
        const video = getActiveModalVideo();
        if (video) {
            e.preventDefault();
            if (!document.fullscreenElement) {
                (video.requestFullscreen || video.webkitRequestFullscreen || video.mozRequestFullScreen).call(video)
                    .catch(() => { });
                showOSD('⛶ Pantalla completa');
            } else {
                (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen).call(document)
                    .catch(() => { });
                showOSD('⊡ Salir de pantalla completa');
            }
        }
        return;
    }
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    renderModalCarousels();
    renderFeaturedProjects();

    // ── Inject DOM elements ────────────────────────────────────────────────
    // Scroll progress bar
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    document.body.prepend(progressBar);

    // Hero particles
    const hero = document.querySelector('.hero');
    if (hero) {
        const particlesEl = document.createElement('div');
        particlesEl.className = 'hero-particles';
        const PARTICLE_COUNT = 22;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = document.createElement('span');
            p.className = 'particle';
            const size = Math.random() * 3 + 1.5;          // 1.5–4.5px
            const left = Math.random() * 100;              // 0–100%
            const duration = Math.random() * 12 + 8;       // 8–20s
            const delay = Math.random() * -18;             // stagger start
            const opacity = Math.random() * 0.4 + 0.1;     // subtle
            p.style.cssText = [
                `width:${size}px`, `height:${size}px`,
                `left:${left}%`, `bottom:-${size}px`,
                `animation-duration:${duration}s`,
                `animation-delay:${delay}s`,
                `opacity:${opacity}`,
                `filter:blur(${size > 3 ? 1 : 0}px)`
            ].join(';');
            particlesEl.appendChild(p);
        }
        hero.insertAdjacentElement('afterbegin', particlesEl);
    }

    // ── Scroll progress bar ────────────────────────────────────────────────
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    }, { passive: true });

    // ── Hero entrance tweens ───────────────────────────────────────────────
    const nav = document.querySelector('nav');
    if (nav) nav.classList.add('anim-nav-enter');

    const heroDelays = [0.15, 0.35, 0.52, 0.68];
    document.querySelectorAll('.hero-content > *').forEach((el, i) => {
        el.style.setProperty('--anim-delay', (heroDelays[i] ?? (0.15 + i * 0.15)) + 's');
        el.classList.add('anim-hero-child');
    });

    // ── Scroll-reveal setup ───────────────────────────────────────────────
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.section-header').forEach(el => {
        el.classList.add('scroll-reveal');
        revealObserver.observe(el);
    });

    document.querySelectorAll('.timeline-item').forEach(el => {
        el.classList.add('scroll-reveal');
        revealObserver.observe(el);
    });

    document.querySelectorAll('.contact').forEach(el => {
        el.classList.add('scroll-reveal');
        revealObserver.observe(el);
    });

    // Footer reveal
    document.querySelectorAll('footer').forEach(el => {
        el.classList.add('scroll-reveal');
        revealObserver.observe(el);
    });

    document.querySelectorAll('.project-card').forEach((card, index) => {
        card.classList.add('scroll-reveal');
        card.style.transitionDelay = (index * 0.08) + 's';
        revealObserver.observe(card);
    });

    // ── Card hover icon (eye SVG for Estudios/Proyectos, skip featured) ──────────────────
    const EXPAND_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5C6.5 5 2 12 2 12s4.5 7 10 7 10-7 10-7-4.5-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
    </svg>`;
    document.querySelectorAll('.project-media').forEach(media => {
        const card = media.closest('.project-card');
        // Skip featured project cards - they inject their own icon in renderFeaturedProjects
        if (card && card.closest('#featured-grid')) return;
        if (media.querySelector('.card-hover-icon')) return;
        const iconWrap = document.createElement('div');
        iconWrap.className = 'card-hover-icon';
        iconWrap.innerHTML = EXPAND_SVG;
        media.appendChild(iconWrap);
    });

    // ── Click burst particles ─────────────────────────────────────────────
    const BURST_COLORS = ['#D946EF', '#F0ABFC', '#a855f7', '#ffffff', '#e879f9'];

    document.addEventListener('click', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        const count = 12;

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('span');
            dot.className = 'click-burst';

            const angle = (i / count) * 360;
            const dist = Math.random() * 55 + 30;         // 30–85px radius
            const bx = Math.cos(angle * Math.PI / 180) * dist;
            const by = Math.sin(angle * Math.PI / 180) * dist;
            const size = Math.random() * 5 + 4;           // 4–9px
            const color = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
            const delay = Math.random() * 0.06;            // slight stagger

            dot.style.cssText = [
                `left:${x}px`, `top:${y}px`,
                `width:${size}px`, `height:${size}px`,
                `background:${color}`,
                `--bx:${bx}px`, `--by:${by}px`,
                `animation-delay:${delay}s`,
                `box-shadow:0 0 6px ${color}`
            ].join(';');

            document.body.appendChild(dot);
            dot.addEventListener('animationend', () => dot.remove());
        }
    });
});


