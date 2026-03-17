import { Link, useNavigate } from 'react-router-dom';
import { HOME_RECIPES, useClientPortalHome } from '../hooks/useClientPortalHome';
import '../assets/styles/react-pages.css';

function ClientMain() {
  const navigate = useNavigate();
  const { state, activeRecipe, avatarInitials, openRecipe, closeRecipe } = useClientPortalHome({ requireAuth: true });
  const recipes = Object.values(HOME_RECIPES);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    navigate('/client-home');
  };

  if (state.loading) {
    return <main className="react-page-wrap">Loading home data...</main>;
  }

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1100, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>My Nutrition Portal</h1>
          <p className="react-muted" style={{ margin: 0 }}>Welcome back, {state.summary.fullName}.</p>
        </div>
        <div className="react-inline-actions" style={{ alignItems: 'center' }}>
          <div className="stat-item" style={{ minWidth: 52, textAlign: 'center', padding: '0.45rem' }}>{avatarInitials}</div>
          <button className="react-btn react-btn-ghost" type="button" onClick={logout}>Logout</button>
        </div>
      </section>

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}

      <section className="react-panel react-grid react-grid-2">
        <article className="stat-item"><div className="stat-label">Current Weight</div><div className="stat-value">{state.summary.currentWeight ? `${state.summary.currentWeight} kg` : '--'}</div></article>
        <article className="stat-item"><div className="stat-label">Target Weight</div><div className="stat-value">{state.summary.targetWeight ? `${state.summary.targetWeight} kg` : '--'}</div></article>
        <article className="stat-item"><div className="stat-label">Calories Target</div><div className="stat-value">{state.summary.caloriesTarget ? `${state.summary.caloriesTarget} kcal` : '--'}</div></article>
        <article className="stat-item"><div className="stat-label">Subscription</div><div className="stat-value">{state.summary.subscriptionPlan}</div></article>
      </section>

      <section className="react-panel react-grid">
        <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Performance Recipes</h2>
          <Link className="react-btn react-btn-ghost" to="/client-recipes">View All</Link>
        </div>
        <div className="react-grid react-grid-2">
          {recipes.map((recipe) => (
            <article key={recipe.key} className="stat-item react-grid" style={{ gap: '0.35rem' }}>
              <h3 style={{ margin: 0 }}>{recipe.name}</h3>
              <p className="react-muted" style={{ margin: 0 }}>{recipe.description}</p>
              <div className="react-row-between">
                <span>{recipe.calories} Cal</span>
                <span>{recipe.protein}g Protein</span>
              </div>
              <button className="react-btn" type="button" onClick={() => openRecipe(recipe.key)}>View Recipe</button>
            </article>
          ))}
        </div>
      </section>

      {activeRecipe ? (
        <section className="react-panel react-grid" style={{ borderColor: '#bfdbfe', background: '#eff6ff' }}>
          <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>{activeRecipe.title}</h2>
            <button className="react-btn react-btn-ghost" type="button" onClick={closeRecipe}>Close</button>
          </div>
          <p className="react-muted" style={{ margin: 0 }}>{activeRecipe.description}</p>
          <p style={{ margin: 0 }}>Serving: {activeRecipe.servingGrams}g</p>
          <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
            <span>Calories: {activeRecipe.nutrition.calories}</span>
            <span>Protein: {activeRecipe.nutrition.protein}g</span>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default ClientMain;
