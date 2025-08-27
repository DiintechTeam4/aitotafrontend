import { useEffect, useState } from "react";
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
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
  const [showFullHistory, setShowFullHistory] = useState(false);

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

  // Calculate usage statistics
  const getUsageStats = () => {
    const usageTypes = {
      'Call': { count: 0, credits: 0, color: '#000000' },
      'WhatsApp': { count: 0, credits: 0, color: '#374151' },
      'Telegram': { count: 0, credits: 0, color: '#6B7280' },
      'Email': { count: 0, credits: 0, color: '#9CA3AF' }
    };

    history.forEach(item => {
      if (item.amount < 0) { // Only count debits
        const type = item.usageType || item.type;
        const normalizedType = type === 'voice_call' ? 'Call' : 
                              type === 'whatsapp' ? 'WhatsApp' :
                              type === 'telegram' ? 'Telegram' :
                              type === 'email' ? 'Email' : type;
        
        if (usageTypes[normalizedType]) {
          usageTypes[normalizedType].count++;
          usageTypes[normalizedType].credits += Math.abs(item.amount);
        }
      }
    });

    return Object.entries(usageTypes)
      .filter(([_, data]) => data.credits > 0)
      .map(([type, data]) => ({
        name: type,
        credits: data.credits,
        count: data.count,
        color: data.color
      }));
  };

  // Get daily usage for line chart
  const getDailyUsage = () => {
    const last7Days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayUsage = history
        .filter(item => {
          const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
          return itemDate === dateStr && item.amount < 0;
        })
        .reduce((sum, item) => sum + Math.abs(item.amount), 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        usage: dayUsage
      });
    }
    
    return last7Days;
  };

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

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => 
        selectedFilter === 'credit' ? item.amount > 0 : item.amount < 0
      );
    }

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

  let cashfreeInstanceRef = null;
  const ensureCashfreeInstance = async () => {
    if (cashfreeInstanceRef) return cashfreeInstanceRef;
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
      try {
        const verifyResp = await fetch(`${API_BASE_URL}/payments/cashfree/verify-and-credit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ order_id: result?.order && result.order.orderId ? result.order.orderId : undefined })
        });
        const verifyData = await verifyResp.json();
        if (!verifyResp.ok) console.warn('Verify-and-credit failed', verifyData);
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

      window.lastSelectedPlan = plan.name.toLowerCase();

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
      console.error('Payment error:', error);
      alert(error.message || 'Payment initiation failed');
    } finally {
      setPaymentLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleDirectPurchase = async (plan) => {
    try {
      const base = Number(plan.priceINR) || 0;
      const tax = Math.round(base * 0.18 * 100) / 100;
      const total = Math.round((base + tax) * 100) / 100;

      window.lastSelectedPlan = plan.name.toLowerCase();

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

  const usageStats = getUsageStats();
  const dailyUsage = getDailyUsage();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-black border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Credits Overview</h2>
            <p className="text-gray-300">Monitor your usage and manage credits efficiently</p>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
          >
            Purchase Credits
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto space-y-8">
        {/* Balance Card */}
        <div className="bg-black rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-300 text-sm font-medium mb-2">Available Balance</div>
              <div className="text-5xl font-bold">{balance?.currentBalance ?? 0}</div>
              <div className="text-gray-300 text-sm mt-1">Credits Remaining</div>
            </div>
            <div className="bg-white/10 p-4 rounded-full">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Usage Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usage Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-black mb-6">Usage Distribution</h3>
            {usageStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usageStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="credits"
                    >
                      {usageStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} credits`, 'Usage']}
                      labelFormatter={(label) => `${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>No usage data available</p>
                </div>
              </div>
            )}
            
            {usageStats.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                {usageStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3"
                      style={{ backgroundColor: stat.color }}
                    ></div>
                    <div>
                      <div className="text-sm font-semibold text-black">{stat.name}</div>
                      <div className="text-xs text-gray-600">{stat.credits} credits</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Usage Trend */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-black mb-6">7-Day Usage Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value} credits`, 'Used']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#000" 
                    strokeWidth={3}
                    dot={{ fill: '#000', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#000' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Usage Breakdown */}
        {usageStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-black mb-6">Usage Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [
                      `${value} credits`,
                      'Total Usage'
                    ]}
                  />
                  <Bar 
                    dataKey="credits" 
                    fill="#000"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-black">Recent Activity</h3>
              <button
                onClick={() => setShowFullHistory(true)}
                className="text-black hover:text-gray-700 font-medium text-sm border border-black px-4 py-2 rounded-lg hover:bg-black hover:text-white transition-all duration-200"
              >
                View All Transactions
              </button>
            </div>
          </div>

          <div className="p-6">
            {history.slice(0, 5).length > 0 ? (
              <div className="space-y-4">
                {history.slice(0, 5).map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        h.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {h.amount > 0 ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-black">{h.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(h.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold text-lg ${h.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {h.amount > 0 ? '+' : ''}{h.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Transaction History Modal */}
      {showFullHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="bg-black text-white px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Transaction History</h3>
                  <p className="text-gray-300 mt-1">Complete record of all credit transactions</p>
                </div>
                <button
                  onClick={() => setShowFullHistory(false)}
                  className="text-gray-300 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-black text-white focus:ring-2 focus:ring-white/20 focus:border-white/30"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits Added</option>
                  <option value="debit">Credits Used</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-black text-white focus:ring-2 focus:ring-white/20 focus:border-white/30"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Credits</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm text-black font-medium">
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
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            h.amount > 0 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {h.type}
                          </span>
                          {h.usageType && (
                            <span className="ml-2 text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                              {h.usageType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        <div className="font-medium">{h.description}</div>
                        {h.metadata && (
                          <div className="text-xs text-gray-500 mt-1 space-y-1">
                            {h.metadata.number && <div className="flex items-center"><span className="mr-1">📞</span>{h.metadata.number}</div>}
                            {h.metadata.direction && <div className="flex items-center"><span className="mr-1">↗️</span>{h.metadata.direction}</div>}
                            {h.duration && <div className="flex items-center"><span className="mr-1">⏱️</span>{h.duration} min</div>}
                            {h.metadata.seconds && <div className="flex items-center"><span className="mr-1">⏱️</span>{h.metadata.seconds}s</div>}
                            {h.metadata.uniqueId && <div className="flex items-center"><span className="mr-1">🆔</span>{h.metadata.uniqueId}</div>}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        <span className={`text-lg ${h.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {h.amount > 0 ? '+' : ''}{h.amount}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td className="px-6 py-12 text-center text-gray-500" colSpan={4}>
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-medium text-gray-700">No transactions found</p>
                          <p className="text-sm text-gray-500">Adjust filters or purchase credits to see activity</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Plans Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-black text-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Choose Your Plan</h3>
                  <p className="text-gray-300 mt-1">Select the perfect credit package for your needs</p>
                </div>
                <button
                  onClick={() => setShowPlansModal(false)}
                  className="text-gray-300 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
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
                        ? 'border-black bg-gray-50 transform scale-105' 
                        : 'border-gray-200 bg-white hover:border-black'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-black text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h4 className="text-2xl font-bold text-black mb-2">{plan.name}</h4>
                      <div className="text-4xl font-bold text-black mb-1">
                        ₹{plan.priceINR.toLocaleString()}
                      </div>
                      <p className="text-gray-600">+ 18% GST</p>
                    </div>

                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-black mb-1">
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
                            ? 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
                            : 'bg-gray-900 text-white hover:bg-black'
                        } ${paymentLoading && selectedPlan?.name === plan.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {paymentLoading && selectedPlan?.name === plan.name ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : (
                          <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                            Pay with Cashfree
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-black mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Credit Usage Rates:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="font-bold text-black text-lg">2 Credits</div>
                    <div className="text-gray-600">per minute call</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="font-bold text-black text-lg">1 Credit</div>
                    <div className="text-gray-600">WhatsApp message</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="font-bold text-black text-lg">0.25 Credits</div>
                    <div className="text-gray-600">Telegram message</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="font-bold text-black text-lg">0.10 Credits</div>
                    <div className="text-gray-600">Email</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-black rounded-lg border border-gray-800">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-white mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-white">
                    <p className="font-medium mb-1">Secure Payment Processing</p>
                    <p className="text-gray-300">All payments are processed securely through Cashfree Payment Gateway. Your data is encrypted and protected. GST will be added at checkout.</p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-black mb-2">Processing Payment</h3>
            <p className="text-gray-600 text-sm">Please wait while we redirect you to the payment gateway...</p>
          </div>
        </div>
      )}
    </div>
  );
}