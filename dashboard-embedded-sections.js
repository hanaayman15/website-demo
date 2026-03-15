(function () {
    const PLAN_DETAILS = {
        once: {
            title: 'Once',
            description: 'One focused consultation session with personalized recommendations for your next performance block.'
        },
        monthly: {
            title: 'Monthly',
            description: 'Recurring monthly consultations with regular adjustments based on progress and recovery.'
        },
        annually: {
            title: 'Annually',
            description: 'Long-term annual consultation strategy for season planning, competition prep, and stability.'
        }
    };

    function getApiBaseUrl() {
        if (window.CONFIG && CONFIG.API_BASE_URL) return CONFIG.API_BASE_URL;
        return 'http://127.0.0.1:8001';
    }

    function getAuthHeaderBag() {
        if (typeof getAuthHeaders === 'function') return getAuthHeaders();
        const token = localStorage.getItem('authToken');
        return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    }

    async function fetchClientProfile() {
        const response = await fetch(`${getApiBaseUrl()}/api/client/profile`, {
            method: 'GET',
            headers: getAuthHeaderBag()
        });
        if (!response.ok) {
            throw new Error('Could not load client profile for embedded sections');
        }
        return response.json();
    }

    async function updateClientProfile(patchPayload) {
        const response = await fetch(`${getApiBaseUrl()}/api/client/profile`, {
            method: 'PUT',
            headers: getAuthHeaderBag(),
            body: JSON.stringify(patchPayload || {})
        });

        if (!response.ok) {
            let detail = 'Could not update profile.';
            try {
                const payload = await response.json();
                detail = payload.detail || payload.message || detail;
            } catch (_) {
                // Keep default message.
            }
            throw new Error(detail);
        }

        return response.json();
    }

    async function fetchConsultationSelection() {
        const response = await fetch(`${getApiBaseUrl()}/api/client/consultation`, {
            method: 'GET',
            headers: getAuthHeaderBag()
        });
        if (!response.ok) {
            return {};
        }
        return response.json();
    }

    async function saveConsultationSelection(clientId, plan) {
        const response = await fetch(`${getApiBaseUrl()}/api/client/consultation`, {
            method: 'POST',
            headers: getAuthHeaderBag(),
            body: JSON.stringify({
                client_id: clientId,
                consultation_type: plan,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            let detail = 'Could not save consultation selection.';
            try {
                const payload = await response.json();
                detail = payload.detail || payload.message || detail;
            } catch (_) {
                // Keep default message.
            }
            throw new Error(detail);
        }

        return response.json();
    }

    function normalizeSupplementItems(supplementsText) {
        const raw = String(supplementsText || '').trim();
        if (!raw) return [];
        const ignoredValues = new Set([
            'no supplements added',
            'no supplements added yet',
            'no supplement notes yet',
            'n/a',
            'none'
        ]);

        function keepItem(item) {
            const value = String(item || '').trim();
            if (!value) return false;
            return !ignoredValues.has(value.toLowerCase());
        }

        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => {
                        if (typeof item === 'string') return item.trim();
                        if (item && typeof item === 'object') {
                            return String(item.name || item.supplement_info || item.supplement || '').trim();
                        }
                        return '';
                    })
                    .filter(keepItem);
            }
        } catch (_) {
            // Fall through to plain-text parsing.
        }

        return raw
            .split(/\r?\n|,|;/)
            .map((item) => item.trim())
            .filter(keepItem);
    }

    function stringifySupplementItems(items) {
        return (items || []).map((item) => String(item || '').trim()).filter(Boolean).join('\n');
    }

    function renderSupplements(container, supplementsText, mode) {
        if (!container) return;
        const heading = mode === 'anti-doping' ? 'Approved Supplements' : 'Supplements';
        const description = mode === 'anti-doping'
            ? 'Supplements currently approved in your profile plus safe baseline options for anti-doping compliance.'
            : 'Supplements currently recommended in your profile and aligned with your nutrition targets.';

        const supplementsList = normalizeSupplementItems(supplementsText);
        const listHtml = supplementsList.length
            ? `<ul class="mt-2 space-y-2">${supplementsList.map((item) => `<li class="text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2">${item}</li>`).join('')}</ul>`
            : '<p class="text-gray-700 mt-2">No supplements saved for this client yet.</p>';

        container.innerHTML = `
            <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 class="text-2xl font-bold text-gray-900">${heading}</h3>
                <p class="text-sm text-gray-600 mt-1">${description}</p>
                <div class="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <p class="text-xs uppercase tracking-wide text-gray-500">From Your Profile</p>
                    ${listHtml}
                </div>
                <div class="mt-4 flex flex-wrap gap-3">
                    <button type="button" id="embeddedAddSupplementBtn" class="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition">
                        + Add Supplement
                    </button>
                </div>
                <p id="embeddedSupplementStatus" class="text-sm mt-3 text-gray-600"></p>
            </div>
        `;
    }

    function bindSupplementHandlers(container, profileRef, mode) {
        if (!container || !profileRef) return;
        const addBtn = container.querySelector('#embeddedAddSupplementBtn');
        const statusEl = container.querySelector('#embeddedSupplementStatus');
        if (!addBtn) return;

        addBtn.addEventListener('click', async function () {
            const supplementName = window.prompt('Enter supplement name (for example: Creatine 5g):');
            const trimmed = String(supplementName || '').trim();
            if (!trimmed) return;

            const existing = normalizeSupplementItems(profileRef.supplements);
            existing.push(trimmed);
            const updatedText = stringifySupplementItems(existing);

            if (statusEl) {
                statusEl.textContent = 'Saving supplement...';
                statusEl.className = 'text-sm mt-3 text-blue-700';
            }

            try {
                await updateClientProfile({ supplements: updatedText });
                profileRef.supplements = updatedText;
                renderSupplements(container, profileRef.supplements, mode);
                bindSupplementHandlers(container, profileRef, mode);

                const refreshedStatus = container.querySelector('#embeddedSupplementStatus');
                if (refreshedStatus) {
                    refreshedStatus.textContent = `Saved: ${trimmed}`;
                    refreshedStatus.className = 'text-sm mt-3 text-green-700';
                }
            } catch (error) {
                if (statusEl) {
                    statusEl.textContent = `Save failed: ${error.message}`;
                    statusEl.className = 'text-sm mt-3 text-red-700';
                }
            }
        });
    }

    function buildPlanCard(planKey, selectedPlan) {
        const plan = PLAN_DETAILS[planKey];
        const isSelected = selectedPlan === planKey;
        const borderClass = isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200';
        const badge = isSelected ? '<span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Active</span>' : '';

        return `
            <div class="border ${borderClass} rounded-2xl p-5 bg-white">
                <div class="flex items-center justify-between">
                    <h4 class="text-xl font-bold text-gray-900">${plan.title}</h4>
                    ${badge}
                </div>
                <p class="text-sm text-gray-600 mt-2">${plan.description}</p>
                <button type="button" data-consultation-plan="${planKey}" class="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
                    Select ${plan.title}
                </button>
            </div>
        `;
    }

    function renderConsultation(container, selectedPlan) {
        if (!container) return;
        container.innerHTML = `
            <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 class="text-2xl font-bold text-gray-900">Consultation</h3>
                <p class="text-sm text-gray-600 mt-1">Choose your consultation rhythm. Your selection is saved to your account and restored on your next login.</p>
                <div class="mt-4">
                    <button type="button" id="embeddedConsultationAddBtn" class="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
                        + Add Consultation
                    </button>
                </div>
                <p id="embeddedConsultationStatus" class="text-sm mt-4 text-gray-600"></p>
            </div>
        `;
    }

    function bindConsultationHandlers(container, clientId, selectedPlanRef) {
        if (!container) return;
        const statusEl = container.querySelector('#embeddedConsultationStatus');
        const addBtn = container.querySelector('#embeddedConsultationAddBtn');
        if (!addBtn) return;

        addBtn.addEventListener('click', async function () {
            const selected = window.prompt('Choose consultation plan: once, monthly, or annually', selectedPlanRef.value || 'monthly');
            const normalized = String(selected || '').trim().toLowerCase();
            if (!normalized) return;
            if (!['once', 'monthly', 'annually'].includes(normalized)) {
                if (statusEl) {
                    statusEl.textContent = 'Invalid plan. Use once, monthly, or annually.';
                    statusEl.className = 'text-sm mt-4 text-red-700';
                }
                return;
            }

            if (statusEl) {
                statusEl.textContent = 'Saving consultation plan...';
                statusEl.className = 'text-sm mt-4 text-blue-700';
            }

            try {
                await saveConsultationSelection(clientId, normalized);
                selectedPlanRef.value = normalized;
                if (statusEl) {
                    statusEl.textContent = `Saved: ${normalized} plan.`;
                    statusEl.className = 'text-sm mt-4 text-green-700';
                }
            } catch (error) {
                if (statusEl) {
                    statusEl.textContent = `Save failed: ${error.message}`;
                    statusEl.className = 'text-sm mt-4 text-red-700';
                }
            }
        });
    }

    async function initEmbeddedDashboardSections(options) {
        const opts = options || {};
        const supplementsContainer = document.getElementById(opts.supplementsContainerId || 'embeddedSupplementsSection');
        const consultationContainer = document.getElementById(opts.consultationContainerId || 'embeddedConsultationSection');
        if (!supplementsContainer && !consultationContainer) return;

        const mode = opts.mode || 'nutrition';

        try {
            const profile = await fetchClientProfile();
            const consultation = await fetchConsultationSelection();
            const selectedPlanRef = { value: consultation.consultation_type || profile.consultation_type || '' };

            renderSupplements(supplementsContainer, profile.supplements, mode);
            bindSupplementHandlers(supplementsContainer, profile, mode);
            renderConsultation(consultationContainer, selectedPlanRef.value);
            bindConsultationHandlers(consultationContainer, profile.id, selectedPlanRef);
        } catch (error) {
            const fallback = '<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">Unable to load section data. Please refresh or log in again.</div>';
            if (supplementsContainer) supplementsContainer.innerHTML = fallback;
            if (consultationContainer) consultationContainer.innerHTML = fallback;
        }
    }

    window.initEmbeddedDashboardSections = initEmbeddedDashboardSections;
})();
