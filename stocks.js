document.addEventListener("DOMContentLoaded", () => {
    // Initialize all functionality
    initNavigation();
    initializeStockSearch();
    initializeFilters();
    loadStocksPageData();
});

let allStocks = [];
let displayedCount = 20;
let currentSort = 'market_cap';
let currentSearchTerm = '';
let currentMarket = 'all';
let currentSector = 'all';

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
function initializeStockSearch() {
    const searchInput = document.getElementById('stocks-search');
    const clearBtn = document.getElementById('clear-stocks-search');
    const resultsInfo = document.getElementById('stocks-results-info');

    if (searchInput) {
        // Real-time search with debouncing
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            currentSearchTerm = e.target.value.toLowerCase().trim();
            
            searchTimeout = setTimeout(() => {
                filterAndDisplayStocks();
                if (clearBtn) {
                    clearBtn.style.display = currentSearchTerm ? 'flex' : 'none';
                }
            }, 300);
        });

        // Clear search
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                currentSearchTerm = '';
                filterAndDisplayStocks();
                clearBtn.style.display = 'none';
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
    const marketFilter = document.getElementById('market-filter');
    const sortSelect = document.getElementById('sort-by');
    const sectorFilter = document.getElementById('sector-filter');
    const loadMoreBtn = document.getElementById('load-more');

    if (marketFilter) {
        marketFilter.addEventListener('change', (e) => {
            currentMarket = e.target.value;
            filterAndDisplayStocks();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            filterAndDisplayStocks();
        });
    }

    if (sectorFilter) {
        sectorFilter.addEventListener('change', (e) => {
            currentSector = e.target.value;
            filterAndDisplayStocks();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreStocks);
    }
}

// Load stock data
async function loadStocksPageData() {
    try {
        const loadingEl = document.getElementById('loading');
        const stocksGrid = document.getElementById('stocks-grid');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (stocksGrid) stocksGrid.innerHTML = '';

        // Using comprehensive mock data (in real app, use financial API)
        const stocks = await fetchStockData();
        
        if (loadingEl) loadingEl.style.display = 'none';

        if (stocks && stocks.length > 0) {
            allStocks = stocks;
            updateMarketIndices(stocks);
            filterAndDisplayStocks();
        } else {
            throw new Error('No stock data received');
        }
    } catch (error) {
        console.error('Error loading stocks page data:', error);
        handleDataError(error);
    }
}

// Fetch stock data (mock implementation)
async function fetchStockData() {
    // In a real application, this would fetch from a financial API
    // For demo purposes, using comprehensive mock data
    return [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 182.63, change: 1.25, market_cap: 2850000000000, volume: 58342900, sector: 'technology', market: 'nasdaq', pe_ratio: 29.8, dividend: 0.96 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', price: 407.81, change: -0.42, market_cap: 3030000000000, volume: 25481900, sector: 'technology', market: 'nasdaq', pe_ratio: 36.2, dividend: 3.00 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 138.21, change: 2.15, market_cap: 1750000000000, volume: 28765400, sector: 'technology', market: 'nasdaq', pe_ratio: 24.1, dividend: 0.00 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 174.45, change: -1.08, market_cap: 1800000000000, volume: 39876500, sector: 'consumer', market: 'nasdaq', pe_ratio: 58.3, dividend: 0.00 },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.42, change: 3.67, market_cap: 790000000000, volume: 98765400, sector: 'consumer', market: 'nasdaq', pe_ratio: 76.4, dividend: 0.00 },
        { symbol: 'META', name: 'Meta Platforms Inc.', price: 468.05, change: -0.75, market_cap: 1190000000000, volume: 18765400, sector: 'technology', market: 'nasdaq', pe_ratio: 32.1, dividend: 0.00 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 118.11, change: 5.23, market_cap: 2910000000000, volume: 48765400, sector: 'technology', market: 'nasdaq', pe_ratio: 73.8, dividend: 0.16 },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 188.91, change: 0.89, market_cap: 542000000000, volume: 9876500, sector: 'financial', market: 'nyse', pe_ratio: 11.2, dividend: 4.20 },
        { symbol: 'JNJ', name: 'Johnson & Johnson', price: 157.23, change: 0.34, market_cap: 380000000000, volume: 5876500, sector: 'healthcare', market: 'nyse', pe_ratio: 15.8, dividend: 4.76 },
        { symbol: 'V', name: 'Visa Inc.', price: 269.45, change: -0.56, market_cap: 552000000000, volume: 6876500, sector: 'financial', market: 'nyse', pe_ratio: 31.5, dividend: 2.08 },
        { symbol: 'PG', name: 'Procter & Gamble', price: 156.78, change: 0.67, market_cap: 370000000000, volume: 4876500, sector: 'consumer', market: 'nyse', pe_ratio: 26.4, dividend: 3.76 },
        { symbol: 'UNH', name: 'UnitedHealth Group', price: 546.32, change: -1.23, market_cap: 503000000000, volume: 2876500, sector: 'healthcare', market: 'nyse', pe_ratio: 20.1, dividend: 7.52 },
        { symbol: 'HD', name: 'Home Depot Inc.', price: 354.67, change: 1.45, market_cap: 347000000000, volume: 3876500, sector: 'consumer', market: 'nyse', pe_ratio: 23.8, dividend: 8.36 },
        { symbol: 'BAC', name: 'Bank of America', price: 33.45, change: 0.89, market_cap: 267000000000, volume: 45876500, sector: 'financial', market: 'nyse', pe_ratio: 10.5, dividend: 0.96 },
        { symbol: 'XOM', name: 'Exxon Mobil', price: 102.45, change: -0.78, market_cap: 408000000000, volume: 15876500, sector: 'energy', market: 'nyse', pe_ratio: 11.8, dividend: 3.80 },
        { symbol: 'CVX', name: 'Chevron Corporation', price: 149.32, change: 0.45, market_cap: 281000000000, volume: 9876500, sector: 'energy', market: 'nyse', pe_ratio: 13.2, dividend: 6.04 },
        { symbol: 'KO', name: 'Coca-Cola Company', price: 59.87, change: 0.23, market_cap: 258000000000, volume: 12876500, sector: 'consumer', market: 'nyse', pe_ratio: 24.1, dividend: 1.84 },
        { symbol: 'PFE', name: 'Pfizer Inc.', price: 28.67, change: 0.45, market_cap: 162000000000, volume: 35876500, sector: 'healthcare', market: 'nyse', pe_ratio: 75.4, dividend: 1.68 },
        { symbol: 'T', name: 'AT&T Inc.', price: 16.45, change: -0.12, market_cap: 117000000000, volume: 45876500, sector: 'communication', market: 'nyse', pe_ratio: 8.9, dividend: 1.11 },
        { symbol: 'WMT', name: 'Walmart Inc.', price: 169.23, change: 0.34, market_cap: 456000000000, volume: 5876500, sector: 'consumer', market: 'nyse', pe_ratio: 27.8, dividend: 2.28 }
    ];
}

// Update market indices
function updateMarketIndices(stocks) {
    // Mock market index calculations
    const sp500El = document.getElementById('sp500-price');
    const nasdaqEl = document.getElementById('nasdaq-price');
    const dowEl = document.getElementById('dow-price');

    if (sp500El) sp500El.textContent = '4,780.94';
    if (nasdaqEl) nasdaqEl.textContent = '16,987.55';
    if (dowEl) dowEl.textContent = '37,468.61';
}

// Filter and display stocks
function filterAndDisplayStocks() {
    if (!allStocks.length) return;

    let filteredStocks = allStocks;

    // Apply search filter
    if (currentSearchTerm) {
        filteredStocks = filteredStocks.filter(stock =>
            stock.name.toLowerCase().includes(currentSearchTerm) ||
            stock.symbol.toLowerCase().includes(currentSearchTerm) ||
            stock.sector.toLowerCase().includes(currentSearchTerm)
        );
    }

    // Apply market filter
    if (currentMarket !== 'all') {
        filteredStocks = filteredStocks.filter(stock => stock.market === currentMarket);
    }

    // Apply sector filter
    if (currentSector !== 'all') {
        filteredStocks = filteredStocks.filter(stock => stock.sector === currentSector);
    }

    // Apply sorting
    filteredStocks = sortStocks(filteredStocks, currentSort);

    // Apply count limit
    const stocksToShow = filteredStocks.slice(0, displayedCount);

    displayStocks(stocksToShow);
    updateResultsInfo(filteredStocks.length, stocksToShow.length);
    updateLoadMoreButton(filteredStocks.length, stocksToShow.length);
}

// Sort stocks based on selected criteria
function sortStocks(stocks, sortBy) {
    return [...stocks].sort((a, b) => {
        switch (sortBy) {
            case 'price':
                return b.price - a.price;
            case 'volume':
                return b.volume - a.volume;
            case 'change':
                return b.change - a.change;
            case 'market_cap':
            default:
                return b.market_cap - a.market_cap;
        }
    });
}

// Display stocks in grid
function displayStocks(stocks) {
    const stocksGrid = document.getElementById('stocks-grid');
    const noResults = document.getElementById('no-results');
    
    if (!stocksGrid) return;
    
    stocksGrid.innerHTML = '';

    if (stocks.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';

    stocks.forEach(stock => {
        const stockCard = createStockCard(stock);
        stocksGrid.appendChild(stockCard);
    });

    // Highlight search terms if applicable
    if (currentSearchTerm) {
        highlightSearchTerms();
    }
}

// Create stock card element
function createStockCard(stock) {
    const card = document.createElement('div');
    card.className = 'stock-card';
    
    const change = stock.change || 0;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeIcon = change >= 0 ? '↗' : '↘';
    const marketCap = stock.market_cap ? `$${(stock.market_cap / 1e9).toFixed(1)}B` : 'N/A';
    const volume = stock.volume ? stock.volume.toLocaleString() : 'N/A';
    const peRatio = stock.pe_ratio ? stock.pe_ratio.toFixed(1) : 'N/A';
    const dividend = stock.dividend ? `${stock.dividend.toFixed(2)}%` : 'N/A';

    card.innerHTML = `
        <div class="stock-header">
            <div class="stock-icon">${stock.symbol.charAt(0)}</div>
            <div class="stock-info">
                <h3 class="stock-name">${stock.name}</h3>
                <p class="stock-symbol">${stock.symbol}</p>
                <span class="stock-sector sector-${stock.sector}">${stock.sector.toUpperCase()}</span>
            </div>
        </div>
        <div class="stock-price">$${stock.price ? stock.price.toFixed(2) : 'N/A'}</div>
        <div class="stock-change ${changeClass}">
            ${changeIcon} ${change ? change.toFixed(2) : '0.00'}%
        </div>
        <div class="stock-details">
            <div class="stock-detail">
                <span class="detail-label">Market Cap</span>
                <span class="detail-value">${marketCap}</span>
            </div>
            <div class="stock-detail">
                <span class="detail-label">Volume</span>
                <span class="detail-value">${volume}</span>
            </div>
            <div class="stock-detail">
                <span class="detail-label">P/E Ratio</span>
                <span class="detail-value">${peRatio}</span>
            </div>
            <div class="stock-detail">
                <span class="detail-label">Dividend</span>
                <span class="detail-value">${dividend}</span>
            </div>
        </div>
    `;

    // Add click event for more details
    card.addEventListener('click', () => {
        console.log('Selected stock:', stock.name);
        // Future: Show detailed modal or navigate to stock detail page
    });

    return card;
}

// Highlight search terms in displayed results
function highlightSearchTerms() {
    setTimeout(() => {
        const nameElements = document.querySelectorAll('.stock-name');
        const symbolElements = document.querySelectorAll('.stock-symbol');
        const sectorElements = document.querySelectorAll('.stock-sector');
        
        const highlightText = (element) => {
            const text = element.textContent;
            const regex = new RegExp(`(${currentSearchTerm})`, 'gi');
            element.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
        };

        nameElements.forEach(highlightText);
        symbolElements.forEach(highlightText);
        sectorElements.forEach(highlightText);
    }, 0);
}

// Update results information
function updateResultsInfo(totalCount, displayedCount) {
    const resultsInfo = document.getElementById('stocks-results-info');
    if (!resultsInfo) return;
    
    if (currentSearchTerm) {
        resultsInfo.textContent = `Found ${totalCount} stocks matching "${currentSearchTerm}"`;
        resultsInfo.style.color = totalCount === 0 ? 'var(--accent-red)' : 'var(--text-secondary)';
    } else {
        resultsInfo.textContent = `Showing ${displayedCount} of ${totalCount} stocks`;
        resultsInfo.style.color = 'var(--text-secondary)';
    }
}

// Update load more button visibility
function updateLoadMoreButton(totalCount, displayedCount) {
    const loadMoreContainer = document.getElementById('load-more-container');
    
    if (loadMoreContainer) {
        const hasMore = displayedCount < totalCount;
        loadMoreContainer.style.display = hasMore ? 'block' : 'none';
    }
}

// Load more stocks
function loadMoreStocks() {
    displayedCount += 20;
    filterAndDisplayStocks();
}

// Error handling
function handleDataError(error) {
    const loadingEl = document.getElementById('loading');
    const stocksGrid = document.getElementById('stocks-grid');
    
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div class="loading-spinner">
                <i class='bx bx-error-alt'></i>
            </div>
            <p>Failed to load stock data</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">
                ${error.message || 'Please check your connection and try again'}
            </p>
            <button class="gradient-btn outline" onclick="loadStocksPageData()" style="margin-top: 1rem;">
                <i class='bx bx-refresh'></i>
                Retry
            </button>
        `;
        loadingEl.style.color = 'var(--accent-red)';
    }
    
    if (stocksGrid) {
        stocksGrid.innerHTML = '';
    }
    
    console.error('Stock data loading error:', error);
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        filterAndDisplayStocks,
        sortStocks,
        createStockCard
    };
}