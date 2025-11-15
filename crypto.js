document.addEventListener("DOMContentLoaded", () => {
    // Initialize all functionality
    initNavigation();
    initializeSearch();
    initializeFilters();
    loadCryptoPageData();
});

let allCryptos = [];
let displayedCount = 20;
let currentSort = 'market_cap';
let currentSearchTerm = '';

// Navigation
function initNavigation() {
    const menuIcon = document.getElementById('menu-icon');
    const navbar = document.querySelector('.navbar');
    
    if (menuIcon) {
        menuIcon.addEventListener('click', () => {
            navbar.classList.toggle('active');
            menuIcon.setAttribute('aria-expanded', navbar.classList.contains('active'));
        });
    }

    // Close menu on link click
    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', () => {
            navbar.classList.remove('active');
            menuIcon.setAttribute('aria-expanded', 'false');
        });
    });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('crypto-search');
    const clearSearch = document.getElementById('clear-crypto-search');
    const resultsInfo = document.getElementById('crypto-results-info');

    if (searchInput) {
        // Real-time search with debouncing
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            currentSearchTerm = e.target.value.toLowerCase().trim();
            
            searchTimeout = setTimeout(() => {
                filterAndDisplayCryptos();
                if (clearSearch) {
                    clearSearch.style.display = currentSearchTerm ? 'flex' : 'none';
                }
            }, 300);
        });

        // Clear search
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                currentSearchTerm = '';
                filterAndDisplayCryptos();
                clearSearch.style.display = 'none';
                if (resultsInfo) resultsInfo.textContent = '';
                searchInput.focus();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
}

// Filter controls
function initializeFilters() {
    const sortSelect = document.getElementById('sort-by');
    const countSelect = document.getElementById('show-count');
    const loadMoreBtn = document.getElementById('load-more');

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            filterAndDisplayCryptos();
        });
    }

    if (countSelect) {
        countSelect.addEventListener('change', (e) => {
            displayedCount = e.target.value === 'all' ? allCryptos.length : parseInt(e.target.value);
            filterAndDisplayCryptos();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreCryptos);
    }
}

// Load crypto data
async function loadCryptoPageData() {
    try {
        const loadingEl = document.getElementById('loading');
        const cryptoGrid = document.getElementById('crypto-grid');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (cryptoGrid) cryptoGrid.innerHTML = '';

        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h');
        
        if (!response.ok) {
            throw new Error(`API response error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (loadingEl) loadingEl.style.display = 'none';

        if (data && data.length > 0) {
            allCryptos = data;
            updateMarketStats(data);
            filterAndDisplayCryptos();
        } else {
            throw new Error('No cryptocurrency data received');
        }
    } catch (error) {
        console.error('Error loading crypto page data:', error);
        handleDataError(error);
    }
}

// Update market statistics
function updateMarketStats(data) {
    const totalMarketCap = data.reduce((sum, coin) => sum + coin.market_cap, 0);
    const totalVolume = data.reduce((sum, coin) => sum + coin.total_volume, 0);
    const btcDominance = data.find(coin => coin.symbol === 'btc')?.market_cap / totalMarketCap * 100 || 0;

    const marketCapEl = document.getElementById('total-market-cap');
    const volumeEl = document.getElementById('total-volume');
    const dominanceEl = document.getElementById('btc-dominance');

    if (marketCapEl) marketCapEl.textContent = `$${(totalMarketCap / 1e12).toFixed(2)}T`;
    if (volumeEl) volumeEl.textContent = `$${(totalVolume / 1e9).toFixed(1)}B`;
    if (dominanceEl) dominanceEl.textContent = `${btcDominance.toFixed(1)}%`;
}

// Filter and display cryptos
function filterAndDisplayCryptos() {
    if (!allCryptos.length) return;

    let filteredCryptos = allCryptos;

    // Apply search filter
    if (currentSearchTerm) {
        filteredCryptos = allCryptos.filter(coin =>
            coin.name.toLowerCase().includes(currentSearchTerm) ||
            coin.symbol.toLowerCase().includes(currentSearchTerm)
        );
    }

    // Apply sorting
    filteredCryptos = sortCryptos(filteredCryptos, currentSort);

    // Apply count limit
    const cryptosToShow = displayedCount === 'all' ? 
        filteredCryptos : 
        filteredCryptos.slice(0, displayedCount);

    displayCryptos(cryptosToShow);
    updateResultsInfo(filteredCryptos.length, cryptosToShow.length);
    updateLoadMoreButton(filteredCryptos.length, cryptosToShow.length);
}

// Sort cryptos based on selected criteria
function sortCryptos(cryptos, sortBy) {
    return [...cryptos].sort((a, b) => {
        switch (sortBy) {
            case 'price':
                return b.current_price - a.current_price;
            case 'volume':
                return b.total_volume - a.total_volume;
            case 'change':
                return (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0);
            case 'market_cap':
            default:
                return b.market_cap - a.market_cap;
        }
    });
}

// Display cryptos in grid
function displayCryptos(cryptos) {
    const cryptoGrid = document.getElementById('crypto-grid');
    const noResults = document.getElementById('no-results');
    
    if (!cryptoGrid) return;
    
    cryptoGrid.innerHTML = '';

    if (cryptos.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';

    cryptos.forEach(coin => {
        const cryptoCard = createCryptoCard(coin);
        cryptoGrid.appendChild(cryptoCard);
    });

    // Highlight search terms if applicable
    if (currentSearchTerm) {
        highlightSearchTerms();
    }
}

// Create crypto card element
function createCryptoCard(coin) {
    const card = document.createElement('div');
    card.className = 'crypto-card';
    
    const change = coin.price_change_percentage_24h || 0;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeIcon = change >= 0 ? '↗' : '↘';
    const marketCap = coin.market_cap ? `$${(coin.market_cap / 1e6).toFixed(0)}M` : 'N/A';
    const volume = coin.total_volume ? `$${(coin.total_volume / 1e6).toFixed(0)}M` : 'N/A';

    card.innerHTML = `
        <div class="crypto-header">
            <div class="crypto-icon">${coin.symbol ? coin.symbol.toUpperCase().charAt(0) : '?'}</div>
            <div class="crypto-info">
                <h3 class="crypto-name">${coin.name || 'Unknown'}</h3>
                <p class="crypto-symbol">${coin.symbol ? coin.symbol.toUpperCase() : 'N/A'}</p>
            </div>
        </div>
        <div class="crypto-price">$${coin.current_price ? coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : 'N/A'}</div>
        <div class="crypto-change ${changeClass}">
            ${changeIcon} ${change ? change.toFixed(2) : '0.00'}%
        </div>
        <div class="crypto-details">
            <p><span>Market Cap:</span> <span>${marketCap}</span></p>
            <p><span>24h Volume:</span> <span>${volume}</span></p>
        </div>
    `;

    // Add click event for more details (could be expanded)
    card.addEventListener('click', () => {
        console.log('Selected crypto:', coin.name);
        // Future: Show detailed modal or navigate to crypto detail page
    });

    return card;
}

// Highlight search terms in displayed results
function highlightSearchTerms() {
    setTimeout(() => {
        const nameElements = document.querySelectorAll('.crypto-name');
        const symbolElements = document.querySelectorAll('.crypto-symbol');
        
        const highlightText = (element) => {
            const text = element.textContent;
            const regex = new RegExp(`(${currentSearchTerm})`, 'gi');
            element.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
        };

        nameElements.forEach(highlightText);
        symbolElements.forEach(highlightText);
    }, 0);
}

// Update results information
function updateResultsInfo(totalCount, displayedCount) {
    const resultsInfo = document.getElementById('crypto-results-info');
    if (!resultsInfo) return;
    
    if (currentSearchTerm) {
        resultsInfo.textContent = `Found ${totalCount} cryptocurrencies matching "${currentSearchTerm}"`;
        resultsInfo.style.color = totalCount === 0 ? 'var(--accent-red)' : 'var(--text-secondary)';
    } else {
        resultsInfo.textContent = `Showing ${displayedCount} of ${totalCount} cryptocurrencies`;
        resultsInfo.style.color = 'var(--text-secondary)';
    }
}

// Update load more button visibility
function updateLoadMoreButton(totalCount, displayedCount) {
    const loadMoreContainer = document.getElementById('load-more-container');
    const showCountSelect = document.getElementById('show-count');
    
    if (loadMoreContainer && showCountSelect) {
        const showAll = showCountSelect.value === 'all';
        const hasMore = displayedCount < totalCount;
        
        loadMoreContainer.style.display = (!showAll && hasMore) ? 'block' : 'none';
    }
}

// Load more cryptos
function loadMoreCryptos() {
    displayedCount += 20;
    filterAndDisplayCryptos();
}

// Error handling
function handleDataError(error) {
    const loadingEl = document.getElementById('loading');
    const cryptoGrid = document.getElementById('crypto-grid');
    
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div class="loading-spinner">
                <i class='bx bx-error-alt'></i>
            </div>
            <p>Failed to load cryptocurrency data</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">
                ${error.message || 'Please check your connection and try again'}
            </p>
            <button class="gradient-btn outline" onclick="loadCryptoPageData()" style="margin-top: 1rem;">
                <i class='bx bx-refresh'></i>
                Retry
            </button>
        `;
        loadingEl.style.color = 'var(--accent-red)';
    }
    
    if (cryptoGrid) {
        cryptoGrid.innerHTML = '';
    }
    
    console.error('Cryptocurrency data loading error:', error);
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        filterAndDisplayCryptos,
        sortCryptos,
        createCryptoCard
    };
}