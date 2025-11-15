document.addEventListener("DOMContentLoaded", () => {
    // Initialize all functionality
    initNavigation();
    initScrollEffects();
    initMarketData();
    initContactForm();
    initAnimations();
});

// Navigation and Mobile Menu
function initNavigation() {
    const menuIcon = document.getElementById('menu-icon');
    const navbar = document.querySelector('.navbar');
    const body = document.body;

    function toggleMenu() {
        navbar.classList.toggle('active');
        body.classList.toggle('menu-open');
        menuIcon.setAttribute('aria-expanded', navbar.classList.contains('active'));
    }

    if (menuIcon) {
        menuIcon.addEventListener('click', toggleMenu);
        
        // Keyboard accessibility
        menuIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
            }
        });
    }

    // Close menu on link click
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', () => {
            navbar.classList.remove('active');
            body.classList.remove('menu-open');
            menuIcon.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navbar.classList.contains('active')) {
            toggleMenu();
        }
    });
}

// Scroll Effects
function initScrollEffects() {
    const header = document.querySelector('.header');
    
    function handleScroll() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
}

// Market Data Loading
async function initMarketData() {
    try {
        await loadCryptoData();
        await loadStockData();
        await loadForexData();
        startLiveUpdates();
    } catch (error) {
        console.error('Error initializing market data:', error);
        showFallbackData();
    }
}

// Crypto Data
async function loadCryptoData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&order=market_cap_desc&per_page=3&page=1&sparkline=false');
        const data = await response.json();
        
        if (data && data.length > 0) {
            updateCryptoDisplay(data);
        } else {
            throw new Error('No crypto data received');
        }
    } catch (error) {
        console.error('Error loading crypto data:', error);
        useMockCryptoData();
    }
}

function updateCryptoDisplay(data) {
    // Update ticker
    const btcTicker = document.getElementById('ticker-btc');
    if (btcTicker && data[0]) {
        btcTicker.textContent = `$${data[0].current_price.toLocaleString()}`;
    }
    
    // Update visual cards
    const visualBtc = document.getElementById('visual-btc');
    if (visualBtc && data[0]) {
        visualBtc.textContent = `$${data[0].current_price.toLocaleString()}`;
    }
    
    // Update market cap
    const cryptoMarketCap = document.getElementById('crypto-market-cap');
    if (cryptoMarketCap) {
        const totalCap = data.reduce((sum, coin) => sum + coin.market_cap, 0);
        cryptoMarketCap.textContent = `$${(totalCap / 1e12).toFixed(2)}T`;
    }
}

function useMockCryptoData() {
    const mockData = [
        { current_price: 43250.75, market_cap: 845000000000 },
        { current_price: 2580.42, market_cap: 310000000000 },
        { current_price: 98.65, market_cap: 42000000000 }
    ];
    updateCryptoDisplay(mockData);
}

// Stock Data
async function loadStockData() {
    // Using mock data for stocks (you can replace with real API)
    const mockStocks = {
        'ticker-spx': '4,780.94',
        'visual-aapl': '$185.63',
        'stock-market-cap': '$109.2T'
    };
    
    Object.entries(mockStocks).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Forex Data
async function loadForexData() {
    try {
        const response = await fetch('https://api.exchangerate.host/latest?base=USD');
        const data = await response.json();
        
        if (data && data.rates) {
            updateForexDisplay(data.rates);
        } else {
            throw new Error('No forex data received');
        }
    } catch (error) {
        console.error('Error loading forex data:', error);
        useMockForexData();
    }
}

function updateForexDisplay(rates) {
    const eurusdElement = document.getElementById('ticker-eurusd');
    const visualEurusd = document.getElementById('visual-eurusd');
    const forexVolume = document.getElementById('forex-volume');
    
    if (eurusdElement && rates.EUR) {
        eurusdElement.textContent = rates.EUR.toFixed(4);
    }
    
    if (visualEurusd && rates.EUR) {
        visualEurusd.textContent = rates.EUR.toFixed(4);
    }
    
    if (forexVolume) {
        // Mock volume data
        forexVolume.textContent = '$7.5T';
    }
}

function useMockForexData() {
    const mockRates = { EUR: 1.0950 };
    updateForexDisplay(mockRates);
}

// Live Updates Simulation
function startLiveUpdates() {
    // Simulate live price updates
    setInterval(() => {
        updateLivePrices();
    }, 30000); // Update every 30 seconds
}

function updateLivePrices() {
    // Small random price fluctuations for demo
    const priceElements = document.querySelectorAll('[id*="ticker-"], [id*="visual-"]');
    
    priceElements.forEach(element => {
        if (element.textContent && !element.textContent.includes('Loading')) {
            const currentValue = parseFloat(element.textContent.replace(/[$,]/g, ''));
            if (!isNaN(currentValue)) {
                const change = (Math.random() - 0.5) * 0.1; // ±0.05% change
                const newValue = currentValue * (1 + change);
                
                if (element.id.includes('ticker') || element.id.includes('visual')) {
                    if (element.id.includes('usd') || element.id.includes('eurusd')) {
                        element.textContent = newValue.toFixed(4);
                    } else if (element.textContent.includes('$')) {
                        element.textContent = `$${newValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    } else {
                        element.textContent = newValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    }
                }
            }
        }
    });
}

// Contact Form
// Contact Form
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            const formData = new FormData(contactForm);
            
            // Show loading state
            submitButton.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Sending...';
            submitButton.disabled = true;
            
            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                    contactForm.reset();
                } else {
                    throw new Error('Form submission failed');
                }
                
            } catch (error) {
                console.error('Form submission error:', error);
                showNotification('Failed to send message. Please try again or email us directly.', 'error');
            } finally {
                // Reset button
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        });
    }
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error'}'></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Animations
function initAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .stat-card, .visual-card').forEach(el => {
        observer.observe(el);
    });
}

// Fallback data display
function showFallbackData() {
    console.log('Using fallback data');
    // Fallback data is already handled in individual functions
}

// Error boundary
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .bx-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);