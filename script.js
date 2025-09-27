/* ================================================================ */
/* script.js (모든 페이지 공용 스크립트) */
/* ================================================================ */

/**
 * 모바일 네비게이션(햄버거 메뉴)을 초기화하고 이벤트를 연결하는 함수.
 * 이벤트 위임을 사용하므로 페이지 로드 시 한 번만 실행하면 됩니다.
 */
function initMobileNav() {
    const mobileNavPanel = document.querySelector('.c-mobile-nav');
    if (!mobileNavPanel) return;

    // 문서 전체에 클릭 이벤트 리스너를 추가 (이벤트 위임)
    document.addEventListener('click', (event) => {
        // 햄버거 버튼 클릭 시 메뉴 열기
        if (event.target.closest('.c-hamburger-btn')) {
            mobileNavPanel.classList.add('is-open');
        }

        // 닫기 버튼 또는 메뉴 안의 링크 클릭 시 메뉴 닫기
        if (event.target.closest('.c-mobile-nav__close-btn') || event.target.closest('.c-mobile-nav__menu a')) {
            mobileNavPanel.classList.remove('is-open');
        }
    });
}


/**
 * 페이지별로 필요한 스크립트를 초기화하는 함수.
 * 페이지 콘텐츠가 새로 로드될 때마다 실행됩니다.
 */
function initializePageScripts() {
    // 스크롤 애니메이션 초기화
    const targets = document.querySelectorAll('.e-iv');
    if (targets.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });
        targets.forEach(target => observer.observe(target));
    }

    // CLASSES 페이지: 병과 상세 보기/뒤로 가기 기능
    const classListView = document.getElementById('class-list-view');
    if (classListView) {
        const detailView = document.getElementById('class-detail-view');
        const detailWrapper = document.getElementById('detail-content-wrapper');
        const classLinks = document.querySelectorAll('.class-list__item');
        const backBtn = document.getElementById('back-to-list-btn');

        classLinks.forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                const className = this.getAttribute('data-class');
                const template = document.querySelector(`#class-templates [data-class-template="${className}"]`);
                if (template && detailWrapper && classListView && detailView) {
                    detailWrapper.innerHTML = template.innerHTML;
                    classListView.classList.add('hidden');
                    detailView.classList.remove('hidden');
                    detailView.classList.add('visible');
                    window.scrollTo(0, 0);
                }
            });
        });

        if (backBtn && detailView && classListView) {
            backBtn.addEventListener('click', function (event) {
                event.preventDefault();
                detailView.classList.add('hidden');
                classListView.classList.remove('hidden'); // 'listView' 오타 수정
                if(detailWrapper) detailWrapper.innerHTML = '';
            });
        }
    }

    // SYSTEM 페이지: 탭 메뉴 기능
    const systemTabs = document.getElementById('system-tabs');
    if (systemTabs) {
        const mainTabs = systemTabs.querySelectorAll('.c-tabmenu__link');
        const mainContents = document.querySelectorAll('#system-content-area > .system-content');

        const activateMainTab = (tab) => {
            if (!tab) return;
            const targetContentId = tab.getAttribute('data-tab');
            mainTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            mainContents.forEach(content => {
                content.classList.toggle('visible', content.getAttribute('data-tab-content') === targetContentId);
            });
        };

        mainTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();

                // ===== BUG FIX: 이벤트 전파 중단 =====
                // 이 코드가 없으면 탭 클릭이 페이지 전체의 링크 클릭으로 인식되어
                // 메인 페이지로 이동하는 심각한 오류가 발생합니다.
                // stopPropagation()은 이 클릭 이벤트가 상위로 전달되는 것을 막아줍니다.
                e.stopPropagation();
                
                activateMainTab(tab);
            });
        });

        if (mainTabs.length > 0) {
            activateMainTab(mainTabs[0]);
        }
    }
}

/**
 * 지정된 URL의 페이지 콘텐츠를 로드하여 현재 페이지에 적용하는 함수.
 */
async function loadPage(url) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const mainContent = document.getElementById('main-content');
    
    if (!mainContent) {
        window.location.href = url;
        return;
    }

    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const newPageHtml = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(newPageHtml, 'text/html');

        const newMainContent = newDoc.getElementById('main-content');
        const newTitle = newDoc.querySelector('title').innerText;
        const newBodyClass = newDoc.body.className;

        if (newMainContent) {
            document.body.className = newBodyClass;
            document.title = newTitle;
            
            mainContent.className = newMainContent.className; // 레이아웃 깨짐 방지
            mainContent.innerHTML = newMainContent.innerHTML;

            window.history.pushState({ path: url }, '', url);
            
            document.querySelectorAll('.c-mainmenu__link').forEach(link => {
                const linkUrl = new URL(link.href, window.location.origin);
                const targetUrl = new URL(url, window.location.origin);
                link.classList.toggle('active', linkUrl.pathname === targetUrl.pathname.replace('//', '/'));
            });

            initializePageScripts();
            window.scrollTo(0, 0);
        } else {
            window.location.href = url;
        }
    } catch (error) {
        console.error('Page load failed:', error);
        window.location.href = url;
    } finally {
        if (loadingOverlay) {
            setTimeout(() => loadingOverlay.classList.add('hidden'), 200);
        }
    }
}

// SPA를 위한 기본 이벤트 리스너 설정
function initSpa() {
    // [추가] 모바일 네비게이션 기능 초기화
    initMobileNav();

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link) return;

        // 탭처럼 내부 동작을 위한 링크는 SPA 라우팅에서 제외
        if (link.closest('.c-tabmenu')) {
            return;
        }

        const targetUrl = new URL(link.href, window.location.origin);
        const currentUrl = new URL(window.location.href);

        if (targetUrl.hostname !== currentUrl.hostname || link.target === '_blank' || link.hasAttribute('download')) {
            return;
        }
        
        if (targetUrl.href === currentUrl.href) {
            event.preventDefault();
            return;
        }
        
        event.preventDefault();
        loadPage(targetUrl.href);
    });

    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.path) {
            loadPage(event.state.path);
        }
    });

    const initialPath = window.location.href;
    window.history.replaceState({ path: initialPath }, '', initialPath);
    initializePageScripts();
}

document.addEventListener('DOMContentLoaded', initSpa);