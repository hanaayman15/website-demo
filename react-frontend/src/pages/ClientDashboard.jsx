import { Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import '../assets/styles/react-pages.css';

function ClientDashboard() {
  const {
    loading,
    syncing,
    error,
    profile,
    summary,
    displayName,
    todayMeals,
    mealStatuses,
    macro,
    toggleMealStatus,
  } = useDashboardData();

  const macroItems = [
    {
      key: 'protein',
      label: 'Protein',
      consumed: macro.consumed.protein,
      target: macro.target.protein,
      unit: 'g',
    },
    {
      key: 'carbs',
      label: 'Carbs',
      consumed: macro.consumed.carbs,
      target: macro.target.carbs,
      unit: 'g',
    },
    {
      key: 'fats',
      label: 'Fats',
      consumed: macro.consumed.fats,
      target: macro.target.fats,
      unit: 'g',
    },
  ];

  if (loading) {
    return <main className="react-page-wrap">Loading dashboard...</main>;
  }

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem' }}>
      <section className="react-panel">
        <h1 style={{ marginTop: 0 }}>Welcome back, {displayName}</h1>
        <p style={{ marginBottom: 0 }}>Email: {profile?.email || 'N/A'}</p>
      </section>

      {error ? <div className="react-alert react-alert-error">{error}</div> : null}

      <section className="react-panel">
        <h2 style={{ marginTop: 0 }}>Summary</h2>
        <div className="stat-list">
          <article className="stat-item">
            <div className="stat-label">Current Weight</div>
            <div className="stat-value">{summary.weight ?? 'N/A'} kg</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Goal Weight</div>
            <div className="stat-value">{summary.goalWeight ?? 'N/A'} kg</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Target Calories</div>
            <div className="stat-value">{summary.targetCalories ? Math.round(summary.targetCalories) : 'N/A'} kcal</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Macro Targets</div>
            <div className="stat-value" style={{ fontSize: '1rem' }}>
              P {Math.round(summary.protein)}g / C {Math.round(summary.carbs)}g / F {Math.round(summary.fats)}g
            </div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Meals Completed</div>
            <div className="stat-value">{macro.completeMeals}/{macro.totalMeals}</div>
          </article>
          <article className="stat-item">
            <div className="stat-label">Calories</div>
            <div className="stat-value">{macro.consumed.calories}/{macro.target.calories} kcal</div>
          </article>
        </div>
      </section>

      <section className="react-panel react-grid">
        <div className="react-row-between">
          <h2 style={{ margin: 0 }}>Today Meal Status</h2>
          {syncing ? <small className="react-muted">Syncing...</small> : null}
        </div>

        {!todayMeals.length ? (
          <p className="react-muted" style={{ margin: 0 }}>No meals scheduled for today.</p>
        ) : (
          <div className="react-meals-list">
            {todayMeals.map((meal) => {
              const status = mealStatuses[meal.mealId] === 'completed' ? 'completed' : 'not-completed';
              return (
                <article key={meal.mealId} className={`react-meal-card ${status === 'completed' ? 'is-complete' : ''}`}>
                  <div className="react-row-between">
                    <div>
                      <strong>{meal.mealLabel}</strong>
                      <div className="react-muted">{meal.scheduledTime || 'N/A'}</div>
                    </div>
                    <button
                      className={`react-btn ${status === 'completed' ? 'react-btn-ghost' : ''}`}
                      type="button"
                      onClick={() => toggleMealStatus(meal.mealId)}
                    >
                      {status === 'completed' ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="react-panel react-grid">
        <h2 style={{ margin: 0 }}>Macro Tracking</h2>
        {macroItems.map((item) => {
          const progress = item.target > 0 ? Math.min((item.consumed / item.target) * 100, 100) : 0;
          return (
            <div key={item.key} className="react-macro-row">
              <div className="react-row-between">
                <span>{item.label}</span>
                <span>{item.consumed}{item.unit} / {item.target}{item.unit}</span>
              </div>
              <div className="react-progress-track">
                <div className="react-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="react-panel">
        <h2 style={{ marginTop: 0 }}>Quick Navigation</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link className="react-btn" to="/client-detail">Client Details</Link>
          <Link className="react-btn" to="/progress">Progress</Link>
          <Link className="react-btn" to="/client-recipes">Recipes</Link>
        </div>
      </section>
    </main>
  );
}

export default ClientDashboard;
