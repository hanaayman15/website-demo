import { Link, useNavigate } from 'react-router-dom';
import '../assets/styles/react-pages.css';

function AntiDoping() {
  const navigate = useNavigate();
  const lockedCards = [
    {
      title: 'Product Verification',
      text: 'Use only third-party tested products and keep lot numbers and labels in your records.',
    },
    {
      title: 'Ingredient Audit',
      text: 'Scan for stimulants, prohormones, and ambiguous proprietary blends before purchase.',
    },
    {
      title: 'Competition Week Lock',
      text: 'Freeze new products 14 days before events unless coach-approved with full documentation.',
    },
  ];

  const goToUpgrade = () => {
    navigate('/subscription-plan?upgrade=anti-doping');
  };

  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth: 1050, gap: '1rem' }}>
      <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>Anti-Doping Safety Hub</h1>
          <p className="react-muted" style={{ margin: 0 }}>
            Protect your career with safer supplement use, batch checks, and clean competition protocols.
          </p>
        </div>
        <div className="react-inline-actions">
          <Link className="react-btn react-btn-ghost" to="/client-dashboard">Nutrition</Link>
          <Link className="react-btn react-btn-ghost" to="/mental-coaching">Mental Coaching</Link>
        </div>
      </section>

      <section className="react-panel" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #ecfeff, #eff6ff)' }}>
        <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
          "Discipline is the strongest protection: what you choose off the field protects who you are on the field."
        </p>
      </section>

      <section className="react-panel react-grid" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 2 }}>
          <div className="react-panel react-grid" style={{ maxWidth: 460, borderColor: '#86efac' }}>
            <h2 style={{ margin: 0 }}>Premium Feature</h2>
            <p className="react-muted" style={{ margin: 0 }}>
              Anti-doping guidance requires an additional payment to unlock full recommendations.
            </p>
            <button className="react-btn" type="button" onClick={goToUpgrade}>Upgrade Now</button>
          </div>
        </div>

        <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>
          <div className="react-grid react-grid-2">
            {lockedCards.map((card) => (
              <article key={card.title} className="stat-item react-grid" style={{ gap: '0.35rem' }}>
                <h3 style={{ margin: 0 }}>{card.title}</h3>
                <p className="react-muted" style={{ margin: 0 }}>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AntiDoping;
