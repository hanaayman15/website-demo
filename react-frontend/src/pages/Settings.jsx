import { Link, useNavigate } from 'react-router-dom';
import ClientPortalNav from '../components/layout/ClientPortalNav';
import { useSettings } from '../hooks/useSettings';
import { WORLD_COUNTRIES } from '../constants/globalOptions';
import { clearSessionAuth } from '../utils/authSession';
import '../assets/styles/react-pages.css';

function Settings() {
  const navigate = useNavigate();
  const {
    loading,
    saving,
    error,
    message,
    currentPlan,
    personalForm,
    fullProfileForm,
    passwordForm,
    notificationPrefs,
    updatePersonalField,
    updateFullProfileField,
    updatePasswordField,
    updateNotificationPref,
    savePersonalInfo,
    saveFullProfile,
    changePassword,
    resendPasswordCode,
    resetPasswordVerificationFlow,
    passwordVerificationSent,
    deleteAccountLocal,
  } = useSettings();

  if (loading) {
    return <main className="react-page-wrap">Loading settings...</main>;
  }

  const confirmDeleteAccount = () => {
    const confirmation = window.prompt('Type DELETE to confirm account removal from local cache.');
    if (confirmation !== 'DELETE') return;
    if (!window.confirm('This cannot be undone. Continue?')) return;
    deleteAccountLocal();
    navigate('/client-home');
  };

  const togglePref = (field) => {
    updateNotificationPref(field, !notificationPrefs[field]);
  };

  const logout = () => {
    clearSessionAuth();
    localStorage.removeItem('clientFullName');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientPhone');
    localStorage.removeItem('clientCountry');
    navigate('/client-login');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <ClientPortalNav activePath="/settings" isLoggedIn />

      <div className="container mx-auto px-6 pt-6">
        <div className="bg-white/95 border border-blue-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <p className="text-lg leading-none mt-0.5">😴</p>
            <p className="text-sm text-gray-700 font-medium">💤 Don&apos;t forget: Quality sleep is crucial for recovery! Aim for 7-9 hours tonight.</p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            onClick={() => navigate('/progress-tracking')}
          >
            📝 Log Sleep
          </button>
        </div>

        <div className="mt-3 bg-white/95 border border-amber-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <p className="text-lg leading-none mt-0.5">⚙️</p>
            <p className="text-sm text-gray-700 font-medium">✨ Keep your profile up to date! Update your information to get the most accurate nutrition plan.</p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600"
            onClick={() => navigate('/client-nutrition-profile')}
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      <section className="py-8 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">⚙️</div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-2">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-6 max-w-5xl">
          {error ? <div className="react-alert react-alert-error">{error}</div> : null}
          {message ? <div className="react-alert react-alert-success">{message}</div> : null}

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">👤</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Update Personal Info</h2>
                <p className="text-gray-600">Edit your profile information</p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={savePersonalInfo}>
              <div className="grid md:grid-cols-2 gap-4">
                <label>
                  <span className="react-label">Full Name (At least 4 names)</span>
                  <input className="react-input" value={personalForm.fullName} onChange={(event) => updatePersonalField('fullName', event.target.value)} />
                </label>
                <label>
                  <span className="react-label">Email</span>
                  <input className="react-input" value={personalForm.email} readOnly />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </label>
                <label>
                  <span className="react-label">Phone Number</span>
                  <input className="react-input" value={personalForm.phone} onChange={(event) => updatePersonalField('phone', event.target.value)} />
                </label>
                <label>
                  <span className="react-label">Country</span>
                  <select className="react-input" value={personalForm.country} onChange={(event) => updatePersonalField('country', event.target.value)}>
                    <option value="">Select country</option>
                    {WORLD_COUNTRIES.map((country) => <option key={`settings-country-${country}`} value={country}>{country}</option>)}
                  </select>
                </label>
              </div>
              <button className="px-7 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700" type="submit" disabled={saving}>💾 {saving ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">📋</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Edit Full Profile</h2>
                <p className="text-gray-600">Update your complete profile including physical measurements, nutrition plan, and health information</p>
              </div>
            </div>
            <Link to="/client-nutrition-profile" className="inline-flex items-center px-7 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:opacity-95">✏️ Edit Full Profile</Link>
            <form className="hidden" onSubmit={saveFullProfile}>
              <input value={fullProfileForm.fullName} onChange={(event) => updateFullProfileField('fullName', event.target.value)} />
            </form>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">🔒</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Change Password</h2>
                <p className="text-gray-600">Update your password to keep your account secure</p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={changePassword}>
              <label>
                <span className="react-label">New Password</span>
                <input className="react-input" type="password" placeholder="Enter new password" value={passwordForm.newPassword} onChange={(event) => updatePasswordField('newPassword', event.target.value)} />
              </label>
              <label>
                <span className="react-label">Confirm New Password</span>
                <input className="react-input" type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword} onChange={(event) => updatePasswordField('confirmPassword', event.target.value)} />
              </label>

              {passwordVerificationSent ? (
                <>
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    A verification code has been sent to your email. Enter it below to finish changing your password.
                  </div>
                  <label>
                    <span className="react-label">Verification Code</span>
                    <input
                      className="react-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={passwordForm.verificationCode}
                      onChange={(event) => updatePasswordField('verificationCode', event.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </label>
                </>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button className="px-7 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700" type="submit" disabled={saving}>
                  🔐 {saving ? 'Updating...' : passwordVerificationSent ? 'Verify Code & Update Password' : 'Send Verification Code'}
                </button>
                {passwordVerificationSent ? (
                  <>
                    <button
                      className="px-6 py-3 rounded-xl border-2 border-blue-200 text-blue-700 font-semibold hover:bg-blue-50"
                      type="button"
                      disabled={saving}
                      onClick={resendPasswordCode}
                    >
                      Resend Code
                    </button>
                    <button
                      className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"
                      type="button"
                      disabled={saving}
                      onClick={resetPasswordVerificationFlow}
                    >
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
            </form>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">💳</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Manage Subscription</h2>
                <p className="text-gray-600">View and update your subscription plan</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl mb-4">
              <p className="text-sm text-gray-600 mb-1">Current Plan</p>
              <p className="text-2xl font-bold text-gray-900">{currentPlan || 'Basic (Free)'}</p>
              <p className="text-sm text-gray-600 mt-2">$9.99/month • Renews on March 15, 2026</p>
              <span className="inline-block mt-3 px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Active</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="px-6 py-3 rounded-xl border-2 border-blue-300 text-blue-700 font-semibold hover:bg-blue-50" to="/plans">🔄 Change Plan</Link>
              <button type="button" className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100">⏸️ Cancel Subscription</button>
            </div>
            <p className="text-xs text-gray-500 mt-4">💡 You&apos;ll retain access to all features until the end of your billing period</p>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">🔔</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Notification Preferences</h2>
                <p className="text-gray-600">Choose what updates you want to receive</p>
              </div>
            </div>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition mb-3">
              <div>
                <p className="font-semibold text-gray-900">📧 Email Notifications</p>
                <p className="text-sm text-gray-600">Receive meal reminders and updates</p>
              </div>
              <input type="checkbox" checked={notificationPrefs.emailNotifications} onChange={() => togglePref('emailNotifications')} />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition mb-3">
              <div>
                <p className="font-semibold text-gray-900">📱 SMS Reminders</p>
                <p className="text-sm text-gray-600">Get text reminders for check-ins</p>
              </div>
              <input type="checkbox" checked={notificationPrefs.smsReminders} onChange={() => togglePref('smsReminders')} />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
              <div>
                <p className="font-semibold text-gray-900">🎯 Progress Reports</p>
                <p className="text-sm text-gray-600">Weekly performance summaries</p>
              </div>
              <input type="checkbox" checked={notificationPrefs.progressReports} onChange={() => togglePref('progressReports')} />
            </label>
          </section>

          <section className="bg-red-50 p-8 rounded-3xl border-2 border-red-200 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">⚠️</div>
              <div>
                <h2 className="text-2xl font-bold text-red-900 mb-1">Danger Zone</h2>
                <p className="text-red-700">Irreversible actions that affect your account</p>
              </div>
            </div>
            <button className="w-full px-6 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition" type="button" onClick={confirmDeleteAccount}>🗑️ Delete Account Permanently</button>
            <p className="text-xs text-red-600 mt-3">⚠️ Warning: This action cannot be undone. All your data will be permanently deleted.</p>
          </section>

          <div className="text-center pb-10">
            <button type="button" className="px-12 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Settings;
