import { Link } from 'react-router-dom';
import { useClientNutritionProfile } from '../hooks/useClientNutritionProfile';
import '../assets/styles/react-pages.css';

const TRAINING_TYPES = ['low', 'moderate', 'high'];
const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const AM_PM = ['AM', 'PM'];

function Field({ label, children, full = false }) {
  return (
    <label className="react-grid" style={{ gap: '0.35rem', gridColumn: full ? '1 / -1' : 'auto' }}>
      <span className="react-label">{label}</span>
      {children}
    </label>
  );
}

function ClientNutritionProfile() {
  const {
    state,
    constants,
    caloriesLabel,
    hasDraft,
    restoreDraft,
    discardDraft,
    updateField,
    autofill,
    addTraining,
    removeTraining,
    updateTraining,
    toggleTrainingDay,
    addSupplement,
    removeSupplement,
    updateSupplement,
    saveProfile,
  } = useClientNutritionProfile();

  const onSave = async (event) => {
    event.preventDefault();
    await saveProfile();
  };

  if (state.loading) {
    return <main className="react-page-wrap">Loading nutrition profile...</main>;
  }

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1180, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Nutrition Profile</h1>
          <p className="react-muted" style={{ margin: 0 }}>
            Client: {state.clientId || 'Missing'}
          </p>
        </div>
        <Link className="react-btn react-btn-ghost" to={`/client-services?client_id=${encodeURIComponent(state.clientId || '')}`}>
          Back to Services
        </Link>
      </section>

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
      {state.success ? <div className="react-alert react-alert-success">{state.success}</div> : null}
      {hasDraft ? (
        <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
          <p className="react-muted" style={{ margin: 0 }}>Saved draft detected for this nutrition profile.</p>
          <div className="react-inline-actions">
            <button className="react-btn react-btn-ghost" type="button" onClick={restoreDraft}>Restore Draft</button>
            <button className="react-btn react-btn-danger" type="button" onClick={discardDraft}>Discard Draft</button>
          </div>
        </section>
      ) : null}

      <form className="react-grid" style={{ gap: '1rem' }} onSubmit={onSave}>
        <section className="react-panel react-grid">
          <h2 style={{ margin: 0 }}>Physical Measurements</h2>
          <div className="react-grid react-grid-2">
            <Field label="Height (cm)"><input className="react-input" value={state.fields.height} onChange={(e) => updateField('height', e.target.value)} /></Field>
            <Field label="Weight (kg)"><input className="react-input" value={state.fields.weight} onChange={(e) => updateField('weight', e.target.value)} /></Field>
            <Field label="BMI (Auto)"><input className="react-input" value={state.fields.bmi} readOnly /></Field>
            <Field label="Body Fat %"><input className="react-input" value={state.fields.bodyFat} onChange={(e) => updateField('bodyFat', e.target.value)} /></Field>
            <Field label="Skeletal Muscle (kg)"><input className="react-input" value={state.fields.skeletalMuscle} onChange={(e) => updateField('skeletalMuscle', e.target.value)} /></Field>
            <Field label="Body Fat Mass (Auto)"><input className="react-input" value={state.fields.bodyFatMass} readOnly /></Field>
            <Field label="Muscle % (Auto)"><input className="react-input" value={state.fields.musclePercent} readOnly /></Field>
          </div>
        </section>

        <section className="react-panel react-grid">
          <h2 style={{ margin: 0 }}>Metabolism & Nutrition Plan</h2>
          <div className="react-grid react-grid-2">
            <Field label="BMR (Auto)"><input className="react-input" value={state.fields.bmr} readOnly /></Field>
            <Field label="Activity Level">
              <select className="react-input" value={state.fields.activityLevel} onChange={(e) => updateField('activityLevel', e.target.value)}>
                {constants.activityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Sport"><input className="react-input" value={state.fields.sport} onChange={(e) => updateField('sport', e.target.value)} /></Field>
            <Field label="Position"><input className="react-input" value={state.fields.position} onChange={(e) => updateField('position', e.target.value)} /></Field>
            <Field label="TDEE (Auto)"><input className="react-input" value={state.fields.tdee} readOnly /></Field>
            <Field label="Progression Type">
              <select className="react-input" value={state.fields.progressionType} onChange={(e) => updateField('progressionType', e.target.value)}>
                {constants.progressionOptions.map((option) => (
                  <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            <Field label={caloriesLabel}><input className="react-input" value={state.fields.calories} readOnly /></Field>
            <Field label="Protein (g)"><input className="react-input" value={state.fields.protein} readOnly /></Field>
            <Field label="Carbs (g)"><input className="react-input" value={state.fields.carbs} readOnly /></Field>
            <Field label="Fats (g)"><input className="react-input" value={state.fields.fats} readOnly /></Field>
          </div>
        </section>

        <section className="react-panel react-grid">
          <h2 style={{ margin: 0 }}>Hydration & Health Notes</h2>
          <div className="react-grid react-grid-2">
            <Field label="Water In Body (L)"><input className="react-input" value={state.fields.waterInBody} onChange={(e) => updateField('waterInBody', e.target.value)} /></Field>
            <Field label="Water Intake (Auto)"><input className="react-input" value={state.fields.waterIntake} readOnly /></Field>
            <Field label="Minerals"><input className="react-input" value={state.fields.minerals} onChange={(e) => updateField('minerals', e.target.value)} /></Field>
            <Field label="Food Allergies"><input className="react-input" value={state.fields.foodAllergies} onChange={(e) => updateField('foodAllergies', e.target.value)} /></Field>
            <Field label="Test and Record" full><textarea className="react-textarea" value={state.fields.testRecord} onChange={(e) => updateField('testRecord', e.target.value)} /></Field>
            <Field label="Injuries" full><textarea className="react-textarea" value={state.fields.injuries} onChange={(e) => updateField('injuries', e.target.value)} /></Field>
            <Field label="Mental Notes" full><textarea className="react-textarea" value={state.fields.mentalNotes} onChange={(e) => updateField('mentalNotes', e.target.value)} /></Field>
            <Field label="Medical Notes" full><textarea className="react-textarea" value={state.fields.medicalNotes} onChange={(e) => updateField('medicalNotes', e.target.value)} /></Field>
            <Field label="Food Likes" full><textarea className="react-textarea" value={state.fields.foodLikes} onChange={(e) => updateField('foodLikes', e.target.value)} /></Field>
            <Field label="Food Dislikes" full><textarea className="react-textarea" value={state.fields.foodDislikes} onChange={(e) => updateField('foodDislikes', e.target.value)} /></Field>
          </div>
        </section>

        <section className="react-panel react-grid">
          <h2 style={{ margin: 0 }}>Goals & Timeline</h2>
          <div className="react-grid react-grid-2">
            <Field label="Competition">
              <select className="react-input" value={state.fields.competition} onChange={(e) => updateField('competition', e.target.value)}>
                {constants.competitionOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Competition Date"><input className="react-input" type="date" value={state.fields.competitionDate} onChange={(e) => updateField('competitionDate', e.target.value)} /></Field>
            <Field label="Days Left (Auto)"><input className="react-input" value={state.fields.daysLeft} readOnly /></Field>
            <Field label="Goal Weight"><input className="react-input" value={state.fields.goalWeight} onChange={(e) => updateField('goalWeight', e.target.value)} /></Field>
            <Field label="Additional Notes" full><textarea className="react-textarea" value={state.fields.additionalNotes} onChange={(e) => updateField('additionalNotes', e.target.value)} /></Field>
          </div>
        </section>

        <section className="react-panel react-grid">
          <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Training Schedule</h2>
            <button className="react-btn react-btn-ghost" type="button" onClick={addTraining}>+ Add Training Session</button>
          </div>
          {state.trainingSessions.map((session, index) => (
            <article key={`training-${index}`} className="stat-item react-grid">
              <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>Training Session {index + 1}</h3>
                <button className="react-btn react-btn-ghost" type="button" onClick={() => removeTraining(index)}>Remove</button>
              </div>
              <div className="react-grid react-grid-2">
                <Field label="Name"><input className="react-input" value={session.name} onChange={(e) => updateTraining(index, 'name', e.target.value)} /></Field>
                <Field label="Type">
                  <select className="react-input" value={session.type} onChange={(e) => updateTraining(index, 'type', e.target.value)}>
                    {TRAINING_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="react-inline-actions">
                {constants.days.map((day) => {
                  const selected = session.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={selected ? 'react-btn' : 'react-btn react-btn-ghost'}
                      onClick={() => toggleTrainingDay(index, day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="react-grid react-grid-2">
                <div className="react-grid react-grid-2">
                  <Field label="Start Hour">
                    <select className="react-input" value={session.startHour} onChange={(e) => updateTraining(index, 'startHour', e.target.value)}>
                      {HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                    </select>
                  </Field>
                  <Field label="Start Minute">
                    <select className="react-input" value={session.startMin} onChange={(e) => updateTraining(index, 'startMin', e.target.value)}>
                      {MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
                    </select>
                  </Field>
                  <Field label="Start AM/PM">
                    <select className="react-input" value={session.startAmPm} onChange={(e) => updateTraining(index, 'startAmPm', e.target.value)}>
                      {AM_PM.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="react-grid react-grid-2">
                  <Field label="End Hour">
                    <select className="react-input" value={session.endHour} onChange={(e) => updateTraining(index, 'endHour', e.target.value)}>
                      {HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                    </select>
                  </Field>
                  <Field label="End Minute">
                    <select className="react-input" value={session.endMin} onChange={(e) => updateTraining(index, 'endMin', e.target.value)}>
                      {MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
                    </select>
                  </Field>
                  <Field label="End AM/PM">
                    <select className="react-input" value={session.endAmPm} onChange={(e) => updateTraining(index, 'endAmPm', e.target.value)}>
                      {AM_PM.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="react-panel react-grid">
          <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Supplements</h2>
            <button className="react-btn react-btn-ghost" type="button" onClick={addSupplement}>+ Add Supplement</button>
          </div>
          {state.supplements.map((supplement, index) => (
            <article key={`supplement-${index}`} className="stat-item react-grid">
              <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>Supplement {index + 1}</h3>
                <button className="react-btn react-btn-ghost" type="button" onClick={() => removeSupplement(index)}>Remove</button>
              </div>
              <div className="react-grid react-grid-2">
                <Field label="Name"><input className="react-input" value={supplement.name} onChange={(e) => updateSupplement(index, 'name', e.target.value)} /></Field>
                <Field label="Amount (grams)"><input className="react-input" value={supplement.amount} onChange={(e) => updateSupplement(index, 'amount', e.target.value)} /></Field>
                <Field label="Notes" full><textarea className="react-textarea" value={supplement.notes} onChange={(e) => updateSupplement(index, 'notes', e.target.value)} /></Field>
              </div>
            </article>
          ))}
        </section>

        <section className="react-panel react-inline-actions">
          <button className="react-btn react-btn-ghost" type="button" onClick={autofill}>Autofill</button>
          <button className="react-btn" type="submit" disabled={state.saving}>{state.saving ? 'Saving...' : 'Save Nutrition Profile'}</button>
        </section>
      </form>
    </main>
  );
}

export default ClientNutritionProfile;
