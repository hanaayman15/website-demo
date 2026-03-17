import { Link } from 'react-router-dom';
import { HOME_RECIPES, useClientPortalHome } from '../hooks/useClientPortalHome';
import '../assets/styles/react-pages.css';

function ClientHome() {
  const { state, activeRecipe, openRecipe, closeRecipe } = useClientPortalHome({ requireAuth: false });
  const recipes = Object.values(HOME_RECIPES);

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1100, gap: '1rem' }}>
      <section className="react-panel react-grid" style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>Client Nutrition Portal</h1>
        <p className="react-muted" style={{ margin: 0 }}>Personalized nutrition and mental coaching for athletes.</p>
        <div className="react-inline-actions" style={{ justifyContent: 'center' }}>
          <Link className="react-btn" to="/client-signup">Get Started</Link>
          <Link className="react-btn react-btn-ghost" to="/client-login">Client Login</Link>
        </div>
      </section>

      {state.error ? <div className="react-alert react-alert-error">{state.error}</div> : null}

      {state.isAuthenticated ? (
        <section className="react-panel react-grid react-grid-2">
          <article className="stat-item"><div className="stat-label">Welcome</div><div className="stat-value">{state.summary.fullName}</div></article>
          <article className="stat-item"><div className="stat-label">Current Weight</div><div className="stat-value">{state.summary.currentWeight ? `${state.summary.currentWeight} kg` : '--'}</div></article>
          <article className="stat-item"><div className="stat-label">Target Weight</div><div className="stat-value">{state.summary.targetWeight ? `${state.summary.targetWeight} kg` : '--'}</div></article>
          <article className="stat-item"><div className="stat-label">Calories Target</div><div className="stat-value">{state.summary.caloriesTarget ? `${state.summary.caloriesTarget} kcal` : '--'}</div></article>
        </section>
      ) : null}

      <section className="react-panel react-grid">
        <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Performance Recipes</h2>
          <Link className="react-btn react-btn-ghost" to="/subscription-plan?upgrade=recipes">Unlock Full Library</Link>
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
              <button className="react-btn react-btn-ghost" type="button" onClick={() => openRecipe(recipe.key)}>Preview</button>
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
        </section>
      ) : null}
    </main>
  );
}

export default ClientHome;
