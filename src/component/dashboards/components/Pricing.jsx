import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../../config";

export default function Pricing() {
  const [activeTab, setActiveTab] = useState('plans');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'success'|'error'|'info', text: string }
  const plans = useMemo(() => ([
    { name: 'Basic', priceINR: 1000, credits: 1000, bonus: 0 },
    { name: 'Professional', priceINR: 5000, credits: 5000, bonus: 500 },
    { name: 'Enterprise', priceINR: 10000, credits: 10000, bonus: 1000 },
  ]), []);

  const rates = useMemo(() => ([
    { label: 'Call (per minute)', credits: 2 },
    { label: 'WhatsApp message', credits: 1 },
    { label: 'Telegram message', credits: 0.25 },
    { label: 'Email', credits: 0.10 },
  ]), []);

  // Simple static usage graph (placeholder)
  const usage = useMemo(() => ([
    { label: 'Calls', value: 60, color: '#2563eb' },
    { label: 'WhatsApp', value: 25, color: '#22c55e' },
    { label: 'Telegram', value: 10, color: '#a855f7' },
    { label: 'Email', value: 5, color: '#f59e0b' },
  ]), []);

  // Prefetch client profile once (auto-fill billing info)
  useEffect(() => {
    (async () => {
      try {
        const token = sessionStorage.getItem('clienttoken');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/client/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const prof = await res.json();
        if (prof?.success && prof.data) {
          setCustomerName(prev => prev || prof.data.name || '');
          setCustomerEmail(prev => prev || prof.data.email || '');
          setCustomerPhone(prev => prev || prof.data.mobileNo || '');
        }
        setPrefilled(true);
      } catch {}
    })();
  }, []);

  // Handle Paytm redirect (?orderId=&status=) — show message and auto-apply credits on SUCCESS
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    const status = params.get('status');
    if (!orderId || !status) return;
    // Clean URL without query after handling
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
    if (status === 'SUCCESS') {
      setNotice({ type: 'info', text: 'Finalizing your payment…' });
      const lastPlan = (function(){ try { return localStorage.getItem('paytm_last_plan'); } catch { return null; } })();
      // Store the orderId we received to ensure confirm uses the correct one
      try { localStorage.setItem('paytm_last_order', orderId); } catch {}
      if (lastPlan) {
        confirmCredits(lastPlan).then(() => {
          setNotice({ type: 'success', text: 'Payment successful. Credits added to your account.' });
          // Redirect to dashboard with success message
          window.location.href = 'http://localhost:5173/auth/dashboard?payment=success';
        }).catch(() => {
          setNotice({ type: 'error', text: 'Payment succeeded but applying credits failed. Please click "I paid, Apply Credits".' });
          // Redirect with failed credit apply notice
          window.location.href = 'http://localhost:5173/auth/dashboard?payment=success&credits=failed';
        });
      } else {
        setNotice({ type: 'error', text: 'Payment succeeded but plan context missing. Please click "I paid, Apply Credits".' });
        window.location.href = 'http://localhost:5173/auth/dashboard?payment=success&plan=missing';
      }
    } else {
      setNotice({ type: 'error', text: `Payment ${status}. Please try again.` });
      window.location.href = 'http://localhost:5173/auth/dashboard?payment=failed';
    }
  }, []);

  // After Paytm returns, merchant site will typically be redirected to CALLBACK_URL.
  // Provide a manual confirm button in modal to apply credits if orderId is known.
  async function confirmCredits(planKey) {
    const orderId = (function(){ try { return localStorage.getItem('paytm_last_order'); } catch { return null; } })();
    if (!orderId) { alert('Missing orderId. Complete payment first.'); return; }
    try {
      const token = sessionStorage.getItem('clienttoken');
      const res = await fetch(`${API_BASE_URL}/client/credits/paytm/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, planKey })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to apply credits');
      alert(`Credits added! New balance: ${data.data?.balance}`);
      setShowPayModal(false);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to apply credits');
    }
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tab Navigation (match InBoundSection style) */}
      <div className="border-b border-gray-200 flex-shrink-0">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'plans', label: 'Plans' },
            { id: 'rates', label: 'Credit Rates' },
            { id: 'usage', label: 'Usage' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-black text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {notice && (
          <div className={`mb-4 rounded border p-3 text-sm ${
            notice.type === 'success' ? 'border-green-300 bg-green-50 text-green-700' :
            notice.type === 'error' ? 'border-red-300 bg-red-50 text-red-700' :
            'border-blue-300 bg-blue-50 text-blue-700'
          }`}>
            {notice.text}
          </div>
        )}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                <div className="text-sm uppercase tracking-wide text-gray-500">{p.name}</div>
                <div className="mt-2 text-2xl font-extrabold">{p.credits} Credits {p.bonus ? `+ ${p.bonus} bonus` : ''}</div>

                <div className="mt-1 text-gray-600">₹{p.priceINR}</div>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  <li>• Full access to platform features</li>
                  <li>• Credits usable across calls, messages, and email</li>
                  <li>• Easy top-ups anytime</li>
                </ul>
                <div className="mt-auto pt-4">
                  <button
                    className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                    onClick={async () => {
                      setSelectedPlan(p);
                      setShowPayModal(true);
                      // Prefill from client profile
                      if (!prefilled) {
                        try {
                          const token = sessionStorage.getItem('clienttoken');
                          const res = await fetch(`/client/profile`, { headers: { Authorization: `Bearer ${token}` } });
                          const prof = await res.json();
                          if (prof?.success && prof.data) {
                            setCustomerName(prof.data.name || '');
                            setCustomerEmail(prof.data.email || '');
                            setCustomerPhone(prof.data.mobileNo || '');
                          }
                          setPrefilled(true);
                        } catch {}
                      }
                    }}
                  >
                    Pay & Subscribe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rates' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 font-semibold">Credit Rates</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {rates.map((r) => (
                <div key={r.label} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600">{r.label}</div>
                  <div className="text-2xl font-bold mt-1">{r.credits} <span className="text-sm text-gray-500">credits</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 font-semibold">Sample Monthly Usage</div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  {usage.map((u) => (
                    <div key={u.label} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-gray-700">{u.label}</div>
                      <div className="flex-1 h-3 bg-gray-100 rounded">
                        <div className="h-3 rounded" style={{ width: `${u.value}%`, backgroundColor: u.color }} />
                      </div>
                      <div className="w-10 text-right text-sm text-gray-600">{u.value}%</div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  This is a static visualization for illustration. Calls are credited at 2 per minute, WhatsApp at 1 per message, Telegram at 0.25 per message, and Email at 0.10 per message.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Payment Modal */}
      {showPayModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">Checkout - {selectedPlan.name}</div>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            {(() => {
              const base = Number(selectedPlan.priceINR) || 0;
              const tax = Math.round(base * 0.18 * 100) / 100;
              const total = Math.round((base + tax) * 100) / 100;
              return (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">Order Summary</div>
                  <div className="border rounded-lg divide-y">
                    <div className="flex items-center justify-between p-3 text-sm"><span>Plan</span><span className="font-medium">{selectedPlan.name}</span></div>
                    <div className="flex items-center justify-between p-3 text-sm"><span>Base Amount</span><span>₹{base.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between p-3 text-sm"><span>GST (18%)</span><span>₹{tax.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between p-3 text-sm font-semibold"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                  </div>
                  <div className="text-xs text-gray-500">Billing to: {customerName || '—'} {customerEmail ? `• ${customerEmail}` : ''} {customerPhone ? `• ${customerPhone}` : ''}</div>
                </div>
              );
            })()}
            <div className="mt-6 flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={()=>setShowPayModal(false)}>Cancel</button>
              <button
                className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}`}
                disabled={loading}
                onClick={async ()=>{
                  try {
                    // Compute final total with 18% GST
                    const base = Number(selectedPlan.priceINR) || 0;
                    const tax = Math.round(base * 0.18 * 100) / 100;
                    const total = Math.round((base + tax) * 100) / 100;
                    // Ensure required fields from client DB
                    // Final attempt to fetch before payment, no UI blocking
                    if (!customerName || !customerEmail || !customerPhone) {
                      try {
                        const token = sessionStorage.getItem('clienttoken');
                        const resProf = await fetch(`/client/profile`, { headers: { Authorization: `Bearer ${token}` } });
                        const prof = await resProf.json();
                        if (prof?.success && prof.data) {
                          if (!customerName) setCustomerName(prof.data.name || '');
                          if (!customerEmail) setCustomerEmail(prof.data.email || '');
                          if (!customerPhone) setCustomerPhone(prof.data.mobileNo || '');
                        }
                      } catch {}
                    }
                    setLoading(true);
                    // Hand off to our backend so it performs redirect server-side
                    const token = sessionStorage.getItem('clienttoken');
                    const t = encodeURIComponent(token || '');
                    try { localStorage.setItem('paytm_last_plan', (selectedPlan?.name || '').toLowerCase()); } catch {}
                    window.location.href = `${API_BASE_URL}/client/payments/initiate/direct?t=${t}&amount=${encodeURIComponent(total)}&planKey=${encodeURIComponent((selectedPlan?.name || '').toLowerCase())}`;
                  } catch (e) {
                    console.error(e);
                    alert(e.message || 'Payment initiation failed');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? 'Redirecting…' : 'Pay with Paytm'}
              </button>
              <button className="px-4 py-2 border rounded" onClick={()=>confirmCredits(selectedPlan?.name?.toLowerCase())}>I paid, Apply Credits</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


