import { Link, useNavigate } from 'react-router-dom';
import { useMentalCoaching } from '../hooks/useMentalCoaching';
import '../assets/styles/react-pages.css';

function MentalCoaching() {
  const navigate = useNavigate();
  const { state, progress, setWeeklyGoal, markExerciseComplete, completeChallenge } = useMentalCoaching();

  const exercises = [
    { key: 'breathing', title: 'Breathing Routine', details: '4-7-8 technique for 10 minutes daily.' },
    { key: 'visualization', title: 'Visualization Exercise', details: 'Picture perfect performance before sleep.' },
    { key: 'focus', title: 'Focus Drill', details: 'Single-point concentration for 5-10 minutes.' },
  ];

  const editGoal = () => {
    const next = window.prompt('Enter your new weekly focus goal:', state.weeklyGoal);
    if (!next) return;
    setWeeklyGoal(next);
  };

  const goToUpgrade = () => {
    navigate('/subscription-plan?upgrade=mental-performance');
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1100, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Mental Performance Program</h1>
          <p className="react-muted" style={{ margin: 0 }}>Strengthen your mindset and daily focus routines.</p>
        </div>
        <div className="react-inline-actions">
          <Link className="react-btn react-btn-ghost" to="/anti-doping">Anti-Doping</Link>
          <button className="react-btn" type="button" onClick={goToUpgrade}>Upgrade</button>
        </div>
      </section>

      <section className="react-panel">
        <p style={{ margin: 0, fontWeight: 700, textAlign: 'center' }}>
          "Your results are not limited by your body, they are limited by your mindset."
        </p>
      </section>

      <section className="react-panel react-grid" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 2 }}>
          <div className="react-panel react-grid" style={{ maxWidth: 430, borderColor: '#c4b5fd' }}>
            <h2 style={{ margin: 0 }}>Premium Feature</h2>
            <p className="react-muted" style={{ margin: 0 }}>
              Mental performance drills are premium and require upgrade.
            </p>
            <button className="react-btn" type="button" onClick={goToUpgrade}>Upgrade Now</button>
          </div>
        </div>

        <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>
          <article className="stat-item react-grid" style={{ marginBottom: '0.75rem', gap: '0.4rem' }}>
            <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>Weekly Focus Goal</h2>
              <button className="react-btn react-btn-ghost" type="button" onClick={editGoal}>Edit Goal</button>
            </div>
            <p style={{ margin: 0 }}>{state.weeklyGoal}</p>
          </article>

          <div className="react-grid react-grid-2">
            {exercises.map((exercise) => {
              const isDone = state.completedExercises.includes(exercise.key);
              return (
                <article key={exercise.key} className="stat-item react-grid" style={{ gap: '0.45rem' }}>
                  <h3 style={{ margin: 0 }}>{exercise.title}</h3>
                  <p className="react-muted" style={{ margin: 0 }}>{exercise.details}</p>
                  <button className="react-btn" type="button" onClick={() => markExerciseComplete(exercise.key)}>
                    {isDone ? 'Completed Today' : 'Mark Complete'}
                  </button>
                </article>
              );
            })}
          </div>

          <article className="stat-item react-grid" style={{ marginTop: '0.75rem', gap: '0.4rem' }}>
            <div className="react-row-between">
              <span>Today&apos;s Progress</span>
              <strong>{progress.label}</strong>
            </div>
            <div className="react-progress-track">
              <div className="react-progress-fill" style={{ width: `${progress.percentage}%` }} />
            </div>
            <button className="react-btn react-btn-ghost" type="button" onClick={completeChallenge}>
              Complete Weekly Challenge
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}

export default MentalCoaching;
