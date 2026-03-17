import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
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

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem', maxWidth: 1100 }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Settings</h1>
          <p className="react-muted" style={{ margin: 0 }}>Manage your profile, security, and account preferences.</p>
        </div>
        <div className="react-inline-actions">
          <Link className="react-btn react-btn-ghost" to="/client-dashboard">Dashboard</Link>
          <button
            className="react-btn react-btn-ghost"
            type="button"
            onClick={() => {
              localStorage.removeItem('authToken');
              navigate('/client-home');
            }}
          >
            Logout
          </button>
        </div>
      </section>

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}
      {message ? <div className="react-alert react-alert-success">{message}</div> : null}

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Update Personal Info</h2>
        <form className="react-grid" onSubmit={savePersonalInfo}>
          <div className="react-grid react-grid-2">
            <label>
              <span className="react-label">Full Name</span>
              <input
                className="react-input"
                value={personalForm.fullName}
                onChange={(event) => updatePersonalField('fullName', event.target.value)}
                placeholder="At least 4 names"
              />
            </label>
            <label>
              <span className="react-label">Email</span>
              <input className="react-input" value={personalForm.email} readOnly />
            </label>
            <label>
              <span className="react-label">Phone Number</span>
              <input
                className="react-input"
                value={personalForm.phone}
                onChange={(event) => updatePersonalField('phone', event.target.value)}
              />
            </label>
            <label>
              <span className="react-label">Country</span>
              <input
                className="react-input"
                value={personalForm.country}
                onChange={(event) => updatePersonalField('country', event.target.value)}
              />
            </label>
          </div>
          <button className="react-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Edit Full Profile</h2>
        <form className="react-grid" onSubmit={saveFullProfile}>
          <div className="react-grid react-grid-2">
            <label>
              <span className="react-label">Full Name</span>
              <input className="react-input" value={fullProfileForm.fullName} onChange={(event) => updateFullProfileField('fullName', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Phone</span>
              <input className="react-input" value={fullProfileForm.phone} onChange={(event) => updateFullProfileField('phone', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Birthday</span>
              <input className="react-input" type="date" value={fullProfileForm.birthday} onChange={(event) => updateFullProfileField('birthday', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Gender</span>
              <select className="react-input" value={fullProfileForm.gender} onChange={(event) => updateFullProfileField('gender', event.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label>
              <span className="react-label">Country</span>
              <input className="react-input" value={fullProfileForm.country} onChange={(event) => updateFullProfileField('country', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Club</span>
              <input className="react-input" value={fullProfileForm.club} onChange={(event) => updateFullProfileField('club', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Sport</span>
              <input className="react-input" value={fullProfileForm.sport} onChange={(event) => updateFullProfileField('sport', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Activity Level</span>
              <input className="react-input" value={fullProfileForm.activityLevel} onChange={(event) => updateFullProfileField('activityLevel', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Height (cm)</span>
              <input className="react-input" type="number" step="0.1" value={fullProfileForm.height} onChange={(event) => updateFullProfileField('height', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Weight (kg)</span>
              <input className="react-input" type="number" step="0.1" value={fullProfileForm.weight} onChange={(event) => updateFullProfileField('weight', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Body Fat %</span>
              <input className="react-input" type="number" step="0.1" value={fullProfileForm.bodyFat} onChange={(event) => updateFullProfileField('bodyFat', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Skeletal Muscle</span>
              <input className="react-input" type="number" step="0.1" value={fullProfileForm.skeletalMuscle} onChange={(event) => updateFullProfileField('skeletalMuscle', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Goal Weight</span>
              <input className="react-input" type="number" step="0.1" value={fullProfileForm.goalWeight} onChange={(event) => updateFullProfileField('goalWeight', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Food Allergies</span>
              <input className="react-input" value={fullProfileForm.foodAllergies} onChange={(event) => updateFullProfileField('foodAllergies', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Injuries</span>
              <input className="react-input" value={fullProfileForm.injuries} onChange={(event) => updateFullProfileField('injuries', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Food Likes</span>
              <textarea className="react-textarea" rows={2} value={fullProfileForm.foodLikes} onChange={(event) => updateFullProfileField('foodLikes', event.target.value)} />
            </label>
            <label>
              <span className="react-label">Food Dislikes</span>
              <textarea className="react-textarea" rows={2} value={fullProfileForm.foodDislikes} onChange={(event) => updateFullProfileField('foodDislikes', event.target.value)} />
            </label>
          </div>
          <label>
            <span className="react-label">Additional Notes</span>
            <textarea className="react-textarea" rows={3} value={fullProfileForm.additionalNotes} onChange={(event) => updateFullProfileField('additionalNotes', event.target.value)} />
          </label>
          <button className="react-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Full Profile'}</button>
        </form>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Change Password</h2>
        <form className="react-grid react-grid-2" onSubmit={changePassword}>
          <label>
            <span className="react-label">Current Password</span>
            <input className="react-input" type="password" value={passwordForm.currentPassword} onChange={(event) => updatePasswordField('currentPassword', event.target.value)} />
          </label>
          <label>
            <span className="react-label">New Password</span>
            <input className="react-input" type="password" value={passwordForm.newPassword} onChange={(event) => updatePasswordField('newPassword', event.target.value)} />
          </label>
          <label>
            <span className="react-label">Confirm New Password</span>
            <input className="react-input" type="password" value={passwordForm.confirmPassword} onChange={(event) => updatePasswordField('confirmPassword', event.target.value)} />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="react-btn" type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
          </div>
        </form>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Manage Subscription</h2>
        <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
          <div>
            <div className="react-label" style={{ marginBottom: 0 }}>Current Plan</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentPlan}</div>
          </div>
          <Link className="react-btn react-btn-ghost" to="/plans">Change Plan</Link>
        </div>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Notification Preferences</h2>
        <label className="react-inline-toggle">
          <input type="checkbox" checked={notificationPrefs.emailNotifications} onChange={() => togglePref('emailNotifications')} />
          <span>Email Notifications</span>
        </label>
        <label className="react-inline-toggle">
          <input type="checkbox" checked={notificationPrefs.smsReminders} onChange={() => togglePref('smsReminders')} />
          <span>SMS Reminders</span>
        </label>
        <label className="react-inline-toggle">
          <input type="checkbox" checked={notificationPrefs.progressReports} onChange={() => togglePref('progressReports')} />
          <span>Progress Reports</span>
        </label>
      </section>

      <section className="react-panel react-grid" style={{ borderColor: '#fecaca', background: '#fff7f7' }}>
        <h2 style={{ marginTop: 0, marginBottom: 0, color: '#991b1b' }}>Danger Zone</h2>
        <button className="react-btn react-btn-danger" type="button" onClick={confirmDeleteAccount}>Delete Account Permanently</button>
      </section>
    </main>
  );
}

export default Settings;
