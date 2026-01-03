// Mobile Navigation
function toggleMobileNav() {
    const nav = document.getElementById('mobileNavLinks');
    nav.classList.toggle('open');
}

function closeMobileNav() {
    const nav = document.getElementById('mobileNavLinks');
    nav.classList.remove('open');
}

// Highlight active section in TOC
function initTocHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const tocLinks = document.querySelectorAll('.toc-links a');

    function updateActiveLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink();
}

// Fetch books from Goodreads RSS
async function fetchGoodreadsBooks() {
    const GOODREADS_USER_ID = '92875108';
    const RSS_URL = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=read`;
    
    // Multiple CORS proxies to try
    const CORS_PROXIES = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/'
    ];
    
    const container = document.getElementById('booksContainer');
    if (!container) return;
    
    // Timeout helper
    const fetchWithTimeout = (url, timeout = 8000) => {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), timeout)
            )
        ]);
    };
    
    // Try each proxy
    for (const proxy of CORS_PROXIES) {
        try {
            console.log('Trying proxy:', proxy);
            const response = await fetchWithTimeout(proxy + encodeURIComponent(RSS_URL));
            if (!response.ok) continue;
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, 'text/xml');
            
            // Check for parse errors
            if (xml.querySelector('parsererror')) {
                console.log('XML parse error, trying next proxy');
                continue;
            }
            
            const items = xml.querySelectorAll('item');
            if (items.length === 0) {
                console.log('No items found, trying next proxy');
                continue;
            }
            
            // Get the most recent 10 books
            const books = [];
            items.forEach((item, index) => {
                if (index < 10) {
                    const title = item.querySelector('title')?.textContent || '';
                    const author = item.querySelector('author_name')?.textContent || '';
                    const rating = parseInt(item.querySelector('user_rating')?.textContent || '0');
                    books.push({ title, author, rating });
                }
            });
            
            if (books.length === 0) {
                showFallback();
                return;
            }
            
            // Render books
            container.innerHTML = books.map(book => `
                <div class="book">
                    <span class="book-rating">${renderStars(book.rating)}</span>
                    <div class="book-info">
                        <h4>${escapeHtml(book.title)}</h4>
                        <span class="author">${escapeHtml(book.author)}</span>
                    </div>
                </div>
            `).join('');
            
            console.log('Successfully loaded', books.length, 'books');
            return; // Success!
            
        } catch (error) {
            console.log('Proxy failed:', proxy, error.message);
            continue;
        }
    }
    
    // All proxies failed, show fallback
    showFallback();
}

function showFallback() {
    const container = document.getElementById('booksContainer');
    if (!container) return;
    
    // Static fallback with some known favorites
    container.innerHTML = `
        <div class="book">
            <span class="book-rating">★★★★★</span>
            <div class="book-info">
                <h4>Man's Search for Meaning</h4>
                <span class="author">Viktor E. Frankl</span>
            </div>
        </div>
        <div class="book">
            <span class="book-rating">★★★★★</span>
            <div class="book-info">
                <h4>The Psychology of Money</h4>
                <span class="author">Morgan Housel</span>
            </div>
        </div>
        <div class="book">
            <span class="book-rating">★★★★☆</span>
            <div class="book-info">
                <h4>Becoming</h4>
                <span class="author">Michelle Obama</span>
            </div>
        </div>
    `;
}

function renderStars(rating) {
    const filled = '★'.repeat(rating);
    const empty = '☆'.repeat(5 - rating);
    return filled + empty;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', () => {
    initTocHighlight();
    fetchGoodreadsBooks();
});
