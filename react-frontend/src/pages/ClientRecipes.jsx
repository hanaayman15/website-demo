import { Link, useLocation } from 'react-router-dom';
import {
  CLIENT_RECIPES,
  normalizeRecipeTypeLabel,
  useClientRecipes,
} from '../hooks/useClientRecipes';

const FILTERS = [
  { key: 'all', label: 'All Recipes' },
  { key: 'breakfast', label: 'Sunrise Breakfast' },
  { key: 'lunch', label: 'Power Lunch' },
  { key: 'dinner', label: 'Recovery Dinner' },
  { key: 'snack', label: 'Quick Snack' },
  { key: 'pre-workout', label: 'Pre-Workout' },
  { key: 'post-workout', label: 'Post-Workout' },
];

const TYPE_BADGE_STYLES = {
  breakfast: { background: '#fff3cd', color: '#856404' },
  lunch: { background: '#d1ecf1', color: '#0c5460' },
  dinner: { background: '#f8d7da', color: '#721c24' },
  snack: { background: '#e2e3e5', color: '#383d41' },
  'pre-workout': { background: '#fde2e4', color: '#9f1239' },
  'post-workout': { background: '#ffedd5', color: '#9a3412' },
};

function getTypeBadgeStyle(type) {
  return TYPE_BADGE_STYLES[type] || { background: '#e5e7eb', color: '#374151' };
}

function resolveRecipeFromQueryValue(rawRecipeValue) {
  const recipeValue = String(rawRecipeValue || '').trim().toLowerCase();
  if (!recipeValue) return null;

  const aliasMap = {
    steak: 11,
    salmon: 4,
    smoothie: 5,
  };

  if (aliasMap[recipeValue]) {
    return CLIENT_RECIPES.find((recipe) => recipe.id === aliasMap[recipeValue]) || null;
  }

  const asNumericId = Number(recipeValue);
  if (Number.isFinite(asNumericId) && asNumericId > 0) {
    return CLIENT_RECIPES.find((recipe) => recipe.id === asNumericId) || null;
  }

  return CLIENT_RECIPES.find((recipe) => (
    recipe.name.toLowerCase().replace(/\s+/g, '-') === recipeValue
  )) || null;
}

function ClientRecipes() {
  const location = useLocation();
  const {
    state,
    visibleRecipes,
    activeRecipe,
    setFilter,
    setSearch,
    openRecipe,
    closeRecipe,
  } = useClientRecipes();

  const activeFilterLabel = FILTERS.find((filter) => filter.key === state.activeFilter)?.label || 'All Recipes';
  const queryParams = new URLSearchParams(location.search);
  const detailsOnlyRecipe = resolveRecipeFromQueryValue(queryParams.get('recipe'));

  if (detailsOnlyRecipe) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <Link to="/client-home" className="text-blue-600 font-semibold hover:underline">← Back to Home</Link>
              <Link to="/client-recipes" className="text-blue-600 font-semibold hover:underline">View All Recipes</Link>
            </div>

            <div className="text-6xl mb-4" aria-hidden="true">{detailsOnlyRecipe.image}</div>
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
              style={getTypeBadgeStyle(detailsOnlyRecipe.type)}
            >
              {normalizeRecipeTypeLabel(detailsOnlyRecipe.type)}
            </span>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{detailsOnlyRecipe.name}</h1>
            <p className="text-gray-600 mb-5">{detailsOnlyRecipe.description}</p>
            <p className="text-gray-500 font-semibold mb-6">Serving Size: {detailsOnlyRecipe.servingGrams}g</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Protein</div>
                <div className="text-2xl font-bold text-red-600">{detailsOnlyRecipe.nutrition.protein}g</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Carbs</div>
                <div className="text-2xl font-bold text-yellow-600">{detailsOnlyRecipe.nutrition.carbs}g</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Fats</div>
                <div className="text-2xl font-bold text-blue-600">{detailsOnlyRecipe.nutrition.fats}g</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Calories</div>
                <div className="text-2xl font-bold text-purple-600">{detailsOnlyRecipe.nutrition.calories}</div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Ingredients</h2>
              <ul className="space-y-2">
                {detailsOnlyRecipe.ingredients.map((ingredient) => (
                  <li key={ingredient} className="text-gray-700">✓ {ingredient}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Instructions</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{detailsOnlyRecipe.instructions}</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header
        className="text-white"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '56px 20px',
        }}
      >
        <div className="mx-auto w-full max-w-6xl text-center relative">
          <Link
            to="/client-home"
            className="absolute left-0 top-0 text-white hover:text-gray-200 text-2xl"
            aria-label="Back to Home"
          >
            ←
          </Link>
          <h1 className="text-4xl font-extrabold mb-2">All Recipes</h1>
          <p className="text-white/90">Explore our collection of healthy, nutritious recipes</p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <input
            type="text"
            value={state.search}
            placeholder="Search recipes by name or ingredient..."
            className="w-full px-6 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 shadow-sm"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="mb-8">
          <p className="text-gray-700 font-semibold mb-3">Filter by Meal Type:</p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active = state.activeFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  className="px-4 py-2 rounded-full border-2 transition-all"
                  style={active
                    ? { background: '#667eea', color: '#fff', borderColor: '#667eea' }
                    : { background: '#f0f4ff', color: '#667eea', borderColor: 'transparent' }}
                  onClick={() => setFilter(filter.key)}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {!visibleRecipes.length ? (
          <div className="bg-white rounded-lg shadow-md px-6 py-8 text-center text-gray-600">
            No recipes match the current filter: {activeFilterLabel}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleRecipes.map((recipe) => {
            const badgeStyle = getTypeBadgeStyle(recipe.type);
            return (
              <article
                key={recipe.id}
                className="bg-white rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                onClick={() => openRecipe(recipe.id)}
              >
                <div className="p-6">
                  <div className="text-5xl mb-3" aria-hidden="true">{recipe.image}</div>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
                    style={badgeStyle}
                  >
                    {normalizeRecipeTypeLabel(recipe.type)}
                  </span>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{recipe.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{recipe.description}</p>

                  <div className="text-xs flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-bold">P: {recipe.nutrition.protein}g</span>
                    <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 font-bold">C: {recipe.nutrition.carbs}g</span>
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-bold">F: {recipe.nutrition.fats}g</span>
                  </div>

                  <div className="mt-2 text-gray-700 font-semibold text-sm">
                    {recipe.nutrition.calories} cal • {recipe.servingGrams}g serving
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {activeRecipe ? (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeRecipe}
          role="presentation"
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${activeRecipe.name} details`}
          >
            <div className="p-6">
              <button
                type="button"
                className="float-right text-gray-500 hover:text-gray-700 text-2xl"
                onClick={closeRecipe}
                aria-label="Close recipe details"
              >
                ×
              </button>

              <div className="clear-both">
                <div className="text-6xl mb-4" aria-hidden="true">{activeRecipe.image}</div>
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
                  style={getTypeBadgeStyle(activeRecipe.type)}
                >
                  {normalizeRecipeTypeLabel(activeRecipe.type)}
                </span>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">{activeRecipe.name}</h2>
                <p className="text-gray-600 mb-6">{activeRecipe.description}</p>
                <p className="text-gray-500 font-semibold mb-6">Serving Size: {activeRecipe.servingGrams}g</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Protein</div>
                    <div className="text-2xl font-bold text-red-600">{activeRecipe.nutrition.protein}g</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Carbs</div>
                    <div className="text-2xl font-bold text-yellow-600">{activeRecipe.nutrition.carbs}g</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Fats</div>
                    <div className="text-2xl font-bold text-blue-600">{activeRecipe.nutrition.fats}g</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Calories</div>
                    <div className="text-2xl font-bold text-purple-600">{activeRecipe.nutrition.calories}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Ingredients</h3>
                  <ul className="space-y-2">
                    {activeRecipe.ingredients.map((ingredient) => (
                      <li key={ingredient} className="text-gray-700">✓ {ingredient}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Instructions</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{activeRecipe.instructions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default ClientRecipes;
