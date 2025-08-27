import { useEffect, useState } from "react";
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';
import { API_BASE_URL } from "../../../config";

export default function CreditsOverview() {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const token = sessionStorage.getItem("clienttoken");

  const plans = [
    { 
      name: 'Basic', 
      priceINR: 1, 
      credits: 1000, 
      bonus: 0,
      popular: false,
      features: ['Call Support', 'WhatsApp Integration', 'Email Notifications', 'Basic Analytics']
    },
    { 
      name: 'Professional', 
      priceINR: 5000, 
      credits: 5000, 
      bonus: 500,
      popular: true,
      features: ['Everything in Basic', 'Telegram Integration', 'Advanced Analytics', 'Priority Support', '500 Bonus Credits']
    },
    { 
      name: 'Enterprise', 
      priceINR: 10000, 
      credits: 10000, 
      bonus: 1000,
      popular: false,
      features: ['Everything in Professional', 'Custom Integrations', 'Dedicated Support', 'Advanced Reporting', '1000 Bonus Credits']
    },
  ];

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [balRes, histRes] = await Promise.all([
        fetch(`${API_BASE_URL}/client/credits/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/client/credits/history?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const bal = await balRes.json();
      const hist = await histRes.json();
      if (bal.success) setBalance(bal.data);
      if (hist.success) {
        const rows = Array.isArray(hist.data?.history) ? hist.data.history : Array.isArray(hist.data) ? hist.data : [];
        setHistory(rows);
        setFilteredHistory(rows);
      }
    } catch (e) {
      console.error("Failed to load credits:", e);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => 
        selectedFilter === 'credit' ? item.amount > 0 : item.amount < 0
      );
    }

    // Filter by date
    const now = new Date();
    if (dateFilter !== 'all') {
      const filterDate = new Date();
      switch (dateFilter) {
        case '7days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          filterDate.setDate(now.getDate() - 90);
          break;
      }
      filtered = filtered.filter(item => new Date(item.timestamp) >= filterDate);
    }

    setFilteredHistory(filtered);
  };

  useEffect(() => {
    if (token) fetchAll();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [selectedFilter, dateFilter, history]);

  // Cashfree Web SDK v2: initialize once and reuse
  let cashfreeInstanceRef = null;
  const ensureCashfreeInstance = async () => {
    if (cashfreeInstanceRef) return cashfreeInstanceRef;
    // Use production mode; Cashfree handles session environment
    cashfreeInstanceRef = await loadCashfree({ mode: 'production' });
    return cashfreeInstanceRef;
  };

  const launchCashfreeCheckout = async (sessionId) => {
    if (!sessionId) {
      throw new Error('Missing payment session id');
    }
    try {
      const cashfree = await ensureCashfreeInstance();
      const result = await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: '_modal' });
      if (result?.error) throw new Error(result.error?.message || 'Checkout failed');
      // After checkout completes/redirects back, verify and credit
      try {
        const verifyResp = await fetch(`${API_BASE_URL}/payments/cashfree/verify-and-credit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ order_id: result?.order && result.order.orderId ? result.order.orderId : undefined })
        });
        const verifyData = await verifyResp.json();
        if (!verifyResp.ok) console.warn('Verify-and-credit failed', verifyData);
        // Refresh balances
        fetchAll();
      } catch (vErr) { console.warn('Post-payment verify failed', vErr); }
    } catch (e) {
      console.error('Cashfree SDK checkout failed:', e);
      alert('Unable to open Cashfree checkout. Please retry.');
    }
  };

  const handleCashfreePurchase = async (plan) => {
    try {
      setPaymentLoading(true);
      setSelectedPlan(plan);

      const base = Number(plan.priceINR) || 0;
      const tax = Math.round(base * 0.18 * 100) / 100;
      const total = Math.round((base + tax) * 100) / 100;

      // Store plan info in memory (since we can't use localStorage)
      window.lastSelectedPlan = plan.name.toLowerCase();

      // Initiate via new Cashfree create-order endpoint
      const resp = await fetch(`${API_BASE_URL}/payments/cashfree/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: total, planKey: plan.name.toLowerCase() })
      });
      const data = await resp.json();
      if (!resp.ok || !data?.payment_session_id) {
        throw new Error(data?.message || 'Failed to create payment');
      }
      launchCashfreeCheckout(data.payment_session_id);
    } catch (error) {
      console.error('❌ Payment error:', error);
      alert(error.message || 'Payment initiation failed');
    } finally {
      setPaymentLoading(false);
      setSelectedPlan(null);
    }
  };

  // Fallback to direct URL method (similar to Paytm)
  const handleDirectPurchase = async (plan) => {
    try {
      const base = Number(plan.priceINR) || 0;
      const tax = Math.round(base * 0.18 * 100) / 100;
      const total = Math.round((base + tax) * 100) / 100;

      // Store plan info in memory (since we can't use localStorage)
      window.lastSelectedPlan = plan.name.toLowerCase();

      // Reuse new create-order endpoint for reliability
      const resp = await fetch(`${API_BASE_URL}/payments/cashfree/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: total, planKey: plan.name.toLowerCase() })
      });
      const data = await resp.json();
      if (!resp.ok || !data?.payment_session_id) {
        throw new Error(data?.message || 'Failed to create payment');
      }
      launchCashfreeCheckout(data.payment_session_id);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Payment initiation failed');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Credits Overview</h2>
            <p className="text-gray-600">Manage your credits and view transaction history</p>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Buy Credits
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto space-y-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-sm font-medium mb-2">Current Balance</div>
                <div className="text-4xl font-bold">{balance?.currentBalance ?? 0}</div>
                <div className="text-blue-100 text-sm mt-1">Available Credits</div>
              </div>
              <div className="bg-blue-400/30 p-3 rounded-full">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-sm font-medium mb-2">Total Used</div>
                <div className="text-4xl font-bold">{balance?.totalUsed ?? 0}</div>
                <div className="text-green-100 text-sm mt-1">Credits Consumed</div>
              </div>
              <div className="bg-green-400/30 p-3 rounded-full">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Activity */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-xl font-semibold text-gray-900">Transaction History</h3>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Type Filter */}
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits Added</option>
                  <option value="debit">Credits Used</option>
                </select>

                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((h, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {new Date(h.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      <div className="text-xs text-gray-500">
                        {new Date(h.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          h.amount > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {h.type}
                        </span>
                        {h.usageType && (
                          <span className="ml-2 text-gray-500 text-xs">• {h.usageType}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{h.description}</div>
                      {h.metadata && (
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          {h.metadata.number && <div>📞 {h.metadata.number}</div>}
                          {h.metadata.direction && <div>↔️ {h.metadata.direction}</div>}
                          {h.duration && <div>⏱️ {h.duration} min</div>}
                          {h.metadata.seconds && <div>⏱️ {h.metadata.seconds}s</div>}
                          {h.metadata.uniqueId && <div>🆔 {h.metadata.uniqueId}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      <span className={`${h.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {h.amount > 0 ? '+' : ''}{h.amount}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center text-gray-500" colSpan={4}>
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">No transactions found</p>
                        <p className="text-sm">Try adjusting your filters or purchase credits to get started</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Plans Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Choose Your Plan</h3>
                  <p className="text-gray-600 mt-1">Select the perfect credit package for your needs</p>
                </div>
                <button
                  onClick={() => setShowPlansModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative rounded-2xl border-2 p-8 shadow-lg hover:shadow-xl transition-all duration-300 ${
                      plan.popular 
                        ? 'border-blue-500 bg-blue-50 transform scale-105' 
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        ₹{plan.priceINR.toLocaleString()}
                      </div>
                      <p className="text-gray-600">+ 18% GST</p>
                    </div>

                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {(plan.credits + plan.bonus).toLocaleString()} Credits
                      </div>
                      {plan.bonus > 0 && (
                        <div className="text-green-600 font-semibold">
                          +{plan.bonus} Bonus Credits!
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleCashfreePurchase(plan)}
                        disabled={paymentLoading}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                          plan.popular
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        } ${paymentLoading && selectedPlan?.name === plan.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {paymentLoading && selectedPlan?.name === plan.name ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <span className="flex items-center justify-center">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                              </svg>
                              Pay with Cashfree (Direct)
                            </span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDirectPurchase(plan)}
                        disabled={paymentLoading}
                        className="w-full py-3 px-6 rounded-xl font-medium text-sm border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                      >
                        Alternative Payment Method
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Credit Usage Rates:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-semibold text-blue-600 text-lg">2 Credits</div>
                    <div className="text-gray-600">per minute call</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-semibold text-green-600 text-lg">1 Credit</div>
                    <div className="text-gray-600">WhatsApp message</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-semibold text-purple-600 text-lg">0.25 Credits</div>
                    <div className="text-gray-600">Telegram message</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="font-semibold text-orange-600 text-lg">0.10 Credits</div>
                    <div className="text-gray-600">Email</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Secure Payment Processing</p>
                    <p>All payments are processed securely through Cashfree Payment Gateway. Your data is encrypted and protected. GST will be added at checkout.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Loading Overlay */}
      {paymentLoading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
            <p className="text-gray-600 text-sm">Please wait while we redirect you to the payment gateway...</p>
          </div>
        </div>
      )}
    </div>
  );
}