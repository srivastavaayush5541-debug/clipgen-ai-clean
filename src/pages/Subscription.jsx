import { useState, useEffect, useRef } from 'react';

const Subscription = ({ upgradePlan, plan }) => {
  console.log("Subscription render - plan:", plan);

  if (!plan || !plan.plan) {
    return <div style={{padding: "40px", textAlign: "center"}}>
      <div style={{animation: 'spin 1s linear infinite', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', height: '48px', width: '48px', margin: '0 auto 16px'}}></div>
      <h2>Loading subscription plans...</h2>
      <p>Current plan: {plan?.plan || 'unknown'}</p>
    </div>;
  }

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, []);

  const plans = [
    {
      name: 'Free',
      price: '₹0 /month',
      limit: '1 video/day',
      duration: '15s max',
      watermark: 'Yes',
      ads: 'Yes',
      popular: false
    },
    {
      name: 'Premium',
      price: '₹199 /month',
      limit: '3 videos/day',
      duration: '30s max',
      watermark: 'No',
      ads: 'No',
      popular: false
    },
    {
      name: 'Pro',
      price: '₹249 /month',
      limit: '5 videos/day',
      duration: '30s max',
      watermark: 'No',
      ads: 'No',
      popular: true
    }
  ];

  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  const planPrices = {
    premium: 199,
    pro: 249
  };

  const startLoading = () => {
    loadingRef.current = true;
    setIsLoading(true);
  };

  const stopLoading = () => {
    loadingRef.current = false;
    setIsLoading(false);
  };

  const handleUpgrade = async (planName) => {
    // Block free plan
    if (planName === 'free') {
      const confirmSwitch = confirm("Switch to Free Plan? No payment required.");
      if (confirmSwitch) {
        upgradePlan('free');  // Alert moved to upgradePlan in App.jsx
      }
      return;
    }

    setIsLoading(true);
    console.time('Order API');
    try {
      console.log('🚀 Creating order for:', planName);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch('https://clipgen-ai.onrender.com/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          amount: planPrices[planName]  // Send RUPEES only, backend converts to paise
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.timeEnd('Order API');
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Order Error: ${data.message || data.error || 'Unknown error'}`);
        return;
      }

      const options = {
        key: 'rzp_live_SXKo6q37b3PA06',
        amount: Number(data.amount),
        currency: data.currency || 'INR',
        name: 'ClipGen AI',
        description: `${planName.toUpperCase()} Plan`,
        order_id: data.id,
        handler: (response) => {
          console.log('✅ Success:', response);
          setIsLoading(false);
          upgradePlan(planName);
        },
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled');
            setIsLoading(false);
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com'
        },
        theme: { color: '#6c5ce7' }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', (response) => {
        const err = response.error;
        console.error('❌ Failed:', err);
        alert(`Payment Failed\nCode: ${err.code}\n${err.description}`);
      });
      
      rzp.open();
    } catch (err) {
      console.timeEnd('Order API');
      console.error('Error:', err);
      setIsLoading(false);
      if (err.name === 'AbortError') {
        alert('Request timeout. Server waking up... try again.');
      } else {
        alert('Setup failed: ' + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-to-b from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your video creation journey
          </p>
          {plan.remaining === 0 && (
            <div className="mt-8 p-4 bg-orange-100 border border-orange-300 rounded-2xl max-w-md mx-auto">
              <p className="text-orange-800 font-semibold">Daily limit reached</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((p, index) => (
            <div key={index} className={`bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 group hover:-translate-y-2 ${p.popular ? 'border-blue-500 ring-4 ring-blue-100 scale-[1.02]' : 'border-gray-200'} ${plan.plan === p.name.toLowerCase() ? 'ring-4 ring-green-200 border-green-400' : ''}`}>
              {p.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ MOST POPULAR
                </div>
              )}
              
              {plan.plan === p.name.toLowerCase() && (
                <div className="mb-6 p-3 bg-emerald-100 border-2 border-emerald-300 rounded-2xl">
                  <span className="font-bold text-emerald-800 text-sm">✅ CURRENT PLAN</span>
                  <div className="text-xs text-emerald-700 mt-1">
                    {plan.remaining > 0 ? `${plan.remaining} videos left` : 'Daily limit reached'}
                  </div>
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-4">{p.name}</h3>
              <div className="text-4xl font-black text-gray-900 mb-2">{p.price}</div>
              
              <div className="space-y-3 mb-8 text-left p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-semibold">{p.limit}</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-semibold">{p.duration}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900 mb-1">Watermark</div>
                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${p.watermark === 'No' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.watermark}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900 mb-1">Ads</div>
                    <div className={`text-xs px-3 py-1 rounded-full font-medium ${p.ads === 'No' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.ads}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 transform ${plan.plan === p.name.toLowerCase() || isLoading ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white hover:shadow-2xl hover:scale-105'}`} 
                onClick={() => handleUpgrade(p.name.toLowerCase())}
                disabled={plan.plan === p.name.toLowerCase() || isLoading}
              >
                {isLoading ? '⏳ Processing...' : plan.plan === p.name.toLowerCase() ? '✅ Current Plan' : `Upgrade to ${p.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-20 p-8 bg-white/50 backdrop-blur-sm rounded-3xl shadow-xl max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Current Status</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{plan.remaining}</div>
              <div className="text-sm text-gray-600 mt-1">Videos left today</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 capitalize">{plan.plan}</div>
              <div className="text-sm text-gray-600 mt-1">Your plan</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{plan.planInfo?.duration || 15}s</div>
              <div className="text-sm text-gray-600 mt-1">Max duration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;

