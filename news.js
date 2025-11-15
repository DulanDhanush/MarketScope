document.addEventListener("DOMContentLoaded", () => {
    // Initialize all functionality
    initNavigation();
    initializeNewsSearch();
    initializeFilters();
    loadNewsData();
});

let allNews = [];
let displayedCount = 12;
let currentFilter = 'all';
let currentSort = 'latest';
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
function initializeNewsSearch() {
    const searchInput = document.getElementById('news-search');
    const clearBtn = document.getElementById('clear-news-search');
    const resultsInfo = document.getElementById('news-results-info');

    if (searchInput) {
        // Real-time search with debouncing
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            currentSearchTerm = e.target.value.toLowerCase().trim();
            
            searchTimeout = setTimeout(() => {
                filterAndDisplayNews();
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
                filterAndDisplayNews();
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
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-by');
    const loadMoreBtn = document.getElementById('load-more');

    // Category filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update current filter
            currentFilter = btn.getAttribute('data-filter');
            filterAndDisplayNews();
        });
    });

    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            filterAndDisplayNews();
        });
    }

    // Load more button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreNews);
    }
}

// Load news data
async function loadNewsData() {
    try {
        const loadingEl = document.getElementById('loading');
        const newsGrid = document.getElementById('news-grid');
        
        if (loadingEl) {
            loadingEl.style.display = 'block';
            loadingEl.innerHTML = `
                <div class="loading-spinner">
                    <i class='bx bx-loader-alt bx-spin'></i>
                </div>
                <p>Loading latest market news...</p>
            `;
        }
        if (newsGrid) newsGrid.innerHTML = '';

        console.log('Fetching news data...');

        // Try to fetch from news API, fall back to comprehensive demo data
        let newsData = await tryNewsAPIs();
        
        if (!newsData || newsData.length === 0) {
            console.log('Using comprehensive demo news data');
            newsData = generateComprehensiveNewsData();
        }

        // Hide loading state
        if (loadingEl) loadingEl.style.display = 'none';

        allNews = newsData;
        
        // Show breaking news if available
        showBreakingNews(newsData);
        
        filterAndDisplayNews();

    } catch (error) {
        console.error('News data loading error:', error);
        handleDataError(error);
    }
}

// Try multiple news APIs
async function tryNewsAPIs() {
    // In a real application, you would integrate with news APIs like:
    // - NewsAPI
    // - Alpha Vantage News
    // - Financial Modeling Prep News
    // - CryptoPanic (for crypto news)
    
    // For demo purposes, we'll use comprehensive mock data
    // In production, replace this with actual API calls
    
    return generateComprehensiveNewsData();
}

// Generate comprehensive news data
function generateComprehensiveNewsData() {
    const sources = ['Bloomberg', 'Reuters', 'CNBC', 'Financial Times', 'Wall Street Journal', 'CoinDesk', 'Cointelegraph', 'Yahoo Finance'];
    const authors = ['Michael Bloomberg', 'Sarah Thompson', 'James Wilson', 'Emma Davis', 'Robert Chen', 'Lisa Martinez', 'David Kim'];
    
    return [
        // Breaking News
        {
            id: 1,
            title: 'Federal Reserve Announces Major Interest Rate Decision',
            excerpt: 'The Federal Reserve has decided to maintain current interest rates while signaling potential cuts in the coming months amid improving inflation data.',
            content: 'In a highly anticipated meeting, the Federal Open Market Committee voted to keep the federal funds rate unchanged. Chairman Powell emphasized the need for more data before considering rate cuts, but markets reacted positively to the dovish tone.',
            category: 'economy',
            date: '1 hour ago',
            image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400',
            source: 'Reuters',
            author: 'Sarah Thompson',
            readTime: '3 min read',
            trending: true,
            breaking: true
        },
        // Crypto News
        {
            id: 2,
            title: 'Bitcoin Surges Past $45,000 as Institutional Adoption Accelerates',
            excerpt: 'Major financial institutions announce increased Bitcoin allocations, driving the cryptocurrency to new yearly highs with record trading volumes.',
            content: 'BlackRock and Fidelity have significantly increased their Bitcoin ETF holdings, while several pension funds have announced small allocations to digital assets. The move signals growing institutional confidence in cryptocurrency as an asset class.',
            category: 'crypto',
            date: '2 hours ago',
            image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400',
            source: 'CoinDesk',
            author: 'James Wilson',
            readTime: '4 min read',
            trending: true
        },
        {
            id: 3,
            title: 'Ethereum Completes Major Network Upgrade, Gas Fees Drop 40%',
            excerpt: 'The latest Ethereum protocol update successfully implements EIP-4844, significantly reducing transaction costs and improving network scalability.',
            content: 'The Dencun upgrade brings proto-danksharding to Ethereum, enabling layer-2 solutions to operate more efficiently. Early data shows gas fees on popular L2s have dropped by over 40%, making decentralized applications more accessible.',
            category: 'crypto',
            date: '5 hours ago',
            image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
            source: 'Cointelegraph',
            author: 'Emma Davis',
            readTime: '5 min read'
        },
        // Stocks News
        {
            id: 4,
            title: 'Tech Giants Report Strong Q4 Earnings, NASDAQ Hits Record High',
            excerpt: 'Apple, Microsoft, and Google parent Alphabet exceed earnings expectations, driving technology stocks to all-time highs.',
            content: 'Strong performance in cloud computing and AI services has propelled big tech earnings. Microsoft Azure grew 28% year-over-year, while Google Cloud saw 25% growth. Investors remain bullish on AI-driven revenue streams.',
            category: 'stocks',
            date: '3 hours ago',
            image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
            source: 'Bloomberg',
            author: 'Michael Bloomberg',
            readTime: '4 min read',
            trending: true
        },
        {
            id: 5,
            title: 'Tesla Announces Breakthrough in Battery Technology',
            excerpt: 'Elon Musk reveals new 4680 battery cells with 50% more energy density, promising longer range and faster charging for electric vehicles.',
            content: 'The new dry electrode manufacturing process reduces production costs by 56% while improving battery performance. Tesla plans to ramp up production at its Texas Gigafactory, potentially revolutionizing the EV market.',
            category: 'stocks',
            date: '6 hours ago',
            image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400',
            source: 'CNBC',
            author: 'Robert Chen',
            readTime: '3 min read'
        },
        // Forex News
        {
            id: 6,
            title: 'US Dollar Weakens as Inflation Data Comes in Below Expectations',
            excerpt: 'Latest CPI reading shows inflation cooling faster than anticipated, putting pressure on the US Dollar index.',
            content: 'The DXY fell 0.8% following the inflation report, with EUR/USD climbing to 1.0950. Analysts now predict the Fed may cut rates sooner than expected, weakening the dollar further against major currencies.',
            category: 'forex',
            date: '4 hours ago',
            image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400',
            source: 'Financial Times',
            author: 'Lisa Martinez',
            readTime: '3 min read'
        },
        {
            id: 7,
            title: 'Bank of Japan Considers Ending Negative Interest Rate Policy',
            excerpt: 'Speculation grows that the BOJ may shift monetary policy as Japanese inflation remains above target for 12 consecutive months.',
            content: 'The yen strengthened against all major currencies as traders price in potential policy normalization. USD/JPY fell below 147.00 for the first time in two months, with analysts watching for official announcements.',
            category: 'forex',
            date: '8 hours ago',
            image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400',
            source: 'Wall Street Journal',
            author: 'David Kim',
            readTime: '4 min read'
        },
        // Economy News
        {
            id: 8,
            title: 'Global GDP Growth Projections Revised Upward by IMF',
            excerpt: 'The International Monetary Fund upgrades global growth forecasts amid stronger-than-expected economic performance in emerging markets.',
            content: 'The IMF now projects 3.2% global GDP growth for 2024, up from previous estimates of 2.9%. Strong performance in India and Brazil, coupled with resilient US consumer spending, drives the optimistic outlook.',
            category: 'economy',
            date: '1 day ago',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
            source: 'Reuters',
            author: 'Sarah Thompson',
            readTime: '5 min read'
        },
        // Additional news articles...
        {
            id: 9,
            title: 'Gold Prices Hit Record High Amid Geopolitical Uncertainty',
            excerpt: 'Safe-haven demand pushes gold above $2,100 per ounce as Middle East tensions escalate and investors seek portfolio protection.',
            category: 'economy',
            date: '12 hours ago',
            image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400',
            source: 'Bloomberg',
            author: 'Michael Bloomberg',
            readTime: '3 min read'
        },
        {
            id: 10,
            title: 'Amazon Expands AI Integration Across E-commerce Platform',
            excerpt: 'Retail giant announces new AI-powered features for sellers and customers, including automated product descriptions and personalized shopping assistants.',
            category: 'stocks',
            date: '7 hours ago',
            image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400',
            source: 'CNBC',
            author: 'Robert Chen',
            readTime: '4 min read'
        },
        {
            id: 11,
            title: 'DeFi Protocol Surpasses $100 Billion in Total Value Locked',
            excerpt: 'Major decentralized finance platform reaches milestone as institutional investors increasingly participate in DeFi markets.',
            category: 'crypto',
            date: '9 hours ago',
            image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400',
            source: 'CoinDesk',
            author: 'James Wilson',
            readTime: '4 min read'
        },
        {
            id: 12,
            title: 'European Central Bank Maintains Hawkish Stance on Inflation',
            excerpt: 'ECB President Lagarde emphasizes continued vigilance on price stability despite recent improvements in inflation data.',
            category: 'forex',
            date: '10 hours ago',
            image: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=400',
            source: 'Financial Times',
            author: 'Lisa Martinez',
            readTime: '3 min read'
        }
    ];
}

// Show breaking news banner
function showBreakingNews(newsData) {
    const breakingNews = newsData.find(article => article.breaking);
    const breakingEl = document.getElementById('breaking-news');
    const breakingText = document.getElementById('breaking-text');
    
    if (breakingNews && breakingEl && breakingText) {
        breakingText.textContent = breakingNews.title;
        breakingEl.style.display = 'flex';
        
        // Auto-hide breaking news after 24 hours (or refresh)
        setTimeout(() => {
            breakingEl.style.display = 'none';
        }, 24 * 60 * 60 * 1000);
    }
}

// Filter and display news
function filterAndDisplayNews() {
    if (!allNews.length) return;

    let filteredNews = allNews;

    // Apply category filter
    if (currentFilter !== 'all') {
        filteredNews = filteredNews.filter(article => article.category === currentFilter);
    }

    // Apply search filter
    if (currentSearchTerm) {
        filteredNews = filteredNews.filter(article =>
            article.title.toLowerCase().includes(currentSearchTerm) ||
            article.excerpt.toLowerCase().includes(currentSearchTerm) ||
            article.content.toLowerCase().includes(currentSearchTerm) ||
            article.source.toLowerCase().includes(currentSearchTerm)
        );
    }

    // Apply sorting
    filteredNews = sortNews(filteredNews, currentSort);

    // Apply count limit
    const newsToShow = filteredNews.slice(0, displayedCount);

    displayNews(newsToShow);
    updateResultsInfo(filteredNews.length, newsToShow.length);
    updateLoadMoreButton(filteredNews.length, newsToShow.length);
}

// Sort news based on selected criteria
function sortNews(news, sortBy) {
    return [...news].sort((a, b) => {
        switch (sortBy) {
            case 'popular':
                // Sort by trending status and read time (simulated popularity)
                const aPopularity = (a.trending ? 2 : 1) * (a.readTime ? parseInt(a.readTime) : 1);
                const bPopularity = (b.trending ? 2 : 1) * (b.readTime ? parseInt(b.readTime) : 1);
                return bPopularity - aPopularity;
            case 'trending':
                // Sort by trending status and date
                if (a.trending && !b.trending) return -1;
                if (!a.trending && b.trending) return 1;
                return new Date(b.date) - new Date(a.date);
            case 'latest':
            default:
                // Sort by date (newest first)
                return new Date(b.date) - new Date(a.date);
        }
    });
}

// Display news in grid
function displayNews(newsItems) {
    const newsGrid = document.getElementById('news-grid');
    const noResults = document.getElementById('no-results');
    
    if (!newsGrid) return;
    
    newsGrid.innerHTML = '';

    if (newsItems.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';

    newsItems.forEach(article => {
        const newsCard = createNewsCard(article);
        newsGrid.appendChild(newsCard);
    });

    // Highlight search terms if applicable
    if (currentSearchTerm) {
        highlightSearchTerms();
    }
}

// Create news card element
function createNewsCard(article) {
    const card = document.createElement('article');
    card.className = 'news-card';
    card.setAttribute('data-category', article.category);
    
    card.innerHTML = `
        <div class="news-image" style="background-image: url('${article.image}')">
            <div class="news-tag ${article.category}">${article.category.charAt(0).toUpperCase() + article.category.slice(1)}</div>
        </div>
        <div class="news-content">
            <h3>${article.title}</h3>
            <p>${article.excerpt}</p>
            <div class="news-meta">
                <div class="news-source">
                    <span class="source-badge">${article.source}</span>
                    <span>${article.readTime}</span>
                </div>
                <div class="news-actions">
                    <button class="action-btn" title="Bookmark">
                        <i class='bx bx-bookmark'></i>
                    </button>
                    <button class="action-btn" title="Share">
                        <i class='bx bx-share-alt'></i>
                    </button>
                </div>
            </div>
            <div class="news-date">${article.date}</div>
        </div>
    `;

    // Add click event for reading article
    card.addEventListener('click', () => {
        console.log('Reading article:', article.title);
        // Future: Show full article in modal or navigate to article page
        alert(`Opening: ${article.title}\n\n${article.content}`);
    });

    return card;
}

// Highlight search terms in displayed results
function highlightSearchTerms() {
    setTimeout(() => {
        const titleElements = document.querySelectorAll('.news-card h3');
        const excerptElements = document.querySelectorAll('.news-card p');
        
        const highlightText = (element) => {
            const text = element.textContent;
            const regex = new RegExp(`(${currentSearchTerm})`, 'gi');
            element.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
        };

        titleElements.forEach(highlightText);
        excerptElements.forEach(highlightText);
    }, 0);
}

// Update results information
function updateResultsInfo(totalCount, displayedCount) {
    const resultsInfo = document.getElementById('news-results-info');
    if (!resultsInfo) return;
    
    if (currentSearchTerm) {
        resultsInfo.textContent = `Found ${totalCount} articles matching "${currentSearchTerm}"`;
        resultsInfo.style.color = totalCount === 0 ? 'var(--accent-red)' : 'var(--text-secondary)';
    } else if (currentFilter !== 'all') {
        resultsInfo.textContent = `Showing ${displayedCount} ${currentFilter} articles`;
        resultsInfo.style.color = 'var(--text-secondary)';
    } else {
        resultsInfo.textContent = `Showing ${displayedCount} of ${totalCount} articles`;
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

// Load more news
function loadMoreNews() {
    displayedCount += 12;
    filterAndDisplayNews();
}

// Error handling
function handleDataError(error) {
    const loadingEl = document.getElementById('loading');
    const newsGrid = document.getElementById('news-grid');
    
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div class="loading-spinner">
                <i class='bx bx-error-alt'></i>
            </div>
            <p>Failed to load news data</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">
                ${error.message || 'Please check your connection and try again'}
            </p>
            <button class="gradient-btn outline" onclick="loadNewsData()" style="margin-top: 1rem;">
                <i class='bx bx-refresh'></i>
                Retry
            </button>
        `;
        loadingEl.style.color = 'var(--accent-red)';
    }
    
    if (newsGrid) {
        newsGrid.innerHTML = '';
    }
    
    console.error('News data loading error:', error);
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        filterAndDisplayNews,
        sortNews,
        createNewsCard
    };
}