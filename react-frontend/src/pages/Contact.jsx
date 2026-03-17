import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import '../assets/styles/react-pages.css';

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const links = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/features', label: 'Features' },
  ];

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('Please complete all fields before sending.');
      return;
    }
    setStatus('Message captured successfully. Our team will contact you soon.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <main className="react-page-wrap react-grid" style={{ gap: '1rem', maxWidth: 900 }}>
      <Navbar links={links} />
      <Card title="Contact Us">
        <p className="react-muted" style={{ marginTop: 0 }}>
          Reach out for onboarding, support, or partnership inquiries.
        </p>
        <form className="react-grid" onSubmit={submit}>
          <label>
            <span className="react-label">Name</span>
            <input className="react-input" value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </label>
          <label>
            <span className="react-label">Email</span>
            <input className="react-input" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          </label>
          <label>
            <span className="react-label">Message</span>
            <textarea className="react-textarea" rows={5} value={form.message} onChange={(event) => updateField('message', event.target.value)} />
          </label>
          {status ? <div className="react-muted">{status}</div> : null}
          <Button className="react-btn" type="submit">Send Message</Button>
        </form>
      </Card>
    </main>
  );
}

export default Contact;
