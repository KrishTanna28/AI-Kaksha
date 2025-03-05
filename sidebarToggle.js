class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.toggleButton = document.querySelector('.toggle-sidebar');
        this.mainContent = document.querySelector('.main-content');
        this.init();
    }

    init() {
        if (!this.sidebar || !this.toggleButton) return;

        // Set active menu item
        this.setActiveMenuItem();

        // Setup event listeners
        this.setupEventListeners();

        // Initial state based on screen size
        this.handleScreenSize();
    }

    setActiveMenuItem() {
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        document.querySelectorAll('.nav-link').forEach(item => {
            if (item.getAttribute('href') === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    setupEventListeners() {
        // Toggle sidebar
        this.toggleButton.addEventListener('click', () => {
            this.sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-active');
            if (this.mainContent) {
                this.mainContent.classList.toggle('sidebar-hidden');
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (event) => {
            if (window.innerWidth <= 768) {
                const isClickInsideSidebar = this.sidebar.contains(event.target);
                const isClickOnToggleButton = this.toggleButton.contains(event.target);
                
                if (!isClickInsideSidebar && !isClickOnToggleButton && this.sidebar.classList.contains('active')) {
                    this.sidebar.classList.remove('active');
                    document.body.classList.remove('sidebar-active');
                    if (this.mainContent) {
                        this.mainContent.classList.remove('sidebar-hidden');
                    }
                }
            }
        });

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.handleScreenSize(), 250);
        });
    }

    handleScreenSize() {
        if (window.innerWidth > 768) {
            this.sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-active');
            if (this.mainContent) {
                this.mainContent.classList.remove('sidebar-hidden');
            }
        }
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
}); 