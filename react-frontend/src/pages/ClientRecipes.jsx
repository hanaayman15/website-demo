import { Link } from 'react-router-dom';
import {
  normalizeRecipeTypeLabel,
  useClientRecipes,
} from '../hooks/useClientRecipes';
import '../assets/styles/react-pages.css';

const FILTERS = [
  { key: 'all', label: 'All Recipes' },
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
  { key: 'pre-workout', label: 'Pre-Workout' },
  { key: 'post-workout', label: 'Post-Workout' },
];

function ClientRecipes() {
  const {
    state,
    visibleRecipes,
    activeRecipe,
    setFilter,
    setSearch,
    openRecipe,
    closeRecipe,
  } = useClientRecipes();

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1200, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>All Recipes</h1>
          <p className="react-muted" style={{ margin: 0 }}>
            Explore healthy recipes by meal type and macro profile.
          </p>
        </div>
        <Link className="react-btn react-btn-ghost" to="/client-home">Back to Home</Link>
      </section>

      <section className="react-panel react-grid">
        <label>
          <span className="react-label">Search recipes</span>
          <input
            className="react-input"
            type="text"
            value={state.search}
            placeholder="Search by recipe name, description, or ingredient"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="react-inline-actions">
          {FILTERS.map((filter) => {
            const active = state.activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                className={active ? 'react-btn' : 'react-btn react-btn-ghost'}
                onClick={() => setFilter(filter.key)}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="react-grid react-grid-2">
        {visibleRecipes.map((recipe) => (
          <article key={recipe.id} className="react-panel react-grid" style={{ gap: '0.6rem' }}>
            <div className="react-row-between">
              <h3 style={{ margin: 0 }}>{recipe.name}</h3>
              <span style={{ fontSize: '1.7rem' }} aria-hidden="true">{recipe.image}</span>
            </div>
            <span className="react-muted">{normalizeRecipeTypeLabel(recipe.type)}</span>
            <p className="react-muted" style={{ margin: 0 }}>{recipe.description}</p>
            <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
              <span>{recipe.nutrition.calories} cal</span>
              <span>P: {recipe.nutrition.protein}g</span>
              <span>C: {recipe.nutrition.carbs}g</span>
              <span>F: {recipe.nutrition.fats}g</span>
            </div>
            <button className="react-btn" type="button" onClick={() => openRecipe(recipe.id)}>
              View details
            </button>
          </article>
        ))}
      </section>

      {!visibleRecipes.length ? (
        <section className="react-panel react-muted">No recipes match your current filter.</section>
      ) : null}

      {activeRecipe ? (
        <section className="react-panel react-grid" style={{ borderColor: '#bfdbfe', background: '#eff6ff' }}>
          <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>{activeRecipe.name}</h2>
            <button className="react-btn react-btn-ghost" type="button" onClick={closeRecipe}>Close</button>
          </div>
          <p className="react-muted" style={{ margin: 0 }}>{activeRecipe.description}</p>
          <p style={{ margin: 0 }}>
            Type: {normalizeRecipeTypeLabel(activeRecipe.type)} | Serving: {activeRecipe.servingGrams}g
          </p>
          <div className="react-row-between" style={{ flexWrap: 'wrap' }}>
            <span>Calories: {activeRecipe.nutrition.calories}</span>
            <span>Protein: {activeRecipe.nutrition.protein}g</span>
            <span>Carbs: {activeRecipe.nutrition.carbs}g</span>
            <span>Fats: {activeRecipe.nutrition.fats}g</span>
          </div>
          <div>
            <h4 style={{ marginTop: 0 }}>Ingredients</h4>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {activeRecipe.ingredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ marginTop: 0 }}>Instructions</h4>
            <pre className="react-json-block" style={{ whiteSpace: 'pre-wrap' }}>{activeRecipe.instructions}</pre>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default ClientRecipes;
