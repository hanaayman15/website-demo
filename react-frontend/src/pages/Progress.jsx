import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ClientPortalNav from '../components/layout/ClientPortalNav';
import { useReports } from '../hooks/useReports';
import '../assets/styles/react-pages.css';

function toPoints(values = [], width = 320, height = 130, pad = 14) {
  const cleaned = values
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
  if (!cleaned.length) return '';

  const min = Math.min(...cleaned);
  const max = Math.max(...cleaned);
  const span = max - min || 1;
  const step = cleaned.length > 1 ? (width - pad * 2) / (cleaned.length - 1) : 0;

  return cleaned
    .map((value, index) => {
      const x = pad + step * index;
      const normalized = (value - min) / span;
      const y = height - pad - normalized * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

function Sparkline({ values, color = '#2563eb', label }) {
  const points = toPoints(values);
  const hasData = Boolean(points);
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">{label}</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        {hasData ? (
          <svg viewBox="0 0 320 130" width="100%" height="150" role="img" aria-label={label}>
            <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <p className="text-sm text-gray-500">No data yet</p>
        )}
      </div>
    </div>
  );
}

function SleepBars({ rows = [] }) {
  const values = rows.map((row) => Number(row?.sleep || 0)).filter((n) => Number.isFinite(n) && n > 0);
  const max = Math.max(...values, 8);
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">💤 Sleep Tracking</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        {values.length ? (
          <div className="space-y-2">
            {values.slice(-8).map((hours, idx) => (
              <div key={`sleep-${idx}`}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Entry {idx + 1}</span>
                  <span>{hours} h</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min((hours / max) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No sleep logs yet</p>
        )}
      </div>
    </div>
  );
}

function Progress() {
  const navigate = useNavigate();
  const {
    loading,
    submitting,
    error,
    message,
    summary,
    logWorkout,
    logMood,
    logSleep,
  } = useReports();
  const [localMessage, setLocalMessage] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientPortalNav activePath="/progress" isLoggedIn />
        <div className="py-8 text-center">Loading progress overview...</div>
      </div>
    );
  }

  const handleWorkoutLog = async () => {
    const name = window.prompt('Enter workout name:', 'Strength Session');
    if (!name) return;
    await logWorkout(name);
    setLocalMessage('Workout logged.');
  };

  const handleMoodLog = async () => {
    const mood = window.prompt('Mood level from 1 to 10:', '8');
    if (!mood) return;
    await logMood(mood);
    setLocalMessage('Mood logged.');
  };

  const handleSleepLog = async () => {
    const hours = window.prompt('Sleep hours:', '8');
    if (!hours) return;
    await logSleep(hours);
    setLocalMessage('Sleep logged.');
  };

  const latestWeight = summary.latestWeight ?? '--';
  const latestBodyFat = summary.bodyFat ?? '--';
  const avgMood = summary.avgMood ?? '--';
  const weightSeries = (summary.recentWeights || []).map((row) => row.weight).filter((n) => Number.isFinite(Number(n)));
  const bodyFatSeries = (summary.recentWeights || []).map((row) => row.bodyFat).filter((n) => Number.isFinite(Number(n)));
  const muscleSeries = (summary.recentWeights || [])
    .map((row) => {
      const w = Number(row?.weight);
      const bf = Number(row?.bodyFat);
      if (!Number.isFinite(w)) return null;
      if (!Number.isFinite(bf)) return w;
      return w * (1 - bf / 100);
    })
    .filter((n) => Number.isFinite(Number(n)));
  const moodSeries = (summary.recentMood || []).map((row) => row.mood).filter((n) => Number.isFinite(Number(n)));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="container mx-auto px-6 pt-6">
        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-2xl mb-1">😴</p>
            <p className="text-gray-700 font-medium">💤 Don&apos;t forget: Quality sleep is crucial for recovery! Aim for 7-9 hours tonight.</p>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
            onClick={handleSleepLog}
            disabled={submitting}
          >
            📝 Log Sleep
          </button>
        </div>
      </div>

      <ClientPortalNav activePath="/progress" isLoggedIn />

      <section className="py-8 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">📈</div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Track Your Growth</h1>
              <p className="text-gray-600 mt-2">Monitor your progress across key performance indicators</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/progress-tracking" className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
              📊 Update Measurements
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-6">
          {error ? <div className="react-alert react-alert-error">{error}</div> : null}
          {message ? <div className="react-alert react-alert-success">{message}</div> : null}
          {localMessage ? <div className="react-alert react-alert-success">{localMessage}</div> : null}

          <div className="grid md:grid-cols-4 gap-6">
            <article className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-3xl">⚖️</div>
              <h3 className="text-sm text-gray-500 mt-3">Current Weight</h3>
              <p className="text-3xl font-bold">{latestWeight} kg</p>
              <p className="text-xs text-gray-500 mt-2">No data yet</p>
            </article>

            <article className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-3xl">💪</div>
              <h3 className="text-sm text-gray-500 mt-3">Body Fat</h3>
              <p className="text-3xl font-bold">{latestBodyFat}%</p>
              <p className="text-xs text-gray-500 mt-2">Latest log</p>
            </article>

            <article className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-3xl">🏋️</div>
              <h3 className="text-sm text-gray-500 mt-3">Strength Score</h3>
              <p className="text-3xl font-bold">{summary.strengthScore}/100</p>
              <p className="text-xs text-gray-500 mt-2">Static placeholder</p>
            </article>

            <article className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-3xl">😊</div>
              <h3 className="text-sm text-gray-500 mt-3">Avg. Mood</h3>
              <p className="text-3xl font-bold">{avgMood}/10</p>
              <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
            </article>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <article className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><Sparkline label="⚖️ Weight Progress" values={weightSeries} color="#2563eb" /></article>
            <article className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><Sparkline label="💪 Body Fat %" values={bodyFatSeries} color="#f97316" /></article>
            <article className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><Sparkline label="💪 Muscle Progress Chart" values={muscleSeries} color="#7c3aed" /></article>
            <article className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><Sparkline label="😊 Mood Tracking" values={moodSeries} color="#16a34a" /></article>
            <article className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm md:col-span-2"><SleepBars rows={summary.recentMood || []} /></article>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-5">
            <article className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold">🏋️</h3>
              <h4 className="text-lg font-semibold mt-2">Log Workout</h4>
              <p className="text-sm text-gray-600 mt-1">Record your training session</p>
              <button type="button" className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700" onClick={handleWorkoutLog} disabled={submitting}>Log Workout</button>
            </article>

            <article className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold">😊</h3>
              <h4 className="text-lg font-semibold mt-2">Log Mood</h4>
              <p className="text-sm text-gray-600 mt-1">Track daily mood and wellbeing</p>
              <button type="button" className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700" onClick={handleMoodLog} disabled={submitting}>Log Mood</button>
            </article>

            <article className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold">💤</h3>
              <h4 className="text-lg font-semibold mt-2">Log Sleep</h4>
              <p className="text-sm text-gray-600 mt-1">Record sleep duration/quality and settings</p>
              <button type="button" className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700" onClick={handleSleepLog} disabled={submitting}>Log Sleep</button>
            </article>
          </div>

          <div className="mt-6">
            <button type="button" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100" onClick={() => navigate(-1)}>← Back</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Progress;
