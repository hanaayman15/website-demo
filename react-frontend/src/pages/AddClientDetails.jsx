import { useAddClientDetails } from '../hooks/useAddClientDetails';
import '../assets/styles/react-pages.css';

function AddClientDetails() {
  const { state, trainingDays, updateField, updateTraining, autofill, save } = useAddClientDetails();

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1100, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Complete Client Profile</h1>
          <p className="react-muted" style={{ margin: 0 }}>Extended profile details and daily training schedule.</p>
        </div>
        <button className="react-btn react-btn-ghost" type="button" onClick={autofill}>Autofill Missing</button>
      </section>

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
      {state.success ? <div className="react-alert react-alert-success">{state.success}</div> : null}

      <form className="react-grid" style={{ gap: '1rem' }} onSubmit={save}>
        <section className="react-panel react-grid react-grid-2">
          <label><span className="react-label">Client ID</span><input className="react-input" value={state.clientId} readOnly /></label>
          <label><span className="react-label">Full Name</span><input className="react-input" value={state.fullName} onChange={(e) => updateField('fullName', e.target.value)} /></label>
          <label><span className="react-label">Phone</span><input className="react-input" value={state.phone} onChange={(e) => updateField('phone', e.target.value)} /></label>
          <label><span className="react-label">Birthday</span><input className="react-input" type="date" value={state.birthday} onChange={(e) => updateField('birthday', e.target.value)} /></label>
          <label><span className="react-label">Gender</span><select className="react-input" value={state.gender} onChange={(e) => updateField('gender', e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
          <label><span className="react-label">Country</span><input className="react-input" value={state.country} onChange={(e) => updateField('country', e.target.value)} /></label>
          <label><span className="react-label">Club</span><input className="react-input" value={state.club} onChange={(e) => updateField('club', e.target.value)} /></label>
          <label><span className="react-label">Sport</span><input className="react-input" value={state.sport} onChange={(e) => updateField('sport', e.target.value)} /></label>
          <label><span className="react-label">Position</span><input className="react-input" value={state.position} onChange={(e) => updateField('position', e.target.value)} /></label>
          <label><span className="react-label">Activity Level</span><select className="react-input" value={state.activityLevel} onChange={(e) => updateField('activityLevel', e.target.value)}><option value="">Select</option><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="very">Very</option><option value="extremely">Extremely</option></select></label>
        </section>

        <section className="react-panel react-grid react-grid-2">
          <label><span className="react-label">Height</span><input className="react-input" value={state.height} onChange={(e) => updateField('height', e.target.value)} /></label>
          <label><span className="react-label">Weight</span><input className="react-input" value={state.weight} onChange={(e) => updateField('weight', e.target.value)} /></label>
          <label><span className="react-label">BMI</span><input className="react-input" value={state.bmi} readOnly /></label>
          <label><span className="react-label">BMR</span><input className="react-input" value={state.bmr} readOnly /></label>
          <label><span className="react-label">InBody BMR</span><input className="react-input" value={state.inbodyBmr} onChange={(e) => updateField('inbodyBmr', e.target.value)} /></label>
          <label><span className="react-label">TDEE</span><input className="react-input" value={state.tdee} readOnly /></label>
          <label><span className="react-label">Body Fat %</span><input className="react-input" value={state.bodyFat} onChange={(e) => updateField('bodyFat', e.target.value)} /></label>
          <label><span className="react-label">Skeletal Muscle</span><input className="react-input" value={state.skeletalMuscle} onChange={(e) => updateField('skeletalMuscle', e.target.value)} /></label>
          <label><span className="react-label">Body Fat Mass</span><input className="react-input" value={state.bodyFatMass} readOnly /></label>
          <label><span className="react-label">Muscle %</span><input className="react-input" value={state.musclePercent} readOnly /></label>
          <label><span className="react-label">Protein Target</span><input className="react-input" value={state.proteinTarget} onChange={(e) => updateField('proteinTarget', e.target.value)} /></label>
          <label><span className="react-label">Carbs Target</span><input className="react-input" value={state.carbsTarget} onChange={(e) => updateField('carbsTarget', e.target.value)} /></label>
          <label><span className="react-label">Fats Target</span><input className="react-input" value={state.fatsTarget} onChange={(e) => updateField('fatsTarget', e.target.value)} /></label>
          <label><span className="react-label">Water Intake</span><input className="react-input" value={state.waterIntake} onChange={(e) => updateField('waterIntake', e.target.value)} /></label>
          <label><span className="react-label">Water In Body</span><input className="react-input" value={state.waterInBody} onChange={(e) => updateField('waterInBody', e.target.value)} /></label>
          <label><span className="react-label">Minerals</span><input className="react-input" value={state.minerals} onChange={(e) => updateField('minerals', e.target.value)} /></label>
        </section>

        <section className="react-panel react-grid">
          <h2 style={{ margin: 0 }}>Daily Training</h2>
          <div className="react-grid react-grid-2">
            {trainingDays.map((day) => (
              <article key={day} className="stat-item react-grid" style={{ gap: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>{day}</h3>
                <label><span className="react-label">Type</span><select className="react-input" value={state.training[day].type} onChange={(e) => updateTraining(day, 'type', e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="rest">Rest</option></select></label>
                <label><span className="react-label">Start</span><input className="react-input" type="time" value={state.training[day].start} onChange={(e) => updateTraining(day, 'start', e.target.value)} /></label>
                <label><span className="react-label">End</span><input className="react-input" type="time" value={state.training[day].end} onChange={(e) => updateTraining(day, 'end', e.target.value)} /></label>
              </article>
            ))}
          </div>
        </section>

        <section className="react-panel react-grid react-grid-2">
          <label><span className="react-label">Goal Weight</span><input className="react-input" value={state.goalWeight} onChange={(e) => updateField('goalWeight', e.target.value)} /></label>
          <label><span className="react-label">Priority</span><select className="react-input" value={state.priority} onChange={(e) => updateField('priority', e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
          <label><span className="react-label">Competition Date</span><input className="react-input" type="date" value={state.competitionDate} onChange={(e) => updateField('competitionDate', e.target.value)} /></label>
          <label><span className="react-label">Supplements</span><textarea className="react-textarea" value={state.supplements} onChange={(e) => updateField('supplements', e.target.value)} /></label>
          <label><span className="react-label">Injuries</span><textarea className="react-textarea" value={state.injuries} onChange={(e) => updateField('injuries', e.target.value)} /></label>
          <label><span className="react-label">Food Allergies</span><textarea className="react-textarea" value={state.foodAllergies} onChange={(e) => updateField('foodAllergies', e.target.value)} /></label>
          <label><span className="react-label">Medical Notes</span><textarea className="react-textarea" value={state.medicalNotes} onChange={(e) => updateField('medicalNotes', e.target.value)} /></label>
          <label><span className="react-label">Food Likes</span><textarea className="react-textarea" value={state.foodLikes} onChange={(e) => updateField('foodLikes', e.target.value)} /></label>
          <label><span className="react-label">Food Dislikes</span><textarea className="react-textarea" value={state.foodDislikes} onChange={(e) => updateField('foodDislikes', e.target.value)} /></label>
          <label><span className="react-label">Mental Observations</span><textarea className="react-textarea" value={state.mentalObservations} onChange={(e) => updateField('mentalObservations', e.target.value)} /></label>
          <label><span className="react-label">Additional Notes</span><textarea className="react-textarea" value={state.additionalNotes} onChange={(e) => updateField('additionalNotes', e.target.value)} /></label>
        </section>

        <section className="react-panel react-inline-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="react-btn" type="submit" disabled={state.saving}>{state.saving ? 'Saving...' : 'Save Profile & Continue'}</button>
        </section>
      </form>
    </main>
  );
}

export default AddClientDetails;
