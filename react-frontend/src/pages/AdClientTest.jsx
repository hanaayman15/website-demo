import { useAdClientTest } from '../hooks/useAdClientTest';
import '../assets/styles/react-pages.css';

function AdClientTest() {
  const { state, payloadPreview, updateField, autofill } = useAdClientTest();

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1000, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Add Client Test</h1>
          <p className="react-muted" style={{ margin: 0 }}>
            Calculation sandbox for BMI, BMR, TDEE, macro targets, and timeline.
          </p>
        </div>
        <button className="react-btn react-btn-ghost" type="button" onClick={autofill}>Autofill</button>
      </section>

      <section className="react-panel react-grid react-grid-2">
        <label><span className="react-label">Full Name</span><input className="react-input" value={state.fullName} onChange={(e) => updateField('fullName', e.target.value)} /></label>
        <label><span className="react-label">Birthday</span><input className="react-input" type="date" value={state.birthday} onChange={(e) => updateField('birthday', e.target.value)} /></label>
        <label>
          <span className="react-label">Gender</span>
          <select className="react-input" value={state.gender} onChange={(e) => updateField('gender', e.target.value)}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
        <label><span className="react-label">Activity Level</span>
          <select className="react-input" value={state.activityLevel} onChange={(e) => updateField('activityLevel', e.target.value)}>
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
            <option value="very-active">Very Active</option>
            <option value="extremely-active">Extremely Active</option>
          </select>
        </label>
        <label><span className="react-label">Height (cm)</span><input className="react-input" value={state.height} onChange={(e) => updateField('height', e.target.value)} /></label>
        <label><span className="react-label">Weight (kg)</span><input className="react-input" value={state.weight} onChange={(e) => updateField('weight', e.target.value)} /></label>
        <label><span className="react-label">BMI</span><input className="react-input" value={state.bmi} readOnly /></label>
        <label><span className="react-label">BMR</span><input className="react-input" value={state.bmr} readOnly /></label>
        <label><span className="react-label">TDEE</span><input className="react-input" value={state.tdee} readOnly /></label>
        <label><span className="react-label">Cut Calories</span><input className="react-input" value={state.cutCalories} readOnly /></label>
        <label><span className="react-label">Maintain Calories</span><input className="react-input" value={state.maintainCalories} readOnly /></label>
        <label><span className="react-label">Bulk Calories</span><input className="react-input" value={state.bulkCalories} readOnly /></label>
        <label><span className="react-label">Protein (g)</span><input className="react-input" value={state.protein} readOnly /></label>
        <label><span className="react-label">Carbs (g)</span><input className="react-input" value={state.carbs} readOnly /></label>
        <label><span className="react-label">Fats (g)</span><input className="react-input" value={state.fats} readOnly /></label>
        <label><span className="react-label">Water Intake (L)</span><input className="react-input" value={state.waterIntake} readOnly /></label>
        <label><span className="react-label">Competition Date</span><input className="react-input" type="date" value={state.competitionDate} onChange={(e) => updateField('competitionDate', e.target.value)} /></label>
        <label><span className="react-label">Days Left</span><input className="react-input" value={state.daysLeft} readOnly /></label>
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ margin: 0 }}>Payload Preview</h2>
        <pre className="react-json-block">{JSON.stringify(payloadPreview, null, 2)}</pre>
      </section>
    </main>
  );
}

export default AdClientTest;
