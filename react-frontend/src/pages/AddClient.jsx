import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewClient } from '../hooks/useNewClient';

const ACCENT = '#6eabf2';

function calculateAge(birthday) {
  if (!birthday) return '';
  const value = String(birthday).trim();
  let birth = new Date(value);
  if (Number.isNaN(birth.getTime()) && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('/').map((part) => Number(part));
    birth = new Date(yyyy, mm - 1, dd);
  }
  if (Number.isNaN(birth.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const md = now.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? String(age) : '';
}

function AddClient() {
  const navigate = useNavigate();
  const { isEditMode, flow, form, loading, saving, error, message, canSubmit, countries, phoneOptions, redirectClientId, hasDraft, updateField, restoreDraft, discardDraft, saveBasicInfo } = useNewClient();

  useEffect(() => {
    if (!redirectClientId) return;
    const target = flow === 'signup'
      ? `/client-nutrition-profile?flow=signup&client_id=${encodeURIComponent(redirectClientId)}`
      : `/subscription-plan?flow=add-client&client_id=${encodeURIComponent(redirectClientId)}`;
    const timeout = setTimeout(() => navigate(target), isEditMode ? 300 : 600);
    return () => clearTimeout(timeout);
  }, [flow, isEditMode, navigate, redirectClientId]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-lg text-gray-600">Loading client basic info...</p></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{isEditMode ? 'Edit Client' : 'Add New Client'}</h1>
          <p className="text-gray-600 mt-2">{isEditMode ? 'Update Basic Information' : 'Basic Information only'}</p>
        </div>

        {/* Alerts */}
        {error && <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">{error}</div>}
        {message && <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">{message}</div>}

        {hasDraft && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex justify-between items-center">
            <p className="text-blue-800">Saved draft detected for this form.</p>
            <div className="flex gap-3">
              <button onClick={restoreDraft} className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 font-semibold hover:bg-blue-100">Restore Draft</button>
              <button onClick={discardDraft} className="px-4 py-2 rounded-lg border border-red-300 text-red-700 font-semibold hover:bg-red-100">Discard Draft</button>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-200">
          <form onSubmit={saveBasicInfo} className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Client ID (auto-generated)</label>
                  <input type="text" value={form.clientId} readOnly className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Full Name *</label>
                  <input type="text" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Auto Filled Client Profile Name" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                  <p className="text-xs text-gray-500 mt-2">Must contain at least 4 names.</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Phone *</label>
                    <select value={form.phoneCountryCode} onChange={(e) => updateField('phoneCountryCode', e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none">
                      {phoneOptions.map((opt) => (<option key={opt.display} value={opt.dial}>{opt.display}</option>))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">&nbsp;</label>
                    <input type="tel" value={form.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} placeholder="1000000000" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Email Address *</label>
                  <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="autofill_1774021738524@example.com" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Password {!isEditMode && '*'}</label>
                  <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder={isEditMode ? 'Leave blank to keep current' : 'Minimum 6 characters'} minLength={6} required={!isEditMode} disabled={isEditMode} className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Gender *</label>
                  <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Birthday (dd/mm/yyyy) *</label>
                  <input type="date" value={form.birthday} onChange={(e) => updateField('birthday', e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Age</label>
                  <input type="text" value={calculateAge(form.birthday)} readOnly className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Country *</label>
                  <select value={form.country} onChange={(e) => updateField('country', e.target.value)} required className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none">
                    <option value="">Select country</option>
                    {countries.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Religion</label>
                  <select value={form.religion} onChange={(e) => updateField('religion', e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none">
                    <option value="">Select religion</option>
                    <option value="Islam">Islam</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Judaism">Judaism</option>
                    <option value="Hinduism">Hinduism</option>
                    <option value="Buddhism">Buddhism</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Sport Club</label>
                  <input type="text" value={form.club} onChange={(e) => updateField('club', e.target.value)} placeholder="Auto Club" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Average Wake-up Time</label>
                  <input type="time" value={form.wakeUpTime} onChange={(e) => updateField('wakeUpTime', e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Average Sleep Time</label>
                  <input type="time" value={form.sleepTime} onChange={(e) => updateField('sleepTime', e.target.value)} className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button type="button" onClick={() => navigate('/clients')} className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving || !canSubmit} className="px-6 py-3 rounded-lg font-semibold text-white transition disabled:opacity-50" style={{ backgroundColor: ACCENT }}>{saving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddClient;
