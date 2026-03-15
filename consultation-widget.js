(function () {
    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function resolveApiBaseUrl() {
        if (window.CONFIG && CONFIG.API_BASE_URL) {
            return CONFIG.API_BASE_URL;
        }
        return 'http://127.0.0.1:8001';
    }

    function resolveAuthHeaders() {
        if (typeof getAuthHeaders === 'function') {
            return getAuthHeaders();
        }
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    }

    function getDefaultMarkup() {
        return [
            '<div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">',
            '  <div class="flex items-center justify-between mb-4">',
            '    <h3 class="text-xl font-bold text-gray-900">Consultation Preferences</h3>',
            '    <span class="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">Synced</span>',
            '  </div>',
            '  <div class="grid md:grid-cols-2 gap-4">',
            '    <div>',
            '      <label class="block text-sm font-semibold text-gray-700 mb-2">Consultation Type</label>',
            '      <select id="consultationType" class="w-full px-3 py-2 border border-gray-300 rounded-lg">',
            '        <option value="">Select consultation type</option>',
            '        <option value="monthly">Monthly Performance Check-in</option>',
            '        <option value="biweekly">Bi-weekly Performance Plan</option>',
            '        <option value="competition">Competition Week Intensive</option>',
            '      </select>',
            '    </div>',
            '    <div>',
            '      <label class="block text-sm font-semibold text-gray-700 mb-2">Subscription Plan</label>',
            '      <select id="subscriptionPlan" class="w-full px-3 py-2 border border-gray-300 rounded-lg">',
            '        <option value="">Select subscription plan</option>',
            '        <option value="starter">Starter</option>',
            '        <option value="pro">Pro</option>',
            '        <option value="premium">Premium</option>',
            '      </select>',
            '    </div>',
            '  </div>',
            '  <div class="mt-4">',
            '    <label class="block text-sm font-semibold text-gray-700 mb-2">Anti-Doping Focus Notes</label>',
            '    <textarea id="antiDopingFocus" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Examples: check labels for stimulants, use certified supplements, pre-competition audit"></textarea>',
            '  </div>',
            '  <div class="mt-4 flex items-center gap-3">',
            '    <button id="saveConsultationBtn" class="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">Save Preferences</button>',
            '    <span id="consultationStatus" class="text-sm text-gray-500"></span>',
            '  </div>',
            '</div>'
        ].join('');
    }

    async function fetchConsultationPreferences() {
        const response = await fetch(`${resolveApiBaseUrl()}/api/client/consultation`, {
            method: 'GET',
            headers: resolveAuthHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to load consultation preferences');
        }
        return response.json();
    }

    async function saveConsultationPreferences(payload) {
        const response = await fetch(`${resolveApiBaseUrl()}/api/client/consultation`, {
            method: 'PUT',
            headers: resolveAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error('Failed to save consultation preferences');
        }
        return response.json();
    }

    function hydrateFields(container, data) {
        const consultationType = container.querySelector('#consultationType');
        const subscriptionPlan = container.querySelector('#subscriptionPlan');
        const antiDopingFocus = container.querySelector('#antiDopingFocus');

        if (consultationType) consultationType.value = data.consultation_type || '';
        if (subscriptionPlan) subscriptionPlan.value = data.subscription_plan || '';
        if (antiDopingFocus) antiDopingFocus.value = data.anti_doping_focus || '';
    }

    function bindSave(container, options) {
        const saveBtn = container.querySelector('#saveConsultationBtn');
        const statusEl = container.querySelector('#consultationStatus');

        if (!saveBtn) return;

        saveBtn.addEventListener('click', async function () {
            try {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
                if (statusEl) statusEl.textContent = '';

                const payload = {
                    consultation_type: container.querySelector('#consultationType')?.value || null,
                    subscription_plan: container.querySelector('#subscriptionPlan')?.value || null,
                    anti_doping_focus: container.querySelector('#antiDopingFocus')?.value?.trim() || null
                };

                const saved = await saveConsultationPreferences(payload);
                hydrateFields(container, saved);

                if (statusEl) {
                    statusEl.textContent = 'Preferences saved successfully.';
                    statusEl.className = 'text-sm text-green-600';
                }

                if (typeof options.onSaved === 'function') {
                    options.onSaved(saved);
                }
            } catch (error) {
                if (statusEl) {
                    statusEl.textContent = 'Could not save preferences. Please try again.';
                    statusEl.className = 'text-sm text-red-600';
                }
                console.error('[consultation-widget]', error);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Preferences';
            }
        });
    }

    async function renderConsultationWidget(containerId, options) {
        const opts = options || {};
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = getDefaultMarkup();

        try {
            const data = await fetchConsultationPreferences();
            hydrateFields(container, data);

            if (typeof opts.onLoaded === 'function') {
                opts.onLoaded(data);
            }
        } catch (error) {
            container.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">${escapeHtml(error.message)}</div>`;
            return;
        }

        bindSave(container, opts);
    }

    window.renderConsultationWidget = renderConsultationWidget;
})();
