import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorks from "./components/HowItWorks";
import Subscription from "./pages/Subscription";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Contact from "./pages/Contact";
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logout } from './firebase';
import ErrorBoundary from "./components/ErrorBoundary";
import './App.css';

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const defaultPlan = {
    plan: 'free',
    remaining: 1,
    planInfo: { duration: 15, watermark: true, ads: true }
  };
  const [plan, setPlan] = useState(defaultPlan);

  const [script, setScript] = useState('');
  const [voice, setVoice] = useState('male');
  const [style, setStyle] = useState('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const userId = 'demo-user';

  // Load saved plan with validation
  useEffect(() => {
    try {
      const saved = localStorage.getItem('userPlan');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.plan) {
          setPlan(parsed);
        } else {
          throw new Error("Invalid format");
        }
      }
    } catch (error) {
      console.error("Invalid saved plan, using default");
      setPlan({
        plan: 'free',
        remaining: 1,
        planInfo: { duration: 15, watermark: true, ads: true }
      });
      localStorage.removeItem('userPlan'); // cleanup bad data
    }
  }, []);
  
  const fetchPlan = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/plan?userId=${userId}`);
      const data = await res.json();
      setPlan(data);
    } catch (err) {
      console.log('Server unavailable, keeping local plan');
    }
  };

  const upgradePlan = async (newPlan) => {
    try {
      // Optimistic UI update
      const planConfig = {
        free: { plan: 'free', remaining: 1, planInfo: {duration: 15, watermark: true, ads: true} },
        premium: { plan: 'premium', remaining: 3, planInfo: {duration: 30, watermark: false, ads: false} },
        pro: { plan: 'pro', remaining: 5, planInfo: {duration: 30, watermark: false, ads: false} }
      };
      
      setPlan(planConfig[newPlan] || planConfig.free);
      
      // Persist full plan as JSON
      const fullPlan = planConfig[newPlan] || planConfig.free;
      localStorage.setItem('userPlan', JSON.stringify(fullPlan));
      
      // Backend sync (optional)
      try {
        await fetch('http://127.0.0.1:5000/update-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, plan: newPlan })
        });
      } catch (e) {
        console.log('Backend sync failed, local plan saved');
      }
      
      alert(`Upgraded to ${newPlan.toUpperCase()}! 🎉`);
    } catch (err) {
      console.error('Upgrade error:', err);
      alert('Upgrade saved locally! Backend sync failed.');
    }
  };

  const isFreeUser = plan.plan === 'free';
  const canGenerate = plan.remaining > 0;

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    document.body.classList.remove("overflow-hidden");
    document.documentElement.classList.remove("overflow-hidden");
  }, [page]);

useEffect(() => {
    // Pre-warm backend
    fetch('https://clipgen-ai.onrender.com/test').catch(console.log);
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.emailVerified) {
        localStorage.setItem("user", JSON.stringify(currentUser));
        // Welcome popup only once
        if (!localStorage.getItem('welcomeShown')) {
          alert('Welcome to ClipGen AI 🎬');
          localStorage.setItem('welcomeShown', 'true');
        }
      } else if (currentUser && !currentUser.emailVerified) {
        alert('Please verify your email before continuing.');
      } else {
        localStorage.removeItem("user");
      }
    });

    // Check localStorage on initial load
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.emailVerified) {
          setUser(parsedUser);
        }
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
    return unsubscribe;
  }, []);

const generateVideo = async (scriptInput, voiceInput, styleInput) => {
    console.log('🔥 Generate clicked!', { scriptInput, voiceInput, styleInput });
    
    const userId = 'demo-user';
    const API_BASE = 'https://clipgen-ai.onrender.com'; // Your Render backend
    
    setIsGenerating(true);

    try {

      const response = await fetch(`${API_BASE}/api/video/generate-video`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          script: scriptInput || 'Demo video',
          style: styleInput || 'realistic',
          voiceGender: voiceInput || 'male',
          plan: plan.plan 
        })
      });


      const data = await response.json();
      console.log('✅ API Response:', data);

      if (!response.ok) {
        console.error('❌ API Error:', data);
        alert(data.error || 'Generation failed. Try again.');
        return;
      }

      // ✅ Success - store & show video
      setVideoUrl(data.videoUrl);
      localStorage.setItem('generatedVideo', JSON.stringify(data));

      // Update remaining quota
      setPlan(prev => ({ ...prev, remaining: Math.max(0, prev.remaining - 1) }));

    } catch (error) {
      console.error("💥 Network Error:", error);
      alert('Failed to connect to backend. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };




  const handlePayment = () => {
    const options = {
      key: "rzp_test_yourkey",
      amount: 9900,
      currency: "INR",
      name: "ClipGen AI",
      description: "Premium Subscription",
      handler: function (response) {
        console.log("Payment Success:", response);
        localStorage.setItem("premium", "true");
        alert("Payment successful 🎉 Premium activated");
        window.location.reload();
      },
      prefill: {
        name: "User",
        email: "user@email.com",
      },
      theme: {
        color: "#6366f1",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const pricingPlans = [
    { name: 'Free', price: '₹0', features: ['2 videos/day', 'With ads'], popular: false },
    { name: 'Monthly', price: '₹99', features: ['Unlimited videos', 'No ads'], popular: true },
    { name: '3 Months', price: '₹249', features: ['Unlimited videos', 'No ads'], popular: false },
    { name: '6 Months', price: '₹499', features: ['Unlimited videos', 'Priority support'], popular: false },
    { name: '9 Months', price: '₹749', features: ['Unlimited videos', 'Priority + HD export'], popular: false },
    { name: 'Yearly', price: '₹999', features: ['Everything', 'Best value'], popular: false }
  ];

  return (


    <ErrorBoundary>

      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 relative">
        {/* GLOBAL NAVBAR */}

      <Navbar page={page} setPage={setPage} user={user} />
      
      {/* HOME PAGE */}
{page === "home" && (
        <>
          <Hero 
            isFreeUser={isFreeUser} 
            canGenerate={canGenerate}
            remaining={plan.remaining}
            onGenerate={generateVideo}
            script={script}
            setScript={setScript}
            voice={voice}
            setVoice={setVoice}
            style={style}
            setStyle={setStyle}
            isGenerating={isGenerating}
            setPage={setPage}
            plan={plan}
          />
{videoUrl && (
            <div className="max-w-6xl mx-auto px-6 py-12">
              <h2 className="text-3xl font-bold text-center mb-12">✅ Video Generated Successfully!</h2>
              
              {/* Scenes Grid */}
              <div className="grid md:grid-cols-3 gap-4 mb-12">
                {(() => {
                  try {
                    const videoDataStr = localStorage.getItem('generatedVideo') || '{}';
                    const videoData = JSON.parse(videoDataStr);
                    return Array.isArray(videoData.scenes) ? videoData.scenes.map((scene, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl shadow-lg text-center">
                        <img src={scene.image} alt={`Scene ${i+1}`} className="w-full h-48 object-cover rounded-xl mb-4" />
                        <p className="text-sm line-clamp-3">{scene.text}</p>
                      </div>
                    )) : [];
                  } catch (e) {
                    return [];
                  }
                })()}
              </div>
              
              {/* Video & Audio */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">📹 Generated Video</h3>
                  <video controls className="w-full rounded-2xl shadow-2xl" style={{height: '300px'}}>
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">🔊 Voiceover Audio</h3>
                  <audio controls className="w-full">
<source src={videoData.audio} type="audio/mp3" />
                  </audio>
                  <p className="text-sm text-gray-500 mt-2">{JSON.parse(localStorage.getItem('generatedVideo') || '{}').duration}s duration</p>
                </div>
              </div>
              
              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={videoUrl} download className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-semibold text-center shadow-xl transition-all">
                  ⬇️ Download Video
                </a>
                {JSON.parse(localStorage.getItem('generatedVideo') || '{}').audio && (
                  <a href={JSON.parse(localStorage.getItem('generatedVideo') || '{}').audio} download className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold text-center shadow-xl transition-all">
                    ⬇️ Download Audio
                  </a>
                )}
              </div>
              
              {plan.plan === 'free' && (
                <div className="mt-8 p-4 bg-yellow-100 border-2 border-yellow-300 rounded-2xl text-center">
                  💧 Free plan includes watermark. <button onClick={() => setPage('subscription')} className="font-bold underline">Upgrade</button> for clean videos!
                </div>
              )}
            </div>
          )}

        </>
      )}

      {page === "features" && <FeaturesSection />}
      {page === "how" && <HowItWorks />}
{page === "subscription" && <Subscription upgradePlan={upgradePlan} plan={plan} />}

      {/* AUTH PAGES */}
      {page === "login" && <Login setPage={setPage} />}
      {page === "signup" && <Signup setPage={setPage} />}
      {page === "forgot" && <ForgotPassword setPage={setPage} />}

      {/* PRIVACY PAGE */}
      {page === "privacy" && <PrivacyPolicy setPage={setPage} />}

      {/* TERMS PAGE */}
      {page === "terms" && <Terms setPage={setPage} />}
      {page === "contact" && <Contact setPage={setPage} />}

      {/* COMPACT PREMIUM FOOTER */}
      <footer className="border-t border-gray-800 bg-black text-white py-6 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-3">
          <h3 className="text-2xl font-bold tracking-wide text-white">
            ClipGen AI
          </h3>
          <p className="text-gray-400 text-sm">
            Create AI-powered short videos in seconds 🚀
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 text-xs text-gray-300">
            <button 
              onClick={() => setPage("privacy")} 
              className="hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-900"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setPage("terms")} 
              className="hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-900"
            >
            Terms & Conditions
            </button>
          </div>
          <p className="text-gray-500 text-xs">
            © 2025 ClipGen AI. All rights reserved.
          </p>
        </div>
      </footer>


    </div>
  </ErrorBoundary>
  );
}

export default App;


