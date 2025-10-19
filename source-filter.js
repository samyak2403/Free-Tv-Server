// Source Filter and Search Manager
class SourceFilterManager {
    constructor() {
        this.allSources = [];
        this.filteredSources = [];
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.regionFilter = 'all';
        this.sortBy = 'priority';
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('sourceSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
                this.updateClearButton();
            });
        }

        // Clear search button
        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                this.searchTerm = '';
                this.applyFilters();
                this.updateClearButton();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.applyFilters();
            });
        }

        // Region filter
        const regionFilter = document.getElementById('regionFilter');
        if (regionFilter) {
            regionFilter.addEventListener('change', (e) => {
                this.regionFilter = e.target.value;
                this.applyFilters();
            });
        }

        // Sort by
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // Reset filters
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    updateSources(sources) {
        this.allSources = sources;
        this.updateRegionFilter();
        this.applyFilters();
    }

    updateRegionFilter() {
        const regionFilter = document.getElementById('regionFilter');
        if (!regionFilter) return;

        // Get unique regions
        const regions = [...new Set(this.allSources
            .map(s => s.region)
            .filter(r => r && r.trim() !== '')
        )].sort();

        // Update dropdown
        const currentValue = regionFilter.value;
        regionFilter.innerHTML = '<option value="all">All Regions</option>';
        
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionFilter.appendChild(option);
        });

        // Restore previous selection if still valid
        if (regions.includes(currentValue)) {
            regionFilter.value = currentValue;
        }
    }

    applyFilters() {
        let filtered = [...this.allSources];

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(source => {
                return source.name.toLowerCase().includes(this.searchTerm) ||
                       source.url.toLowerCase().includes(this.searchTerm) ||
                       (source.region && source.region.toLowerCase().includes(this.searchTerm));
            });
        }

        // Apply status filter
        if (this.statusFilter !== 'all') {
            const isEnabled = this.statusFilter === 'enabled';
            filtered = filtered.filter(source => source.enabled === isEnabled);
        }

        // Apply region filter
        if (this.regionFilter !== 'all') {
            filtered = filtered.filter(source => source.region === this.regionFilter);
        }

        // Apply sorting
        filtered = this.sortSources(filtered);

        this.filteredSources = filtered;
        this.renderFilteredSources();
        this.updateSourcesInfo();
    }

    sortSources(sources) {
        switch (this.sortBy) {
            case 'name':
                return sources.sort((a, b) => a.name.localeCompare(b.name));
            
            case 'recent':
                return sources.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
            
            case 'priority':
            default:
                return sources.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        }
    }

    renderFilteredSources() {
        const sourcesGrid = document.querySelector('.sources-grid');
        if (!sourcesGrid) return;

        sourcesGrid.innerHTML = '';

        if (this.filteredSources.length === 0) {
            this.showNoResults(sourcesGrid);
            return;
        }

        this.filteredSources.forEach(source => {
            const sourceCard = this.createSourceCard(source);
            sourcesGrid.appendChild(sourceCard);
        });
    }

    createSourceCard(source) {
        const sourceCard = document.createElement('div');
        sourceCard.className = 'source-card';
        const statusClass = source.enabled ? 'online' : 'offline';
        const statusText = source.enabled ? 'ENABLED' : 'DISABLED';
        const lastUpdated = source.lastUpdated ? new Date(source.lastUpdated).toLocaleString() : 'Never';

        // Highlight search term
        const highlightedName = this.highlightText(source.name, this.searchTerm);
        const highlightedUrl = this.highlightText(source.url, this.searchTerm);
        const highlightedRegion = this.highlightText(source.region || 'N/A', this.searchTerm);

        sourceCard.innerHTML = `
            <div class="source-header">
                <div>
                    <h4 class="source-name">${highlightedName}</h4>
                    <span class="source-priority">Priority: ${source.priority}</span>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${source.enabled ? 'checked' : ''} 
                           onchange="toggleSource('${source.id}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="source-info">
                <div class="source-info-item">
                    <span><i class="fas fa-link"></i> URL:</span>
                    <strong class="source-url" title="${source.url}">${highlightedUrl}</strong>
                </div>
                <div class="source-info-item">
                    <span><i class="fas fa-globe"></i> Region:</span>
                    <strong>${highlightedRegion}</strong>
                </div>
                <div class="source-info-item">
                    <span><i class="fas fa-clock"></i> Last Updated:</span>
                    <strong>${lastUpdated}</strong>
                </div>
                <div class="source-info-item">
                    <span><i class="fas fa-info-circle"></i> Status:</span>
                    <strong class="source-status ${statusClass}">${statusText}</strong>
                </div>
            </div>
            <div class="source-actions">
                <button class="btn-edit" onclick="editSource('${source.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-copy" onclick="copySourceUrl('${source.url}')">
                    <i class="fas fa-copy"></i> Copy URL
                </button>
                <button class="btn-delete" onclick="deleteSource('${source.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        return sourceCard;
    }

    highlightText(text, searchTerm) {
        if (!searchTerm || !text) return text;

        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    showNoResults(container) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        
        let message = 'No sources found';
        let icon = 'fa-inbox';
        
        if (this.searchTerm) {
            message = `No sources match "${this.searchTerm}"`;
            icon = 'fa-search';
        } else if (this.statusFilter !== 'all' || this.regionFilter !== 'all') {
            message = 'No sources match the selected filters';
            icon = 'fa-filter';
        }

        noResults.innerHTML = `
            <i class="fas ${icon}"></i>
            <h3>${message}</h3>
            <p>Try adjusting your search or filters</p>
        `;
        
        container.appendChild(noResults);
    }

    updateSourcesInfo() {
        const countEl = document.getElementById('sourcesCount');
        const filterInfoEl = document.getElementById('filterInfo');

        if (countEl) {
            const total = this.allSources.length;
            const filtered = this.filteredSources.length;
            
            if (filtered === total) {
                countEl.textContent = `${total} source${total !== 1 ? 's' : ''}`;
            } else {
                countEl.textContent = `Showing ${filtered} of ${total} source${total !== 1 ? 's' : ''}`;
            }
        }

        if (filterInfoEl) {
            const filters = [];
            
            if (this.searchTerm) {
                filters.push(`Search: "${this.searchTerm}"`);
            }
            if (this.statusFilter !== 'all') {
                filters.push(`Status: ${this.statusFilter}`);
            }
            if (this.regionFilter !== 'all') {
                filters.push(`Region: ${this.regionFilter}`);
            }
            if (this.sortBy !== 'priority') {
                filters.push(`Sort: ${this.sortBy}`);
            }

            filterInfoEl.textContent = filters.length > 0 ? filters.join(' • ') : '';
        }
    }

    updateClearButton() {
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            clearBtn.style.display = this.searchTerm ? 'block' : 'none';
        }
    }

    resetFilters() {
        // Reset all filters
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.regionFilter = 'all';
        this.sortBy = 'priority';

        // Reset UI
        const searchInput = document.getElementById('sourceSearch');
        const statusFilter = document.getElementById('statusFilter');
        const regionFilter = document.getElementById('regionFilter');
        const sortBy = document.getElementById('sortBy');

        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = 'all';
        if (regionFilter) regionFilter.value = 'all';
        if (sortBy) sortBy.value = 'priority';

        this.updateClearButton();
        this.applyFilters();

        showNotification('Filters reset', 'info');
    }

    getFilteredCount() {
        return this.filteredSources.length;
    }

    getTotalCount() {
        return this.allSources.length;
    }
}

const sourceFilter = new SourceFilterManager();
