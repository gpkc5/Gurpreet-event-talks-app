/**
 * BigQuery Release Notes Explorer - Frontend Core
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releasesData = [];
    let filteredReleases = [];
    let selectedUpdate = null; // Stores { date, type, text, element }
    let currentFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const lastUpdatedTime = document.getElementById('last-updated-time');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const releasesContainer = document.getElementById('releases-container');
    
    // States elements
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const emptyState = document.getElementById('empty-state');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    
    // Composer elements
    const composerEmptyState = document.getElementById('composer-empty-state');
    const composerActiveState = document.getElementById('composer-active-state');
    const composerSelectedDate = document.getElementById('composer-selected-date');
    const composerSelectedBadge = document.getElementById('composer-selected-badge');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCountDisplay = document.getElementById('char-count-display');
    const charProgressFill = document.getElementById('char-progress-fill');
    const tweetWarningMsg = document.getElementById('tweet-warning-msg');
    const deselectBtn = document.getElementById('deselect-btn');
    const copyBtn = document.getElementById('copy-btn');
    const tweetBtn = document.getElementById('tweet-btn');
    const toastContainer = document.getElementById('toast-container');
    const filterTabs = document.querySelectorAll('.filter-tab');

    // ==========================================================================
    // INITIALIZATION & FETCHING
    // ==========================================================================

    // Initial load
    fetchReleases();

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleases);
    retryBtn.addEventListener('click', fetchReleases);
    
    deselectBtn.addEventListener('click', deselectCard);
    tweetTextarea.addEventListener('input', updateCharCount);
    
    copyBtn.addEventListener('click', copyTweetText);
    tweetBtn.addEventListener('click', shareOnTwitter);
    
    resetFiltersBtn.addEventListener('click', resetFilters);
    clearSearchBtn.addEventListener('click', clearSearch);

    // Search and filters
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        applyFiltersAndSearch();
    });

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            applyFiltersAndSearch();
        });
    });

    // Fetch data from Flask API
    async function fetchReleases() {
        setLoading(true);
        try {
            const response = await fetch('/api/releases');
            const result = await response.json();
            
            if (result.status === 'success') {
                releasesData = result.data;
                setLastUpdated();
                applyFiltersAndSearch();
                showToast('Successfully refreshed release notes.', 'success');
            } else {
                showError(result.message || 'An error occurred while fetching the release notes.');
            }
        } catch (error) {
            showError('Network error. Failed to communicate with the Flask backend.');
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }

    // ==========================================================================
    // STATE MANAGERS
    // ==========================================================================

    function setLoading(isLoading) {
        if (isLoading) {
            refreshIcon.classList.add('spin');
            refreshBtn.disabled = true;
            loadingState.style.display = 'flex';
            releasesContainer.style.display = 'none';
            errorState.style.display = 'none';
            emptyState.style.display = 'none';
        } else {
            refreshIcon.classList.remove('spin');
            refreshBtn.disabled = false;
            loadingState.style.display = 'none';
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorState.style.display = 'flex';
        releasesContainer.style.display = 'none';
        emptyState.style.display = 'none';
        showToast('Failed to fetch updates.', 'error');
    }

    function setLastUpdated() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastUpdatedTime.textContent = `Last updated: ${timeStr}`;
    }

    // ==========================================================================
    // FILTER & SEARCH LOGIC (IN-MEMORY)
    // ==========================================================================

    function applyFiltersAndSearch() {
        // Deep clone or filter the parsed data
        filteredReleases = [];

        releasesData.forEach(entry => {
            // Filter the individual updates inside this date entry
            const matchedUpdates = entry.updates.filter(update => {
                const matchesType = currentFilter === 'all' || 
                                    update.type.toLowerCase() === currentFilter;
                
                const matchesSearch = !searchQuery || 
                                      update.type.toLowerCase().includes(searchQuery) ||
                                      update.text.toLowerCase().includes(searchQuery) ||
                                      entry.date.toLowerCase().includes(searchQuery);
                
                return matchesType && matchesSearch;
            });

            if (matchedUpdates.length > 0) {
                filteredReleases.push({
                    ...entry,
                    updates: matchedUpdates
                });
            }
        });

        renderReleases();
    }

    function resetFilters() {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        currentFilter = 'all';
        filterTabs.forEach(t => {
            if (t.getAttribute('data-filter') === 'all') {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });
        applyFiltersAndSearch();
    }

    function clearSearch() {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        applyFiltersAndSearch();
        searchInput.focus();
    }

    // ==========================================================================
    // RENDERING NOTES
    // ==========================================================================

    function renderReleases() {
        releasesContainer.innerHTML = '';

        if (filteredReleases.length === 0) {
            releasesContainer.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        releasesContainer.style.display = 'block';

        filteredReleases.forEach((entry, entryIndex) => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';

            // Date Header
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            
            const dateTitle = document.createElement('h2');
            dateTitle.className = 'date-title';
            dateTitle.textContent = entry.date;

            const dateLine = document.createElement('div');
            dateLine.className = 'date-line';

            dateHeader.appendChild(dateTitle);
            dateHeader.appendChild(dateLine);

            if (entry.link) {
                const dateLink = document.createElement('a');
                dateLink.className = 'date-link';
                dateLink.href = entry.link;
                dateLink.target = '_blank';
                dateLink.rel = 'noopener noreferrer';
                dateLink.title = 'View official docs for this release date';
                dateLink.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
                dateHeader.appendChild(dateLink);
            }

            dateGroup.appendChild(dateHeader);

            // Cards Stack
            const cardsStack = document.createElement('div');
            cardsStack.className = 'cards-stack';

            entry.updates.forEach((update, updateIndex) => {
                const card = document.createElement('article');
                card.className = 'update-card';
                card.setAttribute('tabindex', '0');
                card.setAttribute('aria-label', `${update.type} update on ${entry.date}`);

                // Mark selected if it matches
                if (selectedUpdate && 
                    selectedUpdate.date === entry.date && 
                    selectedUpdate.text === update.text) {
                    card.classList.add('selected');
                    // Update active reference element
                    selectedUpdate.element = card;
                }

                // Card header with badge & actions
                const headerRow = document.createElement('div');
                headerRow.className = 'card-header-row';

                const typeLower = update.type.toLowerCase();
                const badgeClass = ['feature', 'issue', 'changed', 'deprecated'].includes(typeLower) 
                    ? `badge-${typeLower}` 
                    : 'badge-update';
                
                const badge = document.createElement('span');
                badge.className = `type-badge ${badgeClass}`;
                badge.textContent = update.type;

                const cardActions = document.createElement('div');
                cardActions.className = 'card-actions';

                const shareBtn = document.createElement('button');
                shareBtn.className = 'action-icon-btn share-btn';
                shareBtn.title = 'Draft X post for this update';
                shareBtn.innerHTML = '<i class="fa-brands fa-x-twitter"></i>';
                
                cardActions.appendChild(shareBtn);
                headerRow.appendChild(badge);
                headerRow.appendChild(cardActions);

                // Card body
                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';
                cardBody.innerHTML = update.html;

                card.appendChild(headerRow);
                card.appendChild(cardBody);

                // Click handler to select
                const handleSelect = (e) => {
                    // Avoid trigger selection on links clicks in body
                    if (e.target.tagName === 'A') return;
                    selectCard(entry, update, card);
                };

                card.addEventListener('click', handleSelect);
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectCard(entry, update, card);
                    }
                });

                cardsStack.appendChild(card);
            });

            dateGroup.appendChild(cardsStack);
            releasesContainer.appendChild(dateGroup);
        });
    }

    // ==========================================================================
    // COMPOSER LOGIC & SOCIAL INTEGRATION
    // ==========================================================================

    function selectCard(entry, update, cardElement) {
        // Deselect previous
        const prevSelected = document.querySelector('.update-card.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        // Select new
        cardElement.classList.add('selected');
        
        selectedUpdate = {
            date: entry.date,
            type: update.type,
            text: update.text,
            link: entry.link,
            element: cardElement
        };

        // Populate Composer
        composerSelectedDate.textContent = entry.date;
        
        const typeLower = update.type.toLowerCase();
        composerSelectedBadge.className = 'type-badge';
        const badgeClass = ['feature', 'issue', 'changed', 'deprecated'].includes(typeLower) 
            ? `badge-${typeLower}` 
            : 'badge-update';
        composerSelectedBadge.classList.add(badgeClass);
        composerSelectedBadge.textContent = update.type;

        // Draft text creation
        tweetTextarea.value = draftTweetText(entry.date, update.type, update.text, entry.link);

        // Transition views
        composerEmptyState.style.display = 'none';
        composerActiveState.style.display = 'flex';

        updateCharCount();
        
        // Mobile scroll to composer
        if (window.innerWidth <= 1024) {
            composerActiveState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        showToast(`Selected ${update.type} update to share.`, 'info');
    }

    function deselectCard() {
        if (selectedUpdate && selectedUpdate.element) {
            selectedUpdate.element.classList.remove('selected');
        }
        selectedUpdate = null;
        composerActiveState.style.display = 'none';
        composerEmptyState.style.display = 'flex';
    }

    function draftTweetText(date, type, bodyText, link) {
        // Build base text components
        const prefix = `📢 BigQuery [${date}] | ${type}:\n`;
        const hashtag = `\n#GoogleCloud #BigQuery`;
        const linkStr = link ? `\n🔗 docs: ${link}` : '';
        
        // Calculate max allowed length for body text
        const reservedLength = prefix.length + hashtag.length + linkStr.length;
        const maxBodyLength = 280 - reservedLength;
        
        let cleanedBody = bodyText;
        if (cleanedBody.length > maxBodyLength) {
            // Truncate body with ellipses
            cleanedBody = cleanedBody.substring(0, maxBodyLength - 3) + '...';
        }
        
        return `${prefix}${cleanedBody}${linkStr}${hashtag}`;
    }

    function updateCharCount() {
        const len = tweetTextarea.value.length;
        charCountDisplay.textContent = `${len} / 280`;

        // Calculate progress percentage
        const pct = Math.min((len / 280) * 100, 100);
        charProgressFill.style.width = `${pct}%`;

        if (len > 280) {
            charCountDisplay.classList.add('warning');
            charProgressFill.classList.add('warning');
            tweetWarningMsg.style.display = 'flex';
            tweetBtn.disabled = true;
            tweetBtn.style.opacity = '0.5';
            tweetBtn.style.cursor = 'not-allowed';
        } else {
            charCountDisplay.classList.remove('warning');
            charProgressFill.classList.remove('warning');
            tweetWarningMsg.style.display = 'none';
            tweetBtn.disabled = false;
            tweetBtn.style.opacity = '1';
            tweetBtn.style.cursor = 'pointer';
        }
    }

    function copyTweetText() {
        tweetTextarea.select();
        tweetTextarea.setSelectionRange(0, 99999); // Mobile compatibility
        
        try {
            navigator.clipboard.writeText(tweetTextarea.value);
            showToast('Post text copied to clipboard!', 'success');
        } catch (err) {
            // Fallback
            document.execCommand('copy');
            showToast('Post text copied!', 'success');
        }
    }

    function shareOnTwitter() {
        const text = tweetTextarea.value;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(tweetUrl, '_blank', 'noopener,noreferrer');
        showToast('Opening X / Twitter intent...', 'success');
    }

    // ==========================================================================
    // TOAST SYSTEM
    // ==========================================================================

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconHtml = '<i class="fa-solid fa-circle-info toast-icon"></i>';
        if (type === 'success') {
            iconHtml = '<i class="fa-solid fa-circle-check toast-icon"></i>';
        } else if (type === 'error') {
            iconHtml = '<i class="fa-solid fa-circle-exclamation toast-icon"></i>';
        }

        toast.innerHTML = `
            ${iconHtml}
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
});
