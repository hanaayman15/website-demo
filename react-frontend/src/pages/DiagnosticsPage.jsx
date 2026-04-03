import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

function DiagnosticsPage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/api/client/profile');
        console.log('[DIAGNOSTICS] Full Profile Response:', response.data);
        setProfileData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('[DIAGNOSTICS] Error fetching profile:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div className="react-page-wrap"><p>Loading profile diagnostics...</p></div>;
  if (error) return <div className="react-page-wrap"><p className="react-alert react-alert-error">{error}</p></div>;

  const NutritionFields = [
    'weight', 'height', 'tdee', 'bmi', 'protein_target', 'carbs_target', 'fats_target',
    'body_fat_percentage', 'skeletal_muscle', 'water_in_body', 'minerals', 'activity_level',
    'goal_weight', 'competition_date'
  ];

  return (
    <div className="react-page-wrap react-grid" style={{ maxWidth: 1200, gap: '1rem' }}>
      <h1>Profile Diagnostics</h1>
      
      <section className="react-panel react-grid">
        <h2>Nutrition Fields Status</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Field Name</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Value</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {NutritionFields.map((field) => {
              const value = profileData?.[field];
              const hasValue = value !== null && value !== undefined && value !== '' && value !== 0;
              const status = hasValue ? '✅ OK' : '❌ MISSING/ZERO';
              return (
                <tr key={field}>
                  <td style={{ border: '1px solid #ccc', padding: '8px', fontFamily: 'monospace' }}>{field}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', fontFamily: 'monospace' }}>{JSON.stringify(value)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', color: hasValue ? 'green' : 'red' }}>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="react-panel">
        <h2>Raw Profile JSON</h2>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', overflow: 'auto', maxHeight: '400px' }}>
          {JSON.stringify(profileData, null, 2)}
        </pre>
      </section>

      <section className="react-panel">
        <h2>Instructions</h2>
        <ol>
          <li>Fill out the Add Client Details form completely (including all nutrition targets and competition date)</li>
          <li>Click "Save Profile & Continue"</li>
          <li>Wait for the "Successfully saved" message</li>
          <li>Reload this page (press F5)</li>
          <li>Check the table above - all nutrition fields should show ✅ OK</li>
        </ol>
      </section>
    </div>
  );
}

export default DiagnosticsPage;
