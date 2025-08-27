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
  const [selectedFilter, setSelectedFilter] = useState('credit'); // Changed default to 'credit'
  const [dateFilter, setDateFilter] = useState('all');
  const [graphDateFilter, setGraphDateFilter] = useState('7days'); // New filter for graphs
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

  // Get type icon for credits added
  const getCreditIcon = () => {
    return (
      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </div>
    );
  };

  // Calculate credit statistics (only for credits added)
  const getCreditStats = () => {
    const creditTypes = {
      'Basic': { count: 0, credits: 0, color: '#10B981' },
      'Professional': { count: 0, credits: 0, color: '#3B82F6' },
      'Enterprise': { count: 0, credits: 0, color: '#8B5CF6' },
      'Manual': { count: 0, credits: 0, color: '#F59E0B' }
    };

    // Filter for date range based on graphDateFilter
    const filteredForGraph = getFilteredDataForGraph();

    filteredForGraph.forEach(item => {
      if (item.amount > 0) { // Only count credits
        const type = item.planType || 'Manual';
        if (creditTypes[type]) {
          creditTypes[type].count++;
          creditTypes[type].credits += item.amount;
        }
      }
    });

    return Object.entries(creditTypes)
      .filter(([_, data]) => data.credits > 0)
      .map(([type, data]) => ({
        name: type,
        credits: data.credits,
        count: data.count,
        color: data.color
      }));
  };

  // Get filtered data based on graph date filter
  const getFilteredDataForGraph = () => {
    const now = new Date();
    let filterDate = null;

    switch (graphDateFilter) {
      case '7days':
        filterDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case '30days':
        filterDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case '90days':
        filterDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
      case 'all':
      default:
        return history;
    }

    return history.filter(item => new Date(item.timestamp) >= filterDate);
  };

  // Get daily credit additions for line chart
  const getDailyCreditAdditions = () => {
    const days = graphDateFilter === '7days' ? 7 : graphDateFilter === '30days' ? 30 : 90;
    const dailyData = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCredits = history
        .filter(item => {
          const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
          return itemDate === dateStr && item.amount > 0;
        })
        .reduce((sum, item) => sum + item.amount, 0);
      
      dailyData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        credits: dayCredits
      });
    }
    
    return dailyData;
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
        setFilteredHistory(rows.filter(item => item.amount > 0)); // Default to credits added
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

  const creditStats = getCreditStats();
  const dailyCreditData = getDailyCreditAdditions();
  
  // Filter only credit addition transactions for recent activity
  const recentCreditHistory = history.filter(item => item.amount > 0).slice(0, 5);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Credits Overview</h2>
            <p className="text-gray-600 text-sm">Monitor your usage and manage credits efficiently</p>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium text-sm shadow-sm hover:bg-gray-800 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            Purchase Credits
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl shadow-sm p-6 text-white border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-300 text-sm font-medium mb-2">Available Balance</div>
              <div className="text-3xl font-bold mb-1">{balance?.currentBalance ?? 0}</div>
              <div className="text-gray-300 text-sm">Credits Remaining</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Graph Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Credit Analytics</h3>
            <select
              value={graphDateFilter}
              onChange={(e) => setGraphDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Credit Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Credit Distribution */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">Credit Distribution by Plan</h4>
              {creditStats.length > 0 ? (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={creditStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        dataKey="credits"
                      >
                        {creditStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} credits`, 'Added']}
                        contentStyle={{
                          backgroundColor: '#000',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">No credit data available</p>
                    <p className="text-xs text-gray-500 mt-1">Purchase credits to see analytics</p>
                  </div>
                </div>
              )}
              
              {creditStats.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {creditStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: stat.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{stat.name}</div>
                        <div className="text-xs text-gray-600">{stat.credits} credits • {stat.count} purchases</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Credit Additions Trend */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">Daily Credit Additions</h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyCreditData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [`${value} credits`, 'Added']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="credits" 
                      stroke="#000" 
                      strokeWidth={3}
                      dot={{ fill: '#000', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Breakdown Bar Chart */}
        {creditStats.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Purchases by Plan</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditStats} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value, name) => [
                      `${value} credits`,
                      'Total Purchased'
                    ]}
                  />
                  <Bar 
                    dataKey="credits" 
                    fill="#000"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Credit Additions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Credit Additions</h3>
                <p className="text-gray-500 text-sm mt-1">Latest credit purchases and additions</p>
              </div>
              <button
                onClick={() => setShowFullHistory(true)}
                className="text-black hover:text-white text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-black hover:border-black transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View All
              </button>
            </div>
          </div>

          <div className="p-6">
            {recentCreditHistory.length > 0 ? (
              <div className="space-y-3">
                {recentCreditHistory.map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
                    <div className="flex items-center space-x-4">
                      {getCreditIcon()}
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{h.description}</div>
                        <div className="text-gray-500 text-xs mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {new Date(h.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {h.planType && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md font-medium">
                              {h.planType} Plan
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600 mb-1">
                        +{h.amount}
                      </div>
                      <div className="text-gray-500 text-xs font-medium">credits</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-base font-medium text-gray-700 mb-2">No Credit History</h4>
                <p className="text-gray-500 text-sm mb-4">Purchase credits to see your transaction history</p>
                <button
                  onClick={() => setShowPlansModal(true)}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Purchase Credits
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Transaction History Modal */}
      {showFullHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Complete Transaction History</h3>
                  <p className="text-gray-600 text-sm mt-1">Detailed record of all credit transactions</p>
                </div>
                <button
                  onClick={() => setShowFullHistory(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits Added</option>
                  <option value="debit">Credits Used</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:ring-2 focus:ring-black focus:border-black"
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
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredHistory.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900 text-sm">
                          {new Date(h.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {new Date(h.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-3">
                          {h.amount > 0 ? (
                            <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                              <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                              h.amount > 0 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {h.amount > 0 ? 'Credit Added' : 'Credit Used'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900 text-sm mb-1">{h.description}</div>
                        {h.planType && (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200 font-medium">
                            {h.planType} Plan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${h.amount < 0 ? 'text-red-600' : 'text-green-600'} mb-1`}>
                            {h.amount > 0 ? '+' : ''}{h.amount}
                          </div>
                          <div className="text-gray-500 text-xs font-medium">credits</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td className="px-6 py-12 text-center text-gray-500" colSpan={4}>
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h4 className="text-base font-medium text-gray-700 mb-2">No transactions found</h4>
                          <p className="text-gray-500 text-sm">Adjust filters or purchase credits to see activity</p>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Choose Your Plan</h3>
                  <p className="text-gray-600 text-sm mt-1">Select the perfect credit package for your needs</p>
                </div>
                <button
                  onClick={() => setShowPlansModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative rounded-xl border p-6 shadow-sm hover:shadow-md transition-all duration-300 ${
                      plan.popular 
                        ? 'border-black bg-gray-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-3">{plan.name}</h4>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        ₹{plan.priceINR.toLocaleString()}
                      </div>
                      <p className="text-gray-500 text-sm">+ 18% GST</p>
                    </div>

                    <div className="text-center mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {(plan.credits + plan.bonus).toLocaleString()}
                      </div>
                      <div className="text-gray-600 text-sm font-medium">Total Credits</div>
                      {plan.bonus > 0 && (
                        <div className="text-green-600 font-medium text-sm mt-2">
                          +{plan.bonus} Bonus Credits!
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-xs text-gray-700">
                          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                            <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleCashfreePurchase(plan)}
                      disabled={paymentLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 ${
                        plan.popular
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-900 text-white hover:bg-black'
                      } ${paymentLoading && selectedPlan?.name === plan.name ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                    >
                      {paymentLoading && selectedPlan?.name === plan.name ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <span className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                          Pay with Cashfree
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-base">
                  <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Credit Usage Rates
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <div className="font-bold text-gray-900 text-lg mb-1">2</div>
                    <div className="text-gray-600 text-xs font-medium">Credits per minute call</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </div>
                    <div className="font-bold text-gray-900 text-lg mb-1">1</div>
                    <div className="text-gray-600 text-xs font-medium">Credit per WhatsApp message</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </div>
                    <div className="font-bold text-gray-900 text-lg mb-1">0.25</div>
                    <div className="text-gray-600 text-xs font-medium">Credits per Telegram message</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div className="font-bold text-gray-900 text-lg mb-1">0.10</div>
                    <div className="text-gray-600 text-xs font-medium">Credits per Email</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-6 bg-gray-900 rounded-xl border border-gray-800">
                <div className="flex items-start text-white">
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium mb-2 text-sm">Secure Payment Processing</p>
                    <p className="text-gray-300 text-xs leading-relaxed">All payments are processed securely through Cashfree Payment Gateway. Your data is encrypted and protected. GST will be added at checkout.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Loading Overlay */}
      {paymentLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-8 shadow-xl text-center max-w-sm w-full mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
            <p className="text-gray-600 text-sm">Please wait while we redirect you to the secure payment gateway...</p>
          </div>
        </div>
      )}
    </div>
  );
}