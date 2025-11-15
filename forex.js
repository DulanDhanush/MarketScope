document.addEventListener("DOMContentLoaded", () => {
    // Initialize all functionality
    initNavigation();
    initializeForexSearch();
    initializeFilters();
    loadForexData();
});

let allForexPairs = [];
let displayedCount = 20;
let currentSort = 'popularity';
let currentSearchTerm = '';
let currentPairType = 'all';
let currentBaseCurrency = 'all';

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
function initializeForexSearch() {
    const searchInput = document.getElementById('forex-search');
    const clearBtn = document.getElementById('clear-forex-search');
    const resultsInfo = document.getElementById('forex-results-info');

    if (searchInput) {
        // Real-time search with debouncing
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            currentSearchTerm = e.target.value.toLowerCase().trim();
            
            searchTimeout = setTimeout(() => {
                filterAndDisplayForexPairs();
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
                filterAndDisplayForexPairs();
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
    const pairTypeFilter = document.getElementById('pair-type');
    const sortSelect = document.getElementById('sort-by');
    const baseCurrencyFilter = document.getElementById('base-currency');
    const loadMoreBtn = document.getElementById('load-more');

    if (pairTypeFilter) {
        pairTypeFilter.addEventListener('change', (e) => {
            currentPairType = e.target.value;
            filterAndDisplayForexPairs();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            filterAndDisplayForexPairs();
        });
    }

    if (baseCurrencyFilter) {
        baseCurrencyFilter.addEventListener('change', (e) => {
            currentBaseCurrency = e.target.value;
            filterAndDisplayForexPairs();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreForexPairs);
    }
}

// Load forex data with multiple fallback options
async function loadForexData() {
    try {
        const loadingEl = document.getElementById('loading');
        const forexGrid = document.getElementById('forex-grid');
        
        if (loadingEl) {
            loadingEl.style.display = 'block';
            loadingEl.innerHTML = `
                <div class="loading-spinner">
                    <i class='bx bx-loader-alt bx-spin'></i>
                </div>
                <p>Loading live forex data...</p>
            `;
        }
        if (forexGrid) forexGrid.innerHTML = '';

        console.log('Attempting to fetch forex data...');

        // Try multiple API endpoints with fallbacks
        let rates = await tryMultipleAPIs();
        
        if (!rates) {
            throw new Error('All forex APIs are currently unavailable');
        }

        console.log('Forex rates received:', Object.keys(rates).length, 'currencies');

        // Generate comprehensive forex pairs data
        const pairs = generateForexPairs(rates);
        
        allForexPairs = await calculateForexChanges(pairs, rates);
        
        if (loadingEl) loadingEl.style.display = 'none';

        if (allForexPairs.length === 0) {
            throw new Error('No valid forex data could be processed');
        }

        updateMarketOverview(allForexPairs);
        filterAndDisplayForexPairs();

    } catch (error) {
        console.error('Forex data loading error:', error);
        handleDataError(error);
    }
}

// Try multiple forex API endpoints
async function tryMultipleAPIs() {
    const apis = [
        {
            name: 'exchangerate.host',
            url: 'https://api.exchangerate.host/latest?base=USD',
            parser: (data) => data.rates
        },
        {
            name: 'Frankfurter API',
            url: 'https://api.frankfurter.app/latest?from=USD',
            parser: (data) => data.rates
        },
        {
            name: 'CurrencyAPI',
            url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
            parser: (data) => data.usd
        }
    ];

    for (const api of apis) {
        try {
            console.log(`Trying ${api.name}...`);
            const response = await fetchWithTimeout(api.url, { timeout: 5000 });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const rates = api.parser(data);
            
            if (rates && Object.keys(rates).length > 0) {
                console.log(`Successfully loaded data from ${api.name}`);
                return rates;
            }
        } catch (error) {
            console.warn(`${api.name} failed:`, error.message);
            continue;
        }
    }
    
    return null;
}

// Fetch with timeout
function fetchWithTimeout(url, options = {}) {
    const { timeout = 8000 } = options;
    
    return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

// Generate comprehensive forex pairs
function generateForexPairs(rates) {
    const majorPairs = [
        { pair: 'EUR/USD', base: 'EUR', quote: 'USD', name: 'Euro / US Dollar', type: 'major' },
        { pair: 'GBP/USD', base: 'GBP', quote: 'USD', name: 'British Pound / US Dollar', type: 'major' },
        { pair: 'USD/JPY', base: 'USD', quote: 'JPY', name: 'US Dollar / Japanese Yen', type: 'major' },
        { pair: 'USD/CHF', base: 'USD', quote: 'CHF', name: 'US Dollar / Swiss Franc', type: 'major' },
        { pair: 'AUD/USD', base: 'AUD', quote: 'USD', name: 'Australian Dollar / US Dollar', type: 'major' },
        { pair: 'USD/CAD', base: 'USD', quote: 'CAD', name: 'US Dollar / Canadian Dollar', type: 'major' },
        { pair: 'NZD/USD', base: 'NZD', quote: 'USD', name: 'New Zealand Dollar / US Dollar', type: 'major' }
    ];

    const minorPairs = [
        { pair: 'EUR/GBP', base: 'EUR', quote: 'GBP', name: 'Euro / British Pound', type: 'minor' },
        { pair: 'EUR/JPY', base: 'EUR', quote: 'JPY', name: 'Euro / Japanese Yen', type: 'minor' },
        { pair: 'GBP/JPY', base: 'GBP', quote: 'JPY', name: 'British Pound / Japanese Yen', type: 'minor' },
        { pair: 'EUR/CAD', base: 'EUR', quote: 'CAD', name: 'Euro / Canadian Dollar', type: 'minor' },
        { pair: 'AUD/JPY', base: 'AUD', quote: 'JPY', name: 'Australian Dollar / Japanese Yen', type: 'minor' },
        { pair: 'GBP/CAD', base: 'GBP', quote: 'CAD', name: 'British Pound / Canadian Dollar', type: 'minor' },
        { pair: 'EUR/AUD', base: 'EUR', quote: 'AUD', name: 'Euro / Australian Dollar', type: 'minor' },
        { pair: 'GBP/AUD', base: 'GBP', quote: 'AUD', name: 'British Pound / Australian Dollar', type: 'minor' }
    ];

    const exoticPairs = [
        { pair: 'USD/SGD', base: 'USD', quote: 'SGD', name: 'US Dollar / Singapore Dollar', type: 'exotic' },
        { pair: 'USD/HKD', base: 'USD', quote: 'HKD', name: 'US Dollar / Hong Kong Dollar', type: 'exotic' },
        { pair: 'USD/SEK', base: 'USD', quote: 'SEK', name: 'US Dollar / Swedish Krona', type: 'exotic' },
        { pair: 'USD/NOK', base: 'USD', quote: 'NOK', name: 'US Dollar / Norwegian Krone', type: 'exotic' },
        { pair: 'USD/MXN', base: 'USD', quote: 'MXN', name: 'US Dollar / Mexican Peso', type: 'exotic' },
        { pair: 'USD/ZAR', base: 'USD', quote: 'ZAR', name: 'US Dollar / South African Rand', type: 'exotic' },
        { pair: 'USD/TRY', base: 'USD', quote: 'TRY', name: 'US Dollar / Turkish Lira', type: 'exotic' }
    ];

    // Filter pairs where we have rate data for both currencies
    const allPairs = [...majorPairs, ...minorPairs, ...exoticPairs];
    return allPairs.filter(p => {
        const hasBaseRate = rates[p.base] !== undefined;
        const hasQuoteRate = rates[p.quote] !== undefined;
        
        if (!hasBaseRate) console.warn(`Missing rate for base currency: ${p.base}`);
        if (!hasQuoteRate) console.warn(`Missing rate for quote currency: ${p.quote}`);
        
        return hasBaseRate && hasQuoteRate;
    });
}

// Calculate forex changes with realistic mock data
async function calculateForexChanges(pairs, rates) {
    return pairs.map(p => {
        try {
            let todayRate;

            // Calculate today's rate
            if (p.base === 'USD') {
                todayRate = rates[p.quote];
            } else if (p.quote === 'USD') {
                todayRate = 1 / rates[p.base];
            } else {
                // Cross rate: (USD/quote) / (USD/base)
                todayRate = rates[p.quote] / rates[p.base];
            }

            if (!todayRate || isNaN(todayRate)) {
                console.warn(`Invalid rate for ${p.pair}:`, todayRate);
                return null;
            }

            // Generate realistic 24h change (-2% to +2%)
            const change = (Math.random() * 4 - 2);
            
            // Generate realistic volume data based on pair type
            let volume;
            switch(p.type) {
                case 'major':
                    volume = Math.random() * 500000 + 500000; // 500k-1M
                    break;
                case 'minor':
                    volume = Math.random() * 300000 + 200000; // 200k-500k
                    break;
                case 'exotic':
                    volume = Math.random() * 100000 + 50000; // 50k-150k
                    break;
                default:
                    volume = Math.random() * 100000 + 50000;
            }
            
            // Generate realistic high/low based on change
            const high = todayRate * (1 + Math.abs(change) / 100 + 0.001);
            const low = todayRate * (1 - Math.abs(change) / 100 - 0.001);

            return {
                ...p,
                rate: todayRate,
                change: parseFloat(change.toFixed(2)),
                volume: Math.round(volume),
                high: parseFloat(high.toFixed(4)),
                low: parseFloat(low.toFixed(4))
            };
        } catch (error) {
            console.error(`Error processing ${p.pair}:`, error);
            return null;
        }
    }).filter(p => p !== null && !isNaN(p.rate) && !isNaN(p.change));
}

// Update market overview
function updateMarketOverview(pairs) {
    const dxyPrice = document.getElementById('dxy-price');
    const mostActivePair = pairs.reduce((most, current) => 
        current.volume > most.volume ? current : most, pairs[0]
    );

    if (dxyPrice) {
        // Mock DXY calculation based on major pairs
        const dxyValue = 102.35 + (Math.random() * 0.4 - 0.2);
        dxyPrice.textContent = dxyValue.toFixed(2);
    }
}

// Filter and display forex pairs
function filterAndDisplayForexPairs() {
    if (!allForexPairs.length) return;

    let filteredPairs = allForexPairs;

    // Apply search filter
    if (currentSearchTerm) {
        filteredPairs = filteredPairs.filter(pair =>
            pair.pair.toLowerCase().includes(currentSearchTerm) ||
            pair.name.toLowerCase().includes(currentSearchTerm) ||
            pair.base.toLowerCase().includes(currentSearchTerm) ||
            pair.quote.toLowerCase().includes(currentSearchTerm)
        );
    }

    // Apply pair type filter
    if (currentPairType !== 'all') {
        filteredPairs = filteredPairs.filter(pair => pair.type === currentPairType);
    }

    // Apply base currency filter
    if (currentBaseCurrency !== 'all') {
        filteredPairs = filteredPairs.filter(pair => pair.base === currentBaseCurrency);
    }

    // Apply sorting
    filteredPairs = sortForexPairs(filteredPairs, currentSort);

    // Apply count limit
    const pairsToShow = filteredPairs.slice(0, displayedCount);

    displayForexPairs(pairsToShow);
    updateResultsInfo(filteredPairs.length, pairsToShow.length);
    updateLoadMoreButton(filteredPairs.length, pairsToShow.length);
}

// Sort forex pairs based on selected criteria
function sortForexPairs(pairs, sortBy) {
    return [...pairs].sort((a, b) => {
        switch (sortBy) {
            case 'change':
                return Math.abs(b.change) - Math.abs(a.change);
            case 'volume':
                return b.volume - a.volume;
            case 'popularity':
            default:
                // Major pairs first, then by volume
                const typeOrder = { major: 3, minor: 2, exotic: 1 };
                return (typeOrder[b.type] - typeOrder[a.type]) || (b.volume - a.volume);
        }
    });
}

// Display forex pairs in grid
function displayForexPairs(pairs) {
    const forexGrid = document.getElementById('forex-grid');
    const noResults = document.getElementById('no-results');
    
    if (!forexGrid) return;
    
    forexGrid.innerHTML = '';

    if (pairs.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';

    pairs.forEach(pair => {
        const forexCard = createForexCard(pair);
        forexGrid.appendChild(forexCard);
    });

    // Highlight search terms if applicable
    if (currentSearchTerm) {
        highlightSearchTerms();
    }
}

// Create forex card element
function createForexCard(pair) {
    const card = document.createElement('div');
    card.className = 'forex-card';
    
    const change = pair.change || 0;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeIcon = change >= 0 ? '↗' : '↘';

    card.innerHTML = `
        <div class="forex-header">
            <h3 class="forex-pair">${pair.pair}</h3>
            <span class="forex-type ${pair.type}">${pair.type}</span>
        </div>
        <div class="forex-name">${pair.name}</div>
        <div class="forex-price">${pair.rate ? pair.rate.toFixed(4) : 'N/A'}</div>
        <div class="forex-change ${changeClass}">
            ${changeIcon} ${change ? change.toFixed(2) : '0.00'}%
        </div>
        <div class="forex-details">
            <div class="forex-detail">
                <span class="detail-label">24h High</span>
                <span class="detail-value">${pair.high ? pair.high.toFixed(4) : 'N/A'}</span>
            </div>
            <div class="forex-detail">
                <span class="detail-label">24h Low</span>
                <span class="detail-value">${pair.low ? pair.low.toFixed(4) : 'N/A'}</span>
            </div>
            <div class="forex-detail">
                <span class="detail-label">Volume</span>
                <span class="detail-value">${pair.volume ? pair.volume.toLocaleString() : 'N/A'}</span>
            </div>
            <div class="forex-detail">
                <span class="detail-label">Spread</span>
                <span class="detail-value">${(Math.random() * 3 + 0.5).toFixed(1)} pips</span>
            </div>
        </div>
    `;

    // Add click event for more details
    card.addEventListener('click', () => {
        console.log('Selected forex pair:', pair.pair);
        // Future: Show detailed modal or navigate to forex detail page
    });

    return card;
}

// Highlight search terms in displayed results
function highlightSearchTerms() {
    setTimeout(() => {
        const pairElements = document.querySelectorAll('.forex-pair');
        const nameElements = document.querySelectorAll('.forex-name');
        
        const highlightText = (element) => {
            const text = element.textContent;
            const regex = new RegExp(`(${currentSearchTerm})`, 'gi');
            element.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
        };

        pairElements.forEach(highlightText);
        nameElements.forEach(highlightText);
    }, 0);
}

// Update results information
function updateResultsInfo(totalCount, displayedCount) {
    const resultsInfo = document.getElementById('forex-results-info');
    if (!resultsInfo) return;
    
    if (currentSearchTerm) {
        resultsInfo.textContent = `Found ${totalCount} currency pairs matching "${currentSearchTerm}"`;
        resultsInfo.style.color = totalCount === 0 ? 'var(--accent-red)' : 'var(--text-secondary)';
    } else {
        resultsInfo.textContent = `Showing ${displayedCount} of ${totalCount} currency pairs`;
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

// Load more forex pairs
function loadMoreForexPairs() {
    displayedCount += 20;
    filterAndDisplayForexPairs();
}

// Enhanced error handling with demo data fallback
function handleDataError(error) {
    const loadingEl = document.getElementById('loading');
    const forexGrid = document.getElementById('forex-grid');
    
    console.warn('Loading demo forex data due to API failure:', error.message);
    
    // Load comprehensive demo data
    loadDemoForexData();
    
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div class="loading-spinner">
                <i class='bx bx-wifi-off'></i>
            </div>
            <p>Using demo data (Live API unavailable)</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">
                ${error.message || 'Network connection issue'}
            </p>
            <button class="gradient-btn outline" onclick="loadForexData()" style="margin-top: 1rem;">
                <i class='bx bx-refresh'></i>
                Retry Live Data
            </button>
        `;
        loadingEl.style.color = 'var(--accent-orange)';
    }
}

// Comprehensive demo forex data
function loadDemoForexData() {
    const demoPairs = [
        // Major Pairs
        { pair: 'EUR/USD', base: 'EUR', quote: 'USD', name: 'Euro / US Dollar', type: 'major', rate: 1.0850, change: 0.25, volume: 850000, high: 1.0872, low: 1.0821 },
        { pair: 'GBP/USD', base: 'GBP', quote: 'USD', name: 'British Pound / US Dollar', type: 'major', rate: 1.2650, change: -0.15, volume: 720000, high: 1.2678, low: 1.2623 },
        { pair: 'USD/JPY', base: 'USD', quote: 'JPY', name: 'US Dollar / Japanese Yen', type: 'major', rate: 148.25, change: 0.42, volume: 950000, high: 148.67, low: 147.89 },
        { pair: 'USD/CHF', base: 'USD', quote: 'CHF', name: 'US Dollar / Swiss Franc', type: 'major', rate: 0.8820, change: -0.33, volume: 480000, high: 0.8845, low: 0.8792 },
        { pair: 'AUD/USD', base: 'AUD', quote: 'USD', name: 'Australian Dollar / US Dollar', type: 'major', rate: 0.6520, change: 0.18, volume: 550000, high: 0.6543, low: 0.6491 },
        { pair: 'USD/CAD', base: 'USD', quote: 'CAD', name: 'US Dollar / Canadian Dollar', type: 'major', rate: 1.3520, change: -0.27, volume: 520000, high: 1.3556, low: 1.3498 },
        { pair: 'NZD/USD', base: 'NZD', quote: 'USD', name: 'New Zealand Dollar / US Dollar', type: 'major', rate: 0.6120, change: 0.31, volume: 380000, high: 0.6145, low: 0.6092 },
        
        // Minor Pairs
        { pair: 'EUR/GBP', base: 'EUR', quote: 'GBP', name: 'Euro / British Pound', type: 'minor', rate: 0.8570, change: 0.12, volume: 320000, high: 0.8589, low: 0.8551 },
        { pair: 'EUR/JPY', base: 'EUR', quote: 'JPY', name: 'Euro / Japanese Yen', type: 'minor', rate: 160.85, change: 0.67, volume: 450000, high: 161.23, low: 160.12 },
        { pair: 'GBP/JPY', base: 'GBP', quote: 'JPY', name: 'British Pound / Japanese Yen', type: 'minor', rate: 187.45, change: 0.28, volume: 420000, high: 187.89, low: 186.78 },
        { pair: 'EUR/CAD', base: 'EUR', quote: 'CAD', name: 'Euro / Canadian Dollar', type: 'minor', rate: 1.4670, change: -0.15, volume: 280000, high: 1.4698, low: 1.4634 },
        { pair: 'AUD/JPY', base: 'AUD', quote: 'JPY', name: 'Australian Dollar / Japanese Yen', type: 'minor', rate: 96.75, change: 0.52, volume: 350000, high: 97.12, low: 96.23 },
        { pair: 'GBP/CAD', base: 'GBP', quote: 'CAD', name: 'British Pound / Canadian Dollar', type: 'minor', rate: 1.7120, change: -0.08, volume: 290000, high: 1.7156, low: 1.7089 },
        
        // Exotic Pairs
        { pair: 'USD/SGD', base: 'USD', quote: 'SGD', name: 'US Dollar / Singapore Dollar', type: 'exotic', rate: 1.3420, change: 0.05, volume: 120000, high: 1.3445, low: 1.3398 },
        { pair: 'USD/HKD', base: 'USD', quote: 'HKD', name: 'US Dollar / Hong Kong Dollar', type: 'exotic', rate: 7.8120, change: -0.02, volume: 150000, high: 7.8145, low: 7.8098 },
        { pair: 'USD/SEK', base: 'USD', quote: 'SEK', name: 'US Dollar / Swedish Krona', type: 'exotic', rate: 10.4520, change: 0.35, volume: 98000, high: 10.4789, low: 10.4234 },
        { pair: 'USD/NOK', base: 'USD', quote: 'NOK', name: 'US Dollar / Norwegian Krone', type: 'exotic', rate: 10.8920, change: 0.28, volume: 85000, high: 10.9178, low: 10.8656 },
        { pair: 'USD/MXN', base: 'USD', quote: 'MXN', name: 'US Dollar / Mexican Peso', type: 'exotic', rate: 17.2450, change: -0.45, volume: 110000, high: 17.2890, low: 17.2012 },
        { pair: 'USD/ZAR', base: 'USD', quote: 'ZAR', name: 'US Dollar / South African Rand', type: 'exotic', rate: 18.8920, change: 0.82, volume: 75000, high: 19.0123, low: 18.7567 },
        { pair: 'USD/TRY', base: 'USD', quote: 'TRY', name: 'US Dollar / Turkish Lira', type: 'exotic', rate: 32.4560, change: 1.25, volume: 65000, high: 32.7890, low: 32.1234 }
    ];

    allForexPairs = demoPairs;
    updateMarketOverview(allForexPairs);
    filterAndDisplayForexPairs();
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        filterAndDisplayForexPairs,
        sortForexPairs,
        createForexCard
    };
}