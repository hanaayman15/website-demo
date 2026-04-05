import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { resolveAuthRole, resolveAuthToken } from '../utils/authSession';
import { getStorage, safeRemove } from '../utils/storageSafe';
import '../assets/styles/index-landing.css';

function Index() {
  const navigate = useNavigate();
  const [canRenderHome, setCanRenderHome] = useState(false);
  const [role, setRole] = useState('');
  const [cardsPerView, setCardsPerView] = useState(4);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const local = getStorage('local');
    safeRemove(local, 'authToken');
    safeRemove(local, 'token');
    safeRemove(local, 'access_token');
    safeRemove(local, 'authRole');
    safeRemove(local, 'authTokenType');

    const token = resolveAuthToken();
    const resolvedRole = String(resolveAuthRole() || '').toLowerCase();

    if (!token || !resolvedRole) {
      navigate('/doctor-auth?next=/', { replace: true });
      return;
    }

    setRole(resolvedRole);
    setCanRenderHome(true);
  }, [navigate]);

  // Load Helios jQuery scripts after mount (they need DOM ready)
  useEffect(() => {
    if (!canRenderHome) return undefined;
    sessionStorage.removeItem('portalType');

    const scripts = [
      '/assets/js/jquery.min.js',
      '/assets/js/jquery.dropotron.min.js',
      '/assets/js/jquery.scrolly.min.js',
      '/assets/js/jquery.scrollex.min.js',
      '/assets/js/browser.min.js',
      '/assets/js/breakpoints.min.js',
      '/assets/js/util.js',
      '/assets/js/main.js',
    ];

    let promise = Promise.resolve();
    const loaded = [];
    scripts.forEach((src) => {
      promise = promise.then(() => new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = resolve;
        document.body.appendChild(s);
        loaded.push(s);
      }));
    });

    return () => { loaded.forEach((s) => s.remove()); };
  }, [canRenderHome]);

  const isDoctor = role === 'doctor';

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/features', label: 'Features' },
    { href: '/resources', label: 'Our Clinic' },
    { href: '/success-stories', label: 'Success Stories' },
    { href: '/contact', label: 'Contact Us' },
  ];

  const adminCarousel = [
    { href: '/clients', img: '/images/pexels-yaroslav-shuraev-8844379.jpg', label: 'Clients', desc: 'view & manage clients.' },
    { href: '/add-client', img: '/images/pexels-beyzahzah-89810429-15319038.jpg', label: 'Add client', desc: 'create new client.' },
    { href: '/add-team', img: '/images/football-team.jpg', label: 'Team Management', desc: 'Dynamic roster builder with full player profiles and auto calculations.' },
    { href: '/pdf-generator', img: '/images/pexels-olly-3760067.jpg', label: 'PDF Generator', desc: 'Multi-client PDF generation' },
    { href: '/diet-management', img: '/images/pexels-janetrangdoan-1099680.jpg', label: 'Diet management', desc: 'Edit default meal plans' },
  ];

  const doctorCarousel = [
    { href: '/clients', img: '/images/pexels-yaroslav-shuraev-8844379.jpg', label: 'Teams', desc: 'View and manage your teams only.' },
    { href: '/add-team', img: '/images/football-team.jpg', label: 'Add Team', desc: 'Create teams, add players, and update rosters.' },
    { href: '/pdf-generator', img: '/images/pexels-olly-3760067.jpg', label: 'PDF Generator', desc: 'Generate team and player report PDFs.' },
  ];

  const carousel = isDoctor ? doctorCarousel : adminCarousel;

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth <= 736) {
        setCardsPerView(1);
      } else if (window.innerWidth <= 1100) {
        setCardsPerView(2);
      } else {
        setCardsPerView(isDoctor ? 3 : 4);
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, [isDoctor]);

  const maxIndex = useMemo(() => Math.max(0, carousel.length - cardsPerView), [carousel.length, cardsPerView]);

  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (maxIndex <= 0) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 2200);

    return () => window.clearInterval(timer);
  }, [maxIndex]);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  if (!canRenderHome) {
    return null;
  }

  return (
    <div id="page-wrapper">

      {/* Header */}
      <div id="header" className="home-hero">
        <div className="inner home-hero-content">
          <div className="home-hero-center">
            <h2 className="home-hero-title">Client Nutrition Management</h2>
            <a href="#quick-actions" className="button circled scrolly" id="start-button">Start</a>
          </div>
        </div>

        {/* Nav */}
        <nav id="nav">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Banner */}
      <section id="banner" className="home-quick-actions-header">
        <a id="quick-actions" aria-hidden="true"></a>
        <header>
          <h2>Quick Actions.</h2>
          <p>{isDoctor ? 'Manage your teams and players.' : 'Manage your client and track their progress'}</p>
        </header>
      </section>

      {/* Quick Action Grid */}
      <section className="home-card-section">
        <div className="home-carousel-wrap container">
          <button type="button" className="home-carousel-arrow home-carousel-arrow-left" onClick={prevSlide} aria-label="Previous cards">‹</button>
          <div className="home-carousel-viewport">
            <div
              className="home-card-track"
              style={{
                width: `${(carousel.length * 100) / cardsPerView}%`,
                transform: `translateX(-${(activeIndex * 100) / carousel.length}%)`,
              }}
            >
              {carousel.map((item) => (
                <article key={item.href} className="home-action-card">
                  <Link to={item.href} className="image featured">
                    <img src={item.img} alt={item.label} />
                  </Link>
                  <header>
                    <h3><Link to={item.href}>{item.label}</Link></h3>
                  </header>
                  <p>{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
          <button type="button" className="home-carousel-arrow home-carousel-arrow-right" onClick={nextSlide} aria-label="Next cards">›</button>
        </div>
      </section>

      {/* Main article */}
      <div className="wrapper style2">
        <article id="main" className="container special">
          <a href="#" className="image featured">
            <img src="/images/Gemini_Generated_Image_5sg9au5sg9au5sg9.png" alt="" />
          </a>
          <header className="home-benefits-header">
            <h2>🌿 Benefits of Client Nutrition Management and Personalized Nutrition for a Healthier You</h2>
            <p>
              "this website is not just a nutrition platform. It is a complete digital ecosystem that enhances patient care,
              improves outcomes, and makes nutrition management more accessible, personalized, and effective."
            </p>
          </header>
          <p>
            Client Nutrition Management website is a comprehensive digital platform designed to improve the quality of nutritional
            care and enhance the overall patient experience. It allows for efficient organization through centralized digital
            records, meal plans, and appointment scheduling, reducing paperwork and saving valuable time. The system provides
            fully personalized nutrition plans tailored to each client's age, lifestyle, health condition, and goals, ensuring
            more effective and sustainable results. Through continuous progress monitoring, including weight tracking, calorie
            intake, and health indicators, decisions are based on accurate data to achieve better long-term outcomes.
          </p>
        </article>
      </div>

      {/* Features */}
      <div className="wrapper style1">
        <section id="features" className="container special">
          <header className="featuress-title">
            <h2>Personalized Nutrition for a Healthier You</h2>
            <p>Expert-led dietary strategies designed to fuel your body, manage chronic conditions, and help you reach your peak performance.</p>
          </header>
          <div className="row">
            <article className="col-4 col-12-mobile special">
              <a href="#" className="image featured"><img src="/images/pexels-pixabay-53404.jpg" alt="" /></a>
              <header><h3 className="home-feature-title"><a href="#">Weight Management</a></h3></header>
              <p>Achieve Lasting Results. Our science-backed meal plans are tailored to your unique metabolism and lifestyle goals, ensuring you lose weight while feeling energized and satisfied.</p>
            </article>
            <article className="col-4 col-12-mobile special">
              <a href="#" className="image featured"><img src="/images/pexels-pavel-danilyuk-7653093.jpg" alt="" /></a>
              <header><h3 className="home-feature-title"><a href="#">Clinical Nutrition</a></h3></header>
              <p>Manage Your Health with Food. Specialized dietary support for chronic conditions like diabetes, heart health, and digestive wellness using evidence-based medical nutrition therapy.</p>
            </article>
            <article className="col-4 col-12-mobile special">
              <a href="#" className="image featured"><img src="/images/pexels-olly-3755440.jpg" alt="" /></a>
              <header><h3 className="home-feature-title"><a href="#">Performance Fueling</a></h3></header>
              <p>Optimize Your Athletic Potential. Fuel like a pro with targeted nutrition designed for athletes, optimizing energy levels, nutrient timing, and recovery protocols.</p>
            </article>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div id="footer">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <section className="contact">
                <p>
                  Have questions about our meal plans or clinical consultations?<br />
                  <strong>Call or Text us: +20 155 018 8581</strong>
                </p>
                <ul className="icons">
                  <li><a href="https://wa.me/201550188581" className="icon brands fa-whatsapp"><span className="label">WhatsApp</span></a></li>
                  <li><a href="#" className="icon brands fa-facebook-f"><span className="label">Facebook</span></a></li>
                  <li><a href="https://www.instagram.com/dr.mohamed.alaa/" className="icon brands fa-instagram"><span className="label">Instagram</span></a></li>
                  <li><a href="mailto:MohamedAlaa2864@gmail.com" className="icon solid fa-envelope"><span className="label">Email</span></a></li>
                </ul>
               
              </section>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Index;
