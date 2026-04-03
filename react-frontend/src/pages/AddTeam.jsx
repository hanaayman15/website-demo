import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAddTeam } from '../hooks/useAddTeam';
import { WORLD_COUNTRIES, WORLD_PHONE_OPTIONS, WORLD_SPORTS } from '../constants/globalOptions';
import '../assets/styles/react-pages.css';

const PHONE_OPTIONS = WORLD_PHONE_OPTIONS;

const TRAINING_TYPES = ['low', 'moderate', 'high'];
const DAYS = ['Mo', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const AMPM = ['AM', 'PM'];

function getCaloriesLabel(progressionType) {
  if (progressionType === 'cut') return 'Cut Calories';
  if (progressionType === 'bulk') return 'Bulk Calories';
  return 'Maintain Calories';
}

function AddTeam() {
  const {
    state,
    canSave,
    setField,
    setPackageSize,
    updatePlayerField,
    recalcPlayer,
    addTrainingSession,
    removeTrainingSession,
    updateTrainingSession,
    toggleTrainingDay,
    addSupplement,
    removeSupplement,
    updateSupplement,
    autofillPlayers,
    parseSessionInfo,
    parseSupplementInfo,
    save,
  } = useAddTeam();

  const [packageChoice, setPackageChoice] = useState('');
  const [customPackageSize, setCustomPackageSize] = useState('');

  const generatedPlayersLabel = useMemo(() => `${state.players.length} players generated`, [state.players.length]);

  useEffect(() => {
    const size = Number(state.packageSize || 0);
    if (!size) {
      setPackageChoice('');
      setCustomPackageSize('');
      return;
    }
    if ([20, 25, 30].includes(size)) {
      setPackageChoice(String(size));
      setCustomPackageSize('');
      return;
    }
    setPackageChoice('custom');
    setCustomPackageSize(String(size));
  }, [state.packageSize]);

  const handlePackageChoiceChange = (value) => {
    setPackageChoice(value);
    if (!value) {
      setPackageSize(0);
      return;
    }
    if (value === 'custom') {
      const custom = Number(customPackageSize);
      setPackageSize(Number.isFinite(custom) && custom > 0 ? custom : 0);
      return;
    }
    setPackageSize(Number(value));
  };

  const handleCustomSizeChange = (value) => {
    setCustomPackageSize(value);
    const parsed = Number(value);
    setPackageSize(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1280, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>{state.editingTeamId ? 'Edit Team' : 'Add Team'}</h1>
          <p className="react-muted" style={{ margin: 0 }}>Dynamic roster builder with full player profiles and auto calculations.</p>
        </div>
        <div className="react-inline-actions">
          <Link className="react-btn react-btn-ghost" to="/">Back</Link>
          <button className="react-btn react-btn-ghost" type="button" onClick={autofillPlayers}>Autofill Empty Fields</button>
        </div>
      </section>

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}
      {state.success ? <div className="react-alert react-alert-success">{state.success}</div> : null}

      <form className="react-grid" style={{ gap: '1rem' }} onSubmit={save}>
        <section className="react-panel react-grid react-grid-2">
          <h2 style={{ margin: 0, gridColumn: '1 / -1' }}>Team Information</h2>
          <label><span className="react-label">Team Name</span><input className="react-input" value={state.teamName} onChange={(e) => setField('teamName', e.target.value)} /></label>
          <label><span className="react-label">Sport Type</span>
            <select className="react-input" value={state.sportType} onChange={(e) => setField('sportType', e.target.value)}>
              <option value="">Select sport</option>
              {WORLD_SPORTS.map((sport) => <option key={`team-sport-${sport}`} value={sport}>{sport}</option>)}
            </select>
          </label>
          <label><span className="react-label">Coach Name</span><input className="react-input" value={state.coachName} onChange={(e) => setField('coachName', e.target.value)} /></label>
          <label><span className="react-label">Start Date</span><input className="react-input" type="date" value={state.startDate} onChange={(e) => setField('startDate', e.target.value)} /></label>
          <label><span className="react-label">Package Size</span>
            <select className="react-input" value={packageChoice} onChange={(e) => handlePackageChoiceChange(e.target.value)}>
              <option value="">Select</option>
              <option value="20">20 Players</option>
              <option value="25">25 Players</option>
              <option value="30">30 Players</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          {packageChoice === 'custom' ? (
            <label>
              <span className="react-label">Custom Number of Players</span>
              <input className="react-input" type="number" min="1" max="100" value={customPackageSize} onChange={(e) => handleCustomSizeChange(e.target.value)} />
            </label>
          ) : null}
          <div className="stat-item" style={{ alignSelf: 'end' }}>{generatedPlayersLabel}</div>
        </section>

        <section className="react-grid">
          <h2 style={{ margin: 0 }}>Players</h2>
          {state.players.map((player, index) => {
            const sessions = (player.training_sessions || []).map(parseSessionInfo);
            const supplements = (player.supplements_list || []).map(parseSupplementInfo);
            const caloriesLabel = getCaloriesLabel(player.progression_type);
            return (
              <article key={player.player_number} className="react-panel react-grid" style={{ gap: '0.75rem' }}>
                <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0 }}>Player {index + 1}</h2>
                  <button className="react-btn react-btn-ghost" type="button" onClick={() => recalcPlayer(index)}>Recalculate</button>
                </div>

                <h3 style={{ margin: 0 }}>Basic Information</h3>
                <div className="react-grid react-grid-2">
                  <label><span className="react-label">Client ID (auto-generated)</span><input className="react-input" value={player.client_id || 'Auto'} readOnly /></label>
                  <label><span className="react-label">Full Name</span><input className="react-input" value={player.full_name} onChange={(e) => updatePlayerField(index, 'full_name', e.target.value)} placeholder="Auto Filled Client Profile Name" /><small className="react-muted">Must contain at least 4 names.</small></label>
                  <label><span className="react-label">Phone</span>
                    <select className="react-input" value={player.phone_country_code} onChange={(e) => updatePlayerField(index, 'phone_country_code', e.target.value)}>
                      {PHONE_OPTIONS.map((opt) => <option key={opt.display} value={opt.dial}>{opt.display}</option>)}
                    </select>
                  </label>
                  <label><span className="react-label">&nbsp;</span><input className="react-input" value={player.phone_number} onChange={(e) => updatePlayerField(index, 'phone_number', e.target.value)} placeholder="1000000000" /></label>
                  <label><span className="react-label">Email Address</span><input className="react-input" value={player.email} onChange={(e) => updatePlayerField(index, 'email', e.target.value)} placeholder="autofill_17740218h50952@example.com" /></label>
                  <label><span className="react-label">Password</span><input className="react-input" type="password" value={player.password} onChange={(e) => updatePlayerField(index, 'password', e.target.value)} placeholder="••••••••••" /></label>
                  <label><span className="react-label">Gender</span><select className="react-input" value={player.gender} onChange={(e) => updatePlayerField(index, 'gender', e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
                  <label><span className="react-label">Birthday (dd/mm/yyyy)</span><input className="react-input" type="date" value={player.birthday} onChange={(e) => updatePlayerField(index, 'birthday', e.target.value)} /></label>
                  <label><span className="react-label">Age</span><input className="react-input" type="number" min="1" value={player.age} onChange={(e) => updatePlayerField(index, 'age', e.target.value)} /></label>
                  <label><span className="react-label">Country</span>
                    <select className="react-input" value={player.country} onChange={(e) => updatePlayerField(index, 'country', e.target.value)}>
                      <option value="">Select country</option>
                      {WORLD_COUNTRIES.map((country) => <option key={`player-country-${country}`} value={country}>{country}</option>)}
                    </select>
                  </label>
                  <label><span className="react-label">Sport Club</span><input className="react-input" value={player.club} onChange={(e) => updatePlayerField(index, 'club', e.target.value)} placeholder="Auto Club" /></label>
                  <label><span className="react-label">Religion</span><input className="react-input" value={player.religion} onChange={(e) => updatePlayerField(index, 'religion', e.target.value)} placeholder="Other" /></label>
                </div>

                <h3 style={{ margin: 0 }}>Physical Measurements</h3>
                <div className="react-grid react-grid-2">
                  <label><span className="react-label">Height (cm)</span><input className="react-input" value={player.height} onChange={(e) => updatePlayerField(index, 'height', e.target.value)} /></label>
                  <label><span className="react-label">Weight (kg)</span><input className="react-input" value={player.weight} onChange={(e) => updatePlayerField(index, 'weight', e.target.value)} /></label>
                  <label><span className="react-label">BMI (Calc / Auto)</span><input className="react-input" value={player.bmi} readOnly /></label>
                  <label><span className="react-label">Body Fat %</span><input className="react-input" value={player.body_fat_percentage} onChange={(e) => updatePlayerField(index, 'body_fat_percentage', e.target.value)} /></label>
                  <label><span className="react-label">Skeletal Muscle (kg)</span><input className="react-input" value={player.skeletal_muscle} onChange={(e) => updatePlayerField(index, 'skeletal_muscle', e.target.value)} /></label>
                  <label><span className="react-label">Body Fat Mass (Auto)</span><input className="react-input" value={player.body_fat_mass} readOnly /></label>
                  <label><span className="react-label">Muscle % (Auto)</span><input className="react-input" value={player.muscle_percentage} readOnly /></label>
                </div>

                <h3 style={{ margin: 0 }}>Metabolism & Activity</h3>
                <div className="react-grid react-grid-2">
                  <label><span className="react-label">BMR (Calc)</span><input className="react-input" value={player.bmr} readOnly /></label>
                  <label><span className="react-label">Activity Level</span><select className="react-input" value={player.activity_level} onChange={(e) => updatePlayerField(index, 'activity_level', e.target.value)}><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="active">Active</option><option value="athlete">Athlete</option></select></label>
                  <label><span className="react-label">Sports</span>
                    <select className="react-input" value={player.sport} onChange={(e) => updatePlayerField(index, 'sport', e.target.value)}>
                      <option value="">Select sport</option>
                      {WORLD_SPORTS.map((sport) => <option key={`player-sport-${sport}`} value={sport}>{sport}</option>)}
                    </select>
                  </label>
                  <label><span className="react-label">Position</span><input className="react-input" value={player.position} onChange={(e) => updatePlayerField(index, 'position', e.target.value)} /></label>
                  <label><span className="react-label">TDEE (Calc)</span><input className="react-input" value={player.tdee} readOnly /></label>
                </div>

                <h3 style={{ margin: 0 }}>Nutrition Plan</h3>
                <div className="react-grid react-grid-2">
                  <label><span className="react-label">Progression Type</span><select className="react-input" value={player.progression_type} onChange={(e) => updatePlayerField(index, 'progression_type', e.target.value)}><option value="cut">Cut</option><option value="maintain">Maintain</option><option value="bulk">Bulk</option></select></label>
                  <label><span className="react-label">{caloriesLabel}</span><input className="react-input" value={player.calories} readOnly /></label>
                  <label><span className="react-label">Protein (g) (Calc)</span><input className="react-input" value={player.protein_target} readOnly /></label>
                  <label><span className="react-label">Carbs (g) (Calc)</span><input className="react-input" value={player.carbs_target} readOnly /></label>
                  <label><span className="react-label">Fats (g) (Calc)</span><input className="react-input" value={player.fats_target} readOnly /></label>
                </div>

                <h3 style={{ margin: 0 }}>Hydration</h3>
                <div className="react-grid react-grid-2">
                  <label><span className="react-label">Water (from InBody) (L)</span><input className="react-input" value={player.water_in_body} onChange={(e) => updatePlayerField(index, 'water_in_body', e.target.value)} /></label>
                  <label><span className="react-label">Water Intake (daily liters) (Calc)</span><input className="react-input" value={player.water_intake} readOnly /></label>
                  <label><span className="react-label">Minerals (from InBody)</span><input className="react-input" value={player.minerals} onChange={(e) => updatePlayerField(index, 'minerals', e.target.value)} /></label>
                </div>

                <h3 style={{ margin: 0 }}>Health & Observations</h3>
                <div className="react-grid react-grid-2">
                  <label><span className="react-label">Test and Record</span><textarea className="react-textarea" value={player.test_and_record} onChange={(e) => updatePlayerField(index, 'test_and_record', e.target.value)} /></label>
                  <label><span className="react-label">Injuries</span><textarea className="react-textarea" value={player.injuries} onChange={(e) => updatePlayerField(index, 'injuries', e.target.value)} /></label>
                  <label><span className="react-label">Mental Notes</span><textarea className="react-textarea" value={player.mental_notes} onChange={(e) => updatePlayerField(index, 'mental_notes', e.target.value)} /></label>
                  <label><span className="react-label">Food Allergies</span><textarea className="react-textarea" value={player.food_allergies} onChange={(e) => updatePlayerField(index, 'food_allergies', e.target.value)} /></label>
                  <label><span className="react-label">Medical Notes</span><textarea className="react-textarea" value={player.medical_notes} onChange={(e) => updatePlayerField(index, 'medical_notes', e.target.value)} /></label>
                </div>

                <h3 style={{ margin: 0 }}>Food Preferences</h3>
                <div className="react-grid react-grid-2">
                  <label><span className="react-label">Food Likes</span><textarea className="react-textarea" value={player.food_likes} onChange={(e) => updatePlayerField(index, 'food_likes', e.target.value)} /></label>
                  <label><span className="react-label">Food Dislikes</span><textarea className="react-textarea" value={player.food_dislikes} onChange={(e) => updatePlayerField(index, 'food_dislikes', e.target.value)} /></label>
                </div>

                <h3 style={{ margin: 0 }}>Goals & Timeline</h3>
                <div className="react-grid react-grid-2">
                  <label><span className="react-label">Competition (default: None)</span><select className="react-input" value={player.competition_status || 'none'} onChange={(e) => updatePlayerField(index, 'competition_status', e.target.value)}><option value="none">None</option><option value="upcoming">Upcoming</option></select></label>
                  <label><span className="react-label">Competition Date</span><input className="react-input" type="date" value={player.competition_date} onChange={(e) => updatePlayerField(index, 'competition_date', e.target.value)} /></label>
                  <label><span className="react-label">Days Left (Calc)</span><input className="react-input" value={player.days_left} readOnly /></label>
                  <label><span className="react-label">Goal Weight (kg)</span><input className="react-input" value={player.goal_weight} onChange={(e) => updatePlayerField(index, 'goal_weight', e.target.value)} /></label>
                  <label style={{ gridColumn: '1 / -1' }}><span className="react-label">Additional Notes</span><textarea className="react-textarea" value={player.additional_notes} onChange={(e) => updatePlayerField(index, 'additional_notes', e.target.value)} /></label>
                </div>

                <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>Training Schedule</h3>
                  <button className="react-btn react-btn-ghost" type="button" onClick={() => addTrainingSession(index)}>+ Add Training Session</button>
                </div>
                {sessions.map((session, sIndex) => (
                  <article key={`p-${index}-session-${sIndex}`} className="stat-item react-grid" style={{ gap: '0.5rem' }}>
                    <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
                      <strong>Training Session {sIndex + 1}</strong>
                      <button className="react-btn react-btn-ghost" type="button" onClick={() => removeTrainingSession(index, sIndex)}>Remove</button>
                    </div>
                    <div className="react-grid react-grid-2">
                      <label><span className="react-label">Training Name</span><input className="react-input" value={session.name} onChange={(e) => updateTrainingSession(index, sIndex, 'name', e.target.value)} /></label>
                      <label><span className="react-label">Training Type</span><select className="react-input" value={session.type} onChange={(e) => updateTrainingSession(index, sIndex, 'type', e.target.value)}>{TRAINING_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                    </div>
                    <div className="react-inline-actions">
                      {DAYS.map((day) => {
                        const selected = session.days.includes(day);
                        return (
                          <button key={`${index}-${sIndex}-${day}`} type="button" className={selected ? 'react-btn' : 'react-btn react-btn-ghost'} onClick={() => toggleTrainingDay(index, sIndex, day)}>{day}</button>
                        );
                      })}
                    </div>
                    <div className="react-grid react-grid-2">
                      <label><span className="react-label">Start Time</span><div className="react-inline-actions"><select className="react-input" value={session.start_hour} onChange={(e) => updateTrainingSession(index, sIndex, 'start_hour', e.target.value)}>{HOURS.map((x) => <option key={x} value={x}>{x}</option>)}</select><select className="react-input" value={session.start_min} onChange={(e) => updateTrainingSession(index, sIndex, 'start_min', e.target.value)}>{MINUTES.map((x) => <option key={x} value={x}>{x}</option>)}</select><select className="react-input" value={session.start_ampm} onChange={(e) => updateTrainingSession(index, sIndex, 'start_ampm', e.target.value)}>{AMPM.map((x) => <option key={x} value={x}>{x}</option>)}</select></div></label>
                      <label><span className="react-label">End Time</span><div className="react-inline-actions"><select className="react-input" value={session.end_hour} onChange={(e) => updateTrainingSession(index, sIndex, 'end_hour', e.target.value)}>{HOURS.map((x) => <option key={x} value={x}>{x}</option>)}</select><select className="react-input" value={session.end_min} onChange={(e) => updateTrainingSession(index, sIndex, 'end_min', e.target.value)}>{MINUTES.map((x) => <option key={x} value={x}>{x}</option>)}</select><select className="react-input" value={session.end_ampm} onChange={(e) => updateTrainingSession(index, sIndex, 'end_ampm', e.target.value)}>{AMPM.map((x) => <option key={x} value={x}>{x}</option>)}</select></div></label>
                    </div>
                  </article>
                ))}

                <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>Supplements</h3>
                  <button className="react-btn react-btn-ghost" type="button" onClick={() => addSupplement(index)}>+ Add Supplement</button>
                </div>
                {supplements.map((supplement, spIndex) => (
                  <article key={`p-${index}-supp-${spIndex}`} className="stat-item react-grid" style={{ gap: '0.5rem' }}>
                    <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
                      <strong>Supplement {spIndex + 1}</strong>
                      <button className="react-btn react-btn-ghost" type="button" onClick={() => removeSupplement(index, spIndex)}>Remove</button>
                    </div>
                    <div className="react-grid react-grid-2">
                      <label><span className="react-label">Supplement Name</span><input className="react-input" value={supplement.name} onChange={(e) => updateSupplement(index, spIndex, 'name', e.target.value)} /></label>
                      <label><span className="react-label">Amount (grams)</span><input className="react-input" value={supplement.amount} onChange={(e) => updateSupplement(index, spIndex, 'amount', e.target.value)} /></label>
                      <label style={{ gridColumn: '1 / -1' }}><span className="react-label">Notes</span><textarea className="react-textarea" value={supplement.notes} onChange={(e) => updateSupplement(index, spIndex, 'notes', e.target.value)} /></label>
                    </div>
                  </article>
                ))}
              </article>
            );
          })}
        </section>

        <section className="react-panel react-inline-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="react-btn" type="submit" disabled={state.saving || !canSave}>{state.saving ? 'Saving...' : 'Save Team'}</button>
        </section>
      </form>
    </main>
  );
}

export default AddTeam;
