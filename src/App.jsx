import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import Subscription from './pages/Subscription';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import { auth } from './firebase';
import './App.css';

function Header({ currentPage, onPageChange }) {
  return (
    <header className="header">
      <div className="logo">
        <h1>ClipGen AI</h1>
      </div>
      <nav className="nav">
        <button 
          className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => onPageChange('home')}
        >
          Home
        </button>
        <button 
          className={`nav-btn ${currentPage === 'pricing' ? 'active' : ''}`}
          onClick={() => onPageChange('pricing')}
        >
          Pricing
        </button>
      </nav>
    </header>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Generating your video...</p>
    </div>
  );
}

function PricingPage() {
  const plans = [
    { name: 'Free', price: 'Free', features: ['2 videos/day', 'With ads'], period: '' },
    { name: 'Monthly', price: '₹99', features: ['10 videos/month', 'No ads'], period: '/month' },
    { name: '3 Months', price: '₹249', features: ['Unlimited videos', 'No ads'], period: '/3 months' },
    { name: '6 Months', price: '₹499', features: ['Unlimited videos', 'Priority'], period: '/6 months' },
    { name: '9 Months', price: '₹749', features: ['Unlimited videos', 'Priority + HD'], period: '/9 months' },
    { name: 'Yearly', price: '₹999', features: ['Everything', 'Best value'], period: '/year' }
  ];

  return (
    <main className="pricing-page">
      <section className="hero-section">
        <h2>Choose Your Plan</h2>
        <p>Unlock unlimited AI video generation</p>
      </section>
      <div className="plans-grid">
        {plans.map((plan, index) => (
          <div key={index} className="plan-card">
            <h3>{plan.name}</h3>
            <div className="price">{plan.price}<span>{plan.period}</span></div>
            <ul>
              {plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            <button className="cta-btn">Get Started</button>
          </div>
        ))}
      </div>
    </main>
  );
}

function HomePage({ topic, onTopicChange, isLoading, onGenerate, generatedScript, audioUrl }) {
  const handleGenerate = () => {
    onGenerate();
  };

  return (
    <main className="home-page">
      <section className="hero-section">
        <h2>Create AI Videos Instantly</h2>
        <p>Enter a topic and let AI generate script & voiceover</p>
      </section>
      
      <div className="input-section">
        <input
          type="text"
          placeholder="Enter video topic e.g. 'How to make coffee'"
          value={topic}
          onChange={onTopicChange}
          disabled={isLoading}
          className="topic-input"
        />
        <button onClick={handleGenerate} disabled={isLoading} className="generate-btn">
          {isLoading ? 'Generating...' : 'Generate Video'}
        </button>
      </div>

      {isLoading && <LoadingSpinner />}

      {generatedScript && (
        <section className="results-section">
          <h3>Generated Script</h3>
          <pre className="script">{generatedScript}</pre>
          {audioUrl && (
            <div className="audio-player">
              <h4>Voiceover Audio</h4>
              <audio controls src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const handleGenerate = () => {
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setGeneratedScript('');
    setAudioUrl('');

    // Simulate AI generation
    setTimeout(() => {
      const fakeScript = `Welcome to your video on "${topic}"!

This is an AI-generated script with engaging content.
It includes an introduction, main points, and conclusion.

Key highlights:
- Point 1: Detailed explanation
- Point 2: Practical tips
- Point 3: Call to action

Perfect for engaging short-form video content!`;
      
      setGeneratedScript(fakeScript);
      setAudioUrl('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBh+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBh+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBh+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMc');
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="app">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {currentPage === 'home' ? (
        <HomePage 
          topic={topic}
          onTopicChange={(e) => setTopic(e.target.value)}
          isLoading={isLoading}
          onGenerate={handleGenerate}
          generatedScript={generatedScript}
          audioUrl={audioUrl}
        />
      ) : (
        <PricingPage />
      )}
    </div>
  );
}

export default App;

