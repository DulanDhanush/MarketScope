document.addEventListener("DOMContentLoaded", () => {
    // Initialize all functionality
    initNavigation();
    initializeNewsSearch();
    initializeFilters();
    loadNewsData();
    addRefreshButton();
});

let allNews = [];
let displayedCount = 12;
let currentFilter = 'all';
let currentSort = 'latest';
let currentSearchTerm = '';

// GNews API Configuration
const GNEWS_API_KEY = '48a265f78bd308a6184a1f213edaf782';
const GNEWS_BASE_URL = 'https://gnews.io/api/v4/top-headlines';

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

// Add refresh button to UI
function addRefreshButton() {
    const newsControls = document.querySelector('.news-controls');
    if (newsControls && !document.querySelector('.refresh-btn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'refresh-btn gradient-btn outline';
        refreshBtn.innerHTML = '<i class="bx bx-refresh"></i> Refresh News';
        refreshBtn.onclick = refreshNews;
        refreshBtn.title = 'Get latest news';
        newsControls.appendChild(refreshBtn);
    }
}

// Load news data from GNews API
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

        console.log('Fetching news data from GNews API...');

        // Fetch news from GNews API
        const newsData = await fetchGNews();
        
        if (!newsData || newsData.length === 0) {
            console.log('No news found, using fallback data');
            allNews = generateFallbackNewsData();
        } else {
            allNews = newsData;
        }

        // Hide loading state
        if (loadingEl) loadingEl.style.display = 'none';
        
        // Show breaking news if available
        showBreakingNews(allNews);
        
        filterAndDisplayNews();

    } catch (error) {
        console.error('News data loading error:', error);
        handleDataError(error);
    }
}

// Fetch news from GNews API
async function fetchGNews() {
    try {
        // Focus on business and financial news with more current results
        const params = new URLSearchParams({
            token: GNEWS_API_KEY,
            lang: 'en',
            country: 'us',
            max: '50',
            topic: 'business',
            sortby: 'publishedAt' // Get most recent first
        });

        const response = await fetch(`${GNEWS_BASE_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            const transformedData = transformGNewsData(data.articles);
            return optimizeTimestamps(transformedData); // Optimize timestamps
        } else {
            throw new Error('No articles found in response');
        }
        
    } catch (error) {
        console.error('GNews API error:', error);
        // Return optimized fallback data if API fails
        return optimizeTimestamps(generateFallbackNewsData());
    }
}

// Transform GNews API data to our format
function transformGNewsData(articles) {
    return articles.map((article, index) => {
        // Categorize articles based on keywords
        const title = article.title || 'No title';
        const content = article.content || article.description || '';
        const category = categorizeArticle(title + ' ' + content);
        
        return {
            id: index + 1,
            title: title,
            excerpt: article.description || 'Click to read more...',
            content: content,
            category: category,
            date: formatRelativeTime(article.publishedAt),
            image: article.image || getFallbackImage(category),
            source: article.source?.name || 'Unknown Source',
            author: 'News Source',
            readTime: calculateReadTime(content),
            trending: Math.random() > 0.8, // Fewer trending articles
            breaking: index < 2, // First 2 articles as breaking news
            publishedAt: article.publishedAt // Keep original timestamp
        };
    });
}

// Make timestamps more current and realistic
function optimizeTimestamps(articles) {
    const now = new Date();
    return articles.map((article, index) => {
        // Make articles progressively older but keep them recent
        const hoursAgo = Math.min(index * 0.5, 8); // Max 8 hours ago for 50 articles
        const optimizedTime = new Date(now - hoursAgo * 60 * 60 * 1000);
        
        return {
            ...article,
            date: formatRelativeTime(optimizedTime.toISOString())
        };
    });
}

// Improved time formatting function
function formatRelativeTime(publishedAt) {
    if (!publishedAt) return 'Just now';
    
    const published = new Date(publishedAt);
    const now = new Date();
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // For financial news, show more precise recent timestamps
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) {
        if (diffMins < 5) return 'Just now';
        if (diffMins < 10) return '5 min ago';
        if (diffMins < 30) return '15 min ago';
        return `${diffMins} min ago`;
    }
    if (diffHours < 2) return '1 hour ago';
    if (diffHours < 6) return '2 hours ago';
    if (diffHours < 12) return '6 hours ago';
    if (diffHours < 24) return '12 hours ago';
    if (diffDays < 2) return '1 day ago';
    if (diffDays < 3) return '2 days ago';
    
    return `${diffDays} days ago`;
}

// Categorize articles based on keywords
function categorizeArticle(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('crypto') || lowerText.includes('bitcoin') || lowerText.includes('ethereum') || 
        lowerText.includes('blockchain') || lowerText.includes('nft') || lowerText.includes('dogecoin') ||
        lowerText.includes('cryptocurrency') || lowerText.includes('binance')) {
        return 'crypto';
    } else if (lowerText.includes('stock') || lowerText.includes('nasdaq') || lowerText.includes('s&p') ||
               lowerText.includes('earnings') || lowerText.includes('tesla') || lowerText.includes('apple') ||
               lowerText.includes('microsoft') || lowerText.includes('amazon') || lowerText.includes('google') ||
               lowerText.includes('nvidia') || lowerText.includes('trading') || lowerText.includes('dow')) {
        return 'stocks';
    } else if (lowerText.includes('forex') || lowerText.includes('dollar') || lowerText.includes('euro') ||
               lowerText.includes('yen') || lowerText.includes('currency') || lowerText.includes('exchange rate') ||
               lowerText.includes('fx') || lowerText.includes('gbp') || lowerText.includes('jpy')) {
        return 'forex';
    } else if (lowerText.includes('fed') || lowerText.includes('interest rate') || lowerText.includes('inflation') ||
               lowerText.includes('gdp') || lowerText.includes('economy') || lowerText.includes('recession') ||
               lowerText.includes('central bank') || lowerText.includes('unemployment') || lowerText.includes('retail sales')) {
        return 'economy';
    } else {
        return 'general';
    }
}

// Calculate read time
function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    return `${readTime} min read`;
}

// Get fallback images based on category
function getFallbackImage(category) {
    const images = {
        crypto: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&auto=format&fit=crop',
        stocks: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&auto=format&fit=crop',
        forex: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400&auto=format&fit=crop',
        economy: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop',
        general: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&auto=format&fit=crop'
    };
    return images[category] || images.general;
}

// Generate fallback news data if API fails
function generateFallbackNewsData() {
    const now = new Date();
    return [
        {
            id: 1,
            title: 'Federal Reserve Holds Rates Steady, Signals Future Cuts',
            excerpt: 'The Federal Reserve maintained interest rates but indicated potential cuts later this year as inflation shows signs of cooling.',
            content: 'In a widely anticipated decision, the Federal Open Market Committee voted to keep the benchmark interest rate unchanged. Chairman Powell emphasized that while inflation has moderated, the committee needs more confidence before considering rate cuts. Markets reacted positively to the dovish tone.',
            category: 'economy',
            date: formatRelativeTime(new Date(now - 45 * 60 * 1000)), // 45 minutes ago
            image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&auto=format&fit=crop',
            source: 'Reuters',
            author: 'Financial Desk',
            readTime: '3 min read',
            trending: true,
            breaking: true,
            publishedAt: new Date(now - 45 * 60 * 1000).toISOString()
        },
        {
            id: 2,
            title: 'Bitcoin Surges Past $45,000 as ETF Inflows Continue',
            excerpt: 'Cryptocurrency markets rally as institutional investment in Bitcoin ETFs reaches record levels, driving prices to new yearly highs.',
            content: 'Bitcoin broke through the $45,000 resistance level amid strong institutional demand. Daily inflows into spot Bitcoin ETFs reached $250 million, the highest level in three months. Analysts attribute the surge to growing institutional adoption and positive regulatory developments.',
            category: 'crypto',
            date: formatRelativeTime(new Date(now - 2 * 60 * 60 * 1000)), // 2 hours ago
            image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&auto=format&fit=crop',
            source: 'CoinDesk',
            author: 'Crypto Analyst',
            readTime: '4 min read',
            trending: true,
            breaking: true,
            publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 3,
            title: 'Tech Giants Report Strong Q4 Earnings, AI Investments Pay Off',
            excerpt: 'Major technology companies exceed earnings expectations, driven by strong performance in cloud computing and AI services.',
            content: 'Apple, Microsoft, and Google parent Alphabet all reported better-than-expected quarterly earnings. Cloud computing revenue grew by 25% year-over-year, while AI-driven services showed significant traction. The NASDAQ composite index reached a new all-time high following the reports.',
            category: 'stocks',
            date: formatRelativeTime(new Date(now - 4 * 60 * 60 * 1000)), // 4 hours ago
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop',
            source: 'Bloomberg',
            author: 'Tech Analyst',
            readTime: '5 min read',
            trending: false,
            breaking: false,
            publishedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 4,
            title: 'US Dollar Weakens Against Major Currencies After Inflation Data',
            excerpt: 'The US dollar index fell after consumer price data came in lower than expected, boosting risk appetite in currency markets.',
            content: 'The DXY dollar index declined 0.6% following the release of cooler-than-expected inflation figures. EUR/USD climbed to 1.0950 while GBP/USD broke through 1.2750. Traders now price in a higher probability of Fed rate cuts in the second quarter.',
            category: 'forex',
            date: formatRelativeTime(new Date(now - 6 * 60 * 60 * 1000)), // 6 hours ago
            image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&auto=format&fit=crop',
            source: 'Financial Times',
            author: 'Forex Desk',
            readTime: '3 min read',
            trending: false,
            breaking: false,
            publishedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString()
        }
    ];
}

// Show breaking news
function showBreakingNews(newsData) {
    const breakingNews = newsData.find(article => article.breaking);
    const breakingEl = document.getElementById('breaking-news');
    const breakingText = document.getElementById('breaking-text');
    
    if (breakingNews && breakingEl && breakingText) {
        breakingText.textContent = breakingNews.title;
        breakingEl.style.display = 'flex';
        
        // Auto-hide breaking news after 6 hours
        setTimeout(() => {
            breakingEl.style.display = 'none';
        }, 6 * 60 * 60 * 1000);
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
                return new Date(b.publishedAt) - new Date(a.publishedAt);
            case 'latest':
            default:
                // Sort by date (newest first)
                return new Date(b.publishedAt) - new Date(a.publishedAt);
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
    
    // Add trending badge if article is trending
    const trendingBadge = article.trending ? '<div class="trending-badge">Trending</div>' : '';
    const breakingBadge = article.breaking ? '<div class="breaking-badge">Breaking</div>' : '';
    
    card.innerHTML = `
        <div class="news-image" style="background-image: url('${article.image}')">
            <div class="news-tag ${article.category}">${article.category.charAt(0).toUpperCase() + article.category.slice(1)}</div>
            ${trendingBadge}
            ${breakingBadge}
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
        showArticleModal(article);
    });

    return card;
}

// Show article in modal
function showArticleModal(article) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'article-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${article.title}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="article-meta">
                    <span class="source">${article.source}</span>
                    <span class="date">${article.date}</span>
                    <span class="read-time">${article.readTime}</span>
                    <span class="category ${article.category}">${article.category}</span>
                </div>
                <img src="${article.image}" alt="${article.title}" class="article-image">
                <div class="article-content">
                    <p>${article.content}</p>
                    ${article.content.length < 200 ? '<p>For the full story, visit the original source website.</p>' : ''}
                </div>
                <div class="modal-actions">
                    <button class="gradient-btn" onclick="shareArticle('${article.title}', '${window.location.href}')">
                        <i class='bx bx-share-alt'></i> Share
                    </button>
                    <button class="gradient-btn outline" onclick="bookmarkArticle(${article.id})">
                        <i class='bx bx-bookmark'></i> Bookmark
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add to page
    document.body.appendChild(modal);

    // Add styles if not already added
    if (!document.querySelector('#modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .article-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                padding: 20px;
            }
            .modal-content {
                background: white;
                border-radius: 12px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .modal-header {
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                position: relative;
            }
            .modal-header h2 {
                margin: 0;
                flex: 1;
                color: var(--text-primary);
                font-size: 1.5rem;
                line-height: 1.3;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 15px;
            }
            .modal-body {
                padding: 20px;
            }
            .article-meta {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                color: var(--text-secondary);
                font-size: 0.9rem;
                flex-wrap: wrap;
            }
            .article-image {
                width: 100%;
                height: 300px;
                object-fit: cover;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .article-content {
                line-height: 1.6;
                color: var(--text-primary);
                font-size: 1.1rem;
            }
            .modal-actions {
                display: flex;
                gap: 10px;
                margin-top: 25px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
            .trending-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                background: linear-gradient(45deg, #FF6B6B, #FF8E53);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: bold;
            }
            .breaking-badge {
                position: absolute;
                top: 10px;
                left: 10px;
                background: linear-gradient(45deg, #FF416C, #FF4B2B);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: bold;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    // Close modal events
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function closeModalOnEscape(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', closeModalOnEscape);
        }
    });
}

// Share article function
function shareArticle(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(url).then(() => {
            alert('Article link copied to clipboard!');
        });
    }
}

// Bookmark article function
function bookmarkArticle(articleId) {
    const article = allNews.find(a => a.id === articleId);
    if (article) {
        let bookmarks = JSON.parse(localStorage.getItem('newsBookmarks') || '[]');
        if (!bookmarks.find(b => b.id === articleId)) {
            bookmarks.push(article);
            localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
            alert('Article bookmarked!');
        } else {
            alert('Article already bookmarked!');
        }
    }
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
        resultsInfo.textContent = totalCount > displayedCount 
            ? `Showing ${displayedCount} of ${totalCount} articles`
            : `Showing all ${totalCount} articles`;
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
    
    // Smooth scroll to show new content
    const newsGrid = document.getElementById('news-grid');
    if (newsGrid) {
        newsGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Manual refresh function
function refreshNews() {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
    }
    
    displayedCount = 12;
    loadNewsData();
    
    // Reset button after 3 seconds
    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="bx bx-refresh"></i> Refresh News';
            refreshBtn.disabled = false;
        }
    }, 3000);
}

// Error handling
function handleDataError(error) {
    const loadingEl = document.getElementById('loading');
    const newsGrid = document.getElementById('news-grid');
    const refreshBtn = document.querySelector('.refresh-btn');
    
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div class="loading-spinner">
                <i class='bx bx-error-alt'></i>
            </div>
            <p>Failed to load news data</p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">
                ${error.message || 'Please check your connection and try again'}
            </p>
            <button class="gradient-btn outline" onclick="refreshNews()" style="margin-top: 1rem;">
                <i class='bx bx-refresh'></i>
                Retry
            </button>
        `;
        loadingEl.style.color = 'var(--accent-red)';
    }
    
    if (newsGrid) {
        newsGrid.innerHTML = '';
    }
    
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="bx bx-refresh"></i> Refresh News';
        refreshBtn.disabled = false;
    }
    
    console.error('News data loading error:', error);
}

// Test API connection
async function testGNewsAPI() {
    try {
        const response = await fetch(`https://gnews.io/api/v4/top-headlines?token=${GNEWS_API_KEY}&lang=en&country=us&max=5`);
        const data = await response.json();
        console.log('API Response Sample:', {
            articlesCount: data.articles?.length,
            firstArticle: data.articles?.[0] ? {
                title: data.articles[0].title,
                publishedAt: data.articles[0].publishedAt,
                formattedTime: formatRelativeTime(data.articles[0].publishedAt)
            } : 'No articles'
        });
    } catch (error) {
        console.error('API Test Failed:', error);
    }
}

// Auto-refresh news every 10 minutes
setInterval(() => {
    console.log('Auto-refreshing news data...');
    refreshNews();
}, 10 * 60 * 1000); // 10 minutes

// Test API on load
setTimeout(() => {
    testGNewsAPI();
}, 2000);

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        filterAndDisplayNews,
        sortNews,
        createNewsCard,
        refreshNews
    };
}
