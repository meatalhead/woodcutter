// Sheet Cutting Optimizer - Frontend Application

const API_BASE = '';

// State management
const state = {
    stockSheets: [],
    requiredCuts: [],
    optimizationResult: null
};

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' };
    toast.className = `fixed bottom-4 right-4 ${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadStockSheets();
    loadRequiredCuts();
    setupMobileNavigation();
    setupOrientationHandling();
});

/**
 * Setup mobile navigation handlers
 */
function setupMobileNavigation() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }
    
    // Close menu when menu item is clicked
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            hamburgerBtn?.classList.remove('active');
            mobileMenu?.classList.remove('active');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.mobile-header') && !e.target.closest('.mobile-menu')) {
            hamburgerBtn?.classList.remove('active');
            mobileMenu?.classList.remove('active');
        }
    });
}

/**
 * Toggle section visibility (for mobile menu)
 */
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const display = window.getComputedStyle(section).display;
        section.style.display = display === 'none' ? 'block' : 'none';
        
        // Scroll to section on mobile
        if (window.innerWidth < 768) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

/**
 * Setup orientation change handling
 */
function setupOrientationHandling() {
    window.addEventListener('orientationchange', () => {
        // Re-layout on orientation change
        setTimeout(() => {
            // Trigger window resize event for responsive layout adjustments
            window.dispatchEvent(new Event('resize'));
            
            // If diagrams are rendered, re-render them
            if (window.DiagramRenderer && state.optimizationResult) {
                window.DiagramRenderer.renderCuttingPlanDiagrams(state.optimizationResult, 'diagrams-container');
            }
        }, 100);
    });
    
    // Handle regular resize events
    window.addEventListener('resize', () => {
        // Adjust layout based on viewport width
        const isMobile = window.innerWidth < 768;
        const hamburgerBtn = document.getElementById('hamburger-btn');
        
        if (!isMobile && hamburgerBtn) {
            hamburgerBtn.classList.remove('active');
            document.getElementById('mobile-menu')?.classList.remove('active');
        }
    });
}

// API calls
async function apiCall(url, options = {}) {
    const response = await fetch(API_BASE + url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Request failed');
    }
    
    if (response.status === 204) {
        return null;
    }
    
    return response.json();
}

// Stock Sheet Functions
async function loadStockSheets() {
    try {
        state.stockSheets = await apiCall('/api/stock/');
        renderStockSheets();
    } catch (error) {
        console.error('Failed to load stock sheets:', error);
        alert('Failed to load stock sheets: ' + error.message);
    }
}

function renderStockSheets() {
    const container = document.getElementById('stock-list');
    
    if (state.stockSheets.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8 text-sm italic">No stock sheets added yet</p>';
        return;
    }
    
    const priorityBadge = (p) => {
        const styles = { high: 'bg-orange-100 text-orange-700', normal: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600' };
        return `<span class="text-xs font-semibold px-2 py-0.5 rounded-full ${styles[p] || styles.normal}">${p}</span>`;
    };

    container.innerHTML = state.stockSheets.map(sheet => `
        <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center gap-3 flex-wrap">
                <span class="font-semibold text-gray-800">${sheet.label}</span>
                <span class="text-sm text-gray-500">${sheet.width} × ${sheet.length} × ${sheet.thickness} mm</span>
                ${(sheet.quantity || 1) > 1 ? `<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">×${sheet.quantity}</span>` : ''}
                ${priorityBadge(sheet.priority)}
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="showEditStockForm('${sheet.id}')" class="text-sm px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-white hover:shadow-sm transition-all">Edit</button>
                <button onclick="deleteStockSheet('${sheet.id}')" class="text-sm px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-all">Delete</button>
            </div>
        </div>
    `).join('');
}

async function deleteStockSheet(id) {
    if (!confirm('Delete this stock sheet?')) return;
    
    try {
        await apiCall(`/api/stock/${id}`, { method: 'DELETE' });
        await loadStockSheets();
    } catch (error) {
        alert('Failed to delete stock sheet: ' + error.message);
    }
}

function showStockForm() {
    const formHtml = `
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Add Stock Sheet</h2>
        <form id="stock-form" onsubmit="submitStockSheet(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input type="text" name="label" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required maxlength="100">
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Width (mm)</label>
                    <input type="number" name="width" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0.1" max="10000" step="0.1">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Length (mm)</label>
                    <input type="number" name="length" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0.1" max="10000" step="0.1">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
                    <input type="number" name="thickness" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0.1" max="300" step="0.1">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input type="number" name="quantity" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="1" required min="1" max="100" step="1">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select name="priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="high">High</option>
                        <option value="normal" selected>Normal</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>
            <div class="flex gap-3 pt-2">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors duration-200">Add Sheet</button>
                <button type="button" class="border border-gray-300 text-gray-600 hover:bg-gray-50 px-5 py-2 rounded-lg font-medium transition-colors duration-200" onclick="hideModal()">Cancel</button>
            </div>
        </form>
    `;
    
    showModal(formHtml);
}

async function submitStockSheet(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        label: formData.get('label'),
        width: parseFloat(formData.get('width')),
        length: parseFloat(formData.get('length')),
        thickness: parseFloat(formData.get('thickness')),
        quantity: parseInt(formData.get('quantity')) || 1,
        priority: formData.get('priority')
    };
    
    try {
        await apiCall('/api/stock/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        hideModal();
        await loadStockSheets();
    } catch (error) {
        alert('Failed to add stock sheet: ' + error.message);
    }
}

function showEditStockForm(id) {
    const sheet = state.stockSheets.find(s => s.id === id);
    if (!sheet) return;
    
    const formHtml = `
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Edit Stock Sheet</h2>
        <form id="stock-form" onsubmit="submitEditStockSheet(event, '${id}')" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input type="text" name="label" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required maxlength="100" value="${sheet.label}">
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Width (mm)</label>
                    <input type="number" name="width" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0.1" max="10000" step="0.1" value="${sheet.width}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Length (mm)</label>
                    <input type="number" name="length" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0.1" max="10000" step="0.1" value="${sheet.length}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
                    <input type="number" name="thickness" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0.1" max="300" step="0.1" value="${sheet.thickness}">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input type="number" name="quantity" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="${sheet.quantity || 1}" required min="1" max="100" step="1">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select name="priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="high" ${sheet.priority === 'high' ? 'selected' : ''}>High</option>
                        <option value="normal" ${sheet.priority === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="low" ${sheet.priority === 'low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
            </div>
            <div class="flex gap-3 pt-2">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors duration-200">Update Sheet</button>
                <button type="button" class="border border-gray-300 text-gray-600 hover:bg-gray-50 px-5 py-2 rounded-lg font-medium transition-colors duration-200" onclick="hideModal()">Cancel</button>
            </div>
        </form>
    `;
    
    showModal(formHtml);
}

async function submitEditStockSheet(event, id) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        label: formData.get('label'),
        width: parseFloat(formData.get('width')),
        length: parseFloat(formData.get('length')),
        thickness: parseFloat(formData.get('thickness')),
        quantity: parseInt(formData.get('quantity')) || 1,
        priority: formData.get('priority')
    };
    
    try {
        await apiCall(`/api/stock/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        hideModal();
        await loadStockSheets();
        
        // If we have an optimization result, re-optimize since priority may have changed
        if (state.optimizationResult) {
            await runOptimization();
        }
    } catch (error) {
        alert('Failed to update stock sheet: ' + error.message);
    }
}

// Required Cut Functions
async function loadRequiredCuts() {
    try {
        state.requiredCuts = await apiCall('/api/cuts/');
        renderRequiredCuts();
    } catch (error) {
        console.error('Failed to load cuts:', error);
        alert('Failed to load cuts: ' + error.message);
    }
}

function renderRequiredCuts() {
    const container = document.getElementById('cuts-list');
    
    if (state.requiredCuts.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8 text-sm italic">No cuts added yet</p>';
        return;
    }
    
    container.innerHTML = state.requiredCuts.map(cut => `
        <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center gap-3 flex-wrap">
                <span class="font-semibold text-gray-800">${cut.label}</span>
                <span class="text-sm text-gray-500">${cut.width} × ${cut.length} × ${cut.thickness} mm</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Qty: ${cut.quantity}</span>
            </div>
            <button onclick="deleteRequiredCut('${cut.id}')" class="text-sm px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-all shrink-0">Delete</button>
        </div>
    `).join('');
}

async function deleteRequiredCut(id) {
    if (!confirm('Delete this required cut?')) return;
    
    try {
        await apiCall(`/api/cuts/${id}`, { method: 'DELETE' });
        await loadRequiredCuts();
    } catch (error) {
        alert('Failed to delete cut: ' + error.message);
    }
}

function showCutForm() {
    const thicknesses = [...new Set(state.stockSheets.map(s => s.thickness))].sort((a, b) => a - b);
    const thicknessField = thicknesses.length > 0
        ? `<select name="thickness" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
               ${thicknesses.map(t => `<option value="${t}">${t} mm</option>`).join('')}
           </select>`
        : `<input type="number" name="thickness" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0.1" max="300" step="0.1" placeholder="No stock sheets yet">`;

    const formHtml = `
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Add Required Cut</h2>
        <form id="cut-form" onsubmit="submitRequiredCut(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input type="text" name="label" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required maxlength="100">
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Width (mm)</label>
                    <input type="number" name="width" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0.1" max="10000" step="0.1">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Length (mm)</label>
                    <input type="number" name="length" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0.1" max="10000" step="0.1">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
                    ${thicknessField}
                    ${thicknesses.length === 0 ? '<p class="text-xs text-amber-600 mt-1">Add stock sheets first to restrict thicknesses</p>' : ''}
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" name="quantity" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="1" max="1000" value="1">
            </div>
            <div class="flex gap-3 pt-2">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors duration-200">Add Cut</button>
                <button type="button" class="border border-gray-300 text-gray-600 hover:bg-gray-50 px-5 py-2 rounded-lg font-medium transition-colors duration-200" onclick="hideModal()">Cancel</button>
            </div>
        </form>
    `;
    
    showModal(formHtml);
}

async function submitRequiredCut(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        label: formData.get('label'),
        width: parseFloat(formData.get('width')),
        length: parseFloat(formData.get('length')),
        thickness: parseFloat(formData.get('thickness')),
        quantity: parseInt(formData.get('quantity'))
    };
    
    try {
        await apiCall('/api/cuts/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        hideModal();
        await loadRequiredCuts();
    } catch (error) {
        alert('Failed to add cut: ' + error.message);
    }
}

// Optimization Functions
async function runOptimization() {
    const kerfWidth = parseFloat(document.getElementById('kerf-width').value);
    const button = document.getElementById('optimize-btn');
    
    button.disabled = true;
    button.textContent = 'Optimizing...';
    
    try {
        const result = await apiCall('/api/optimize/', {
            method: 'POST',
            body: JSON.stringify({ kerf_width: kerfWidth })
        });
        
        state.optimizationResult = result;
        renderOptimizationResults(result);
    } catch (error) {
        alert('Optimization failed: ' + error.message);
    } finally {
        button.disabled = false;
        button.textContent = 'Optimize Cutting Plan';
    }
}


function renderOptimizationResults(result) {
    const container = document.getElementById('results-content');
    const section = document.getElementById('results-section');

    const html = `
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <div class="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-1">Sheets Used</div>
                <div class="text-3xl font-bold text-blue-700">${result.sheets_used}</div>
            </div>
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <div class="text-xs font-semibold uppercase tracking-wide text-emerald-500 mb-1">Cuts Placed</div>
                <div class="text-3xl font-bold text-emerald-700">${result.sheet_plans.reduce((s, p) => s + p.assignments.length, 0)}</div>
            </div>
        </div>
        
        ${result.sheet_plans.map((plan, idx) => `
            <div class="border border-gray-200 rounded-xl overflow-hidden mb-4 shadow-sm">
                <div class="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center justify-between">
                    <div>
                        <span class="text-white font-semibold">Sheet ${idx + 1}: ${plan.sheet_label}</span>
                        <span class="text-blue-200 text-sm ml-3">${plan.sheet_width} × ${plan.sheet_length} mm</span>
                    </div>
                    <span class="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                        ${plan.assignments.length} cut${plan.assignments.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div class="divide-y divide-gray-100">
                    ${plan.assignments.map(cut => `
                        <div class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                            <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">${cut.sequence_number}</span>
                            <span class="font-medium text-gray-800 text-sm">${cut.cut_label}</span>
                            <span class="text-gray-400 text-xs">${cut.width} × ${cut.length} mm</span>
                            ${cut.rotation === 90 ? '<span class="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">↻ Rotated</span>' : ''}
                            <span class="ml-auto text-xs text-gray-400">@ (${Math.round(cut.x_position)}, ${Math.round(cut.y_position)})</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}

        ${(result.unplaced_cuts && result.unplaced_cuts.length > 0) ? `
            <div class="border-2 border-amber-300 bg-amber-50 rounded-xl overflow-hidden mb-4 shadow-sm">
                <div class="bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    <span class="text-white font-semibold">Unplaced Cuts (${result.unplaced_cuts.length})</span>
                    <span class="text-amber-100 text-sm ml-2">These cuts could not be placed on available stock</span>
                </div>
                <div class="divide-y divide-amber-200">
                    ${result.unplaced_cuts.map(cut => `
                        <div class="flex items-center gap-3 px-4 py-2.5">
                            <span class="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0">!</span>
                            <span class="font-medium text-gray-800 text-sm">${cut.cut_label}</span>
                            <span class="text-gray-500 text-xs">${cut.width} × ${cut.length} × ${cut.thickness} mm</span>
                            <span class="ml-auto text-xs text-amber-700 font-medium">${cut.reason}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        ${(result.unused_sheets && result.unused_sheets.length > 0) ? `
            <div class="border-2 border-emerald-300 bg-emerald-50 rounded-xl overflow-hidden mb-4 shadow-sm">
                <div class="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    <span class="text-white font-semibold">Unused Stock (${result.unused_sheets.reduce((s, u) => s + u.quantity, 0)} sheet${result.unused_sheets.reduce((s, u) => s + u.quantity, 0) !== 1 ? 's' : ''})</span>
                </div>
                <div class="divide-y divide-emerald-200">
                    ${result.unused_sheets.map(sheet => `
                        <div class="flex items-center gap-3 px-4 py-2.5">
                            <span class="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">${sheet.quantity}</span>
                            <span class="font-medium text-gray-800 text-sm">${sheet.label}</span>
                            <span class="text-gray-500 text-xs">${sheet.width} × ${sheet.length} × ${sheet.thickness} mm</span>
                        </div>
                    `).join('')}
                </div>
                <div class="px-4 py-3 bg-emerald-100/50">
                    <button onclick="sendToStorage()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        Send to Storage
                    </button>
                </div>
            </div>
        ` : ''}
    `;
    
    container.innerHTML = html;
    section.style.display = 'block';
    
    if (window.DiagramRenderer) {
        window.DiagramRenderer.renderCuttingPlanDiagrams(result, 'diagrams-container');
    }
    
    section.scrollIntoView({ behavior: 'smooth' });
}

// Modal Functions
function showModal(content) {
    document.getElementById('form-container').innerHTML = content;
    document.getElementById('modal-overlay').style.display = 'block';
}

function hideModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

// Storage: save unused sheets to localStorage
function sendToStorage() {
    if (!state.optimizationResult?.unused_sheets?.length) return;
    const stored = state.optimizationResult.unused_sheets.map(s => ({
        label: s.label,
        width: s.width,
        length: s.length,
        thickness: s.thickness,
        quantity: s.quantity,
        priority: s.priority
    }));
    localStorage.setItem('woodcutter_stored_sheets', JSON.stringify(stored));
    showToast(`${stored.length} sheet type${stored.length !== 1 ? 's' : ''} sent to storage`, 'success');
}

// Load stored sheets from localStorage via API
async function loadStoredSheets() {
    const raw = localStorage.getItem('woodcutter_stored_sheets');
    if (!raw) return;
    try {
        const sheets = JSON.parse(raw);
        for (const s of sheets) {
            await apiCall('/api/stock/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label: `[Stored] ${s.label}`,
                    width: s.width,
                    length: s.length,
                    thickness: s.thickness,
                    quantity: s.quantity,
                    priority: s.priority || 'normal'
                })
            });
        }
        localStorage.removeItem('woodcutter_stored_sheets');
        showToast(`Loaded ${sheets.length} stored sheet type${sheets.length !== 1 ? 's' : ''}`, 'success');
    } catch (e) {
        console.error('Failed to load stored sheets:', e);
    }
}

async function newProject() {
    if (!confirm('Start a new project? Current stock sheets and cuts will be cleared. Stored sheets will be loaded.')) return;
    try {
        await Promise.all([
            apiCall('/api/stock', { method: 'DELETE' }),
            apiCall('/api/cuts', { method: 'DELETE' })
        ]);
        state.optimizationResult = null;
        document.getElementById('results-section').style.display = 'none';
        await loadStoredSheets();
        await Promise.all([loadStockSheets(), loadRequiredCuts()]);
    } catch (error) {
        alert('Failed to start new project: ' + error.message);
    }
}

// Close modal on overlay click
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        hideModal();
    }
});

/**
 * Handle print button click
 * Activates print view with cutting instructions
 */
function handlePrintClick() {
    // Use the optimization result from state
    if (state.optimizationResult) {
        activatePrintView(state.optimizationResult);
    } else {
        showToast('No cutting plan available. Please run optimization first.', 'error');
    }
}
