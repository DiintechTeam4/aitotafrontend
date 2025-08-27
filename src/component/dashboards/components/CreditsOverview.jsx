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

  // Get type icon based on usage type
  const getTypeIcon = (type, usageType) => {
    const actualType = usageType || type;
    
    switch (actualType) {
      case 'voice_call':
      case 'Call':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
        );
      case 'whatsapp':
      case 'WhatsApp':
        return (
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
          </div>
        );
      case 'telegram':
      case 'Telegram':
        return (
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
        );
      case 'email':
      case 'Email':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  // Format usage type display name
  const formatUsageType = (type, usageType) => {
    const actualType = usageType || type;
    switch (actualType) {
      case 'voice_call':
        return 'Voice Call';
      case 'whatsapp':
        return 'WhatsApp';
      case 'telegram':
        return 'Telegram';
      case 'email':
        return 'Email';
      default:
        return actualType;
    }
  };

  // Calculate usage statistics
  const getUsageStats = () => {
    const usageTypes = {
      'Call': { count: 0, credits: 0, color: '#3B82F6' },
      'WhatsApp': { count: 0, credits: 0, color: '#10B981' },
      'Telegram': { count: 0, credits: 0, color: '#06B6D4' },
      'Email': { count: 0, credits: 0, color: '#8B5CF6' }
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
  
  // Filter only usage/debit transactions for recent activity
  const recentUsageHistory = history.filter(item => item.amount < 0).slice(0, 5);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading credits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-gray-900 border-b border-gray-200 px-8 py-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-3">Credits Overview</h2>
            <p className="text-gray-300 text-lg">Monitor your usage and manage credits efficiently</p>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            Purchase Credits
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto space-y-8">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-black via-gray-900 to-black rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-gray-300 text-base font-medium mb-3">Available Balance</div>
              <div className="text-6xl font-bold mb-2">{balance?.currentBalance ?? 0}</div>
              <div className="text-gray-300 text-base">Credits Remaining</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Usage Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usage Distribution */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h3 className="text-2xl font-semibold text-black mb-8">Usage Distribution</h3>
            {usageStats.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={usageStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      dataKey="credits"
                    >
                      {usageStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} credits`, 'Usage']}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-700">No usage data available</p>
                  <p className="text-sm text-gray-500 mt-1">Start using services to see analytics</p>
                </div>
              </div>
            )}
            
            {usageStats.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-6">
                {usageStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div 
                      className="w-5 h-5 rounded-full mr-4 flex-shrink-0"
                      style={{ backgroundColor: stat.color }}
                    ></div>
                    <div>
                      <div className="text-sm font-semibold text-black">{stat.name}</div>
                      <div className="text-xs text-gray-600">{stat.credits} credits • {stat.count} uses</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Usage Trend */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h3 className="text-2xl font-semibold text-black mb-8">7-Day Usage Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}
                    formatter={(value) => [`${value} credits`, 'Used']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#000" 
                    strokeWidth={4}
                    dot={{ fill: '#000', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#000', stroke: '#fff', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Usage Breakdown */}
        {usageStats.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <h3 className="text-2xl font-semibold text-black mb-8">Usage Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageStats} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 13, fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#000',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}
                    formatter={(value, name) => [
                      `${value} credits`,
                      'Total Usage'
                    ]}
                  />
                  <Bar 
                    dataKey="credits" 
                    fill="#000"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Usage Activity */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-black">Recent Usage</h3>
                <p className="text-gray-500 mt-1">Latest credit consumption activity</p>
              </div>
              <button
                onClick={() => setShowFullHistory(true)}
                className="text-black hover:text-white font-semibold text-sm border-2 border-black px-6 py-3 rounded-xl hover:bg-black transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View All Transactions
              </button>
            </div>
          </div>

          <div className="p-8">
            {recentUsageHistory.length > 0 ? (
              <div className="space-y-4">
                {recentUsageHistory.map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-md">
                    <div className="flex items-center space-x-5">
                      {getTypeIcon(h.type, h.usageType)}
                      <div>
                        <div className="font-semibold text-black text-lg">{formatUsageType(h.type, h.usageType)}</div>
                        <div className="text-gray-600 text-sm mt-1">{h.description}</div>
                        <div className="text-gray-500 text-sm mt-1 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {new Date(h.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {h.metadata && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {h.metadata.number && (
                              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                {h.metadata.number}
                              </span>
                            )}
                            {h.metadata.direction && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                {h.metadata.direction}
                              </span>
                            )}
                            {(h.duration || h.metadata?.seconds) && (
                              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {h.duration ? `${h.duration} min` : `${h.metadata.seconds}s`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {h.amount}
                      </div>
                      <div className="text-gray-500 text-sm font-medium">Credits</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-700 mb-2">No Usage Activity</h4>
                <p className="text-gray-500 mb-6">Start using our services to see your activity here</p>
                <button
                  onClick={() => setShowPlansModal(true)}
                  className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Transaction History Modal */}
      {showFullHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
            <div className="bg-gradient-to-r from-black to-gray-900 text-white px-8 py-8 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold">Complete Transaction History</h3>
                  <p className="text-gray-300 mt-2 text-lg">Detailed record of all credit transactions and usage</p>
                </div>
                <button
                  onClick={() => setShowFullHistory(false)}
                  className="text-gray-300 hover:text-white p-3 hover:bg-white/10 rounded-full transition-all duration-200"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-5 py-3 border-2 border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-white/30 focus:border-white/40 text-sm font-medium"
                >
                  <option value="all" className="text-black">All Transactions</option>
                  <option value="credit" className="text-black">Credits Added</option>
                  <option value="debit" className="text-black">Credits Used</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-5 py-3 border-2 border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-white/30 focus:border-white/40 text-sm font-medium"
                >
                  <option value="all" className="text-black">All Time</option>
                  <option value="7days" className="text-black">Last 7 Days</option>
                  <option value="30days" className="text-black">Last 30 Days</option>
                  <option value="90days" className="text-black">Last 90 Days</option>
                </select>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Date & Time</th>
                    <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Service</th>
                    <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Description</th>
                    <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Credits</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredHistory.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-8 py-6 text-sm">
                        <div className="font-semibold text-black text-base">
                          {new Date(h.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-gray-500 text-sm mt-1">
                          {new Date(h.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm">
                        <div className="flex items-center space-x-3">
                          {h.amount > 0 ? (
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                              </svg>
                            </div>
                          ) : (
                            getTypeIcon(h.type, h.usageType)
                          )}
                          <div>
                            <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg ${
                              h.amount > 0 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {h.amount > 0 ? 'Credit Added' : formatUsageType(h.type, h.usageType)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm">
                        <div className="font-medium text-black text-base mb-1">{h.description}</div>
                        {h.metadata && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {h.metadata.number && (
                              <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                {h.metadata.number}
                              </span>
                            )}
                            {h.metadata.direction && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-md border border-gray-200">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                {h.metadata.direction}
                              </span>
                            )}
                            {(h.duration || h.metadata?.seconds) && (
                              <span className="inline-flex items-center px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md border border-yellow-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {h.duration ? `${h.duration} min` : `${h.metadata.seconds}s`}
                              </span>
                            )}
                            {h.metadata.uniqueId && (
                              <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                {h.metadata.uniqueId}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-sm">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${h.amount < 0 ? 'text-red-600' : 'text-green-600'} mb-1`}>
                            {h.amount > 0 ? '+' : ''}{h.amount}
                          </div>
                          <div className="text-gray-500 text-sm font-medium">credits</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td className="px-8 py-16 text-center text-gray-500" colSpan={4}>
                        <div className="flex flex-col items-center">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h4 className="text-xl font-semibold text-gray-700 mb-2">No transactions found</h4>
                          <p className="text-gray-500">Adjust filters or purchase credits to see activity</p>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-black to-gray-900 text-white border-b border-gray-200 px-8 py-8 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold">Choose Your Plan</h3>
                  <p className="text-gray-300 mt-2 text-lg">Select the perfect credit package for your needs</p>
                </div>
                <button
                  onClick={() => setShowPlansModal(false)}
                  className="text-gray-300 hover:text-white p-3 hover:bg-white/10 rounded-full transition-all duration-200"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`relative rounded-3xl border-2 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                      plan.popular 
                        ? 'border-black bg-gradient-to-br from-gray-50 to-white transform scale-105 shadow-2xl' 
                        : 'border-gray-200 bg-white hover:border-black hover:shadow-2xl'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-black to-gray-800 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                          ⭐ Most Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h4 className="text-3xl font-bold text-black mb-4">{plan.name}</h4>
                      <div className="text-5xl font-bold text-black mb-2">
                        ₹{plan.priceINR.toLocaleString()}
                      </div>
                      <p className="text-gray-600 text-lg">+ 18% GST</p>
                    </div>

                    <div className="text-center mb-8 p-6 bg-gray-50 rounded-2xl">
                      <div className="text-4xl font-bold text-black mb-2">
                        {(plan.credits + plan.bonus).toLocaleString()}
                      </div>
                      <div className="text-gray-600 font-medium">Total Credits</div>
                      {plan.bonus > 0 && (
                        <div className="text-green-600 font-bold text-lg mt-2">
                          🎁 +{plan.bonus} Bonus Credits!
                        </div>
                      )}
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleCashfreePurchase(plan)}
                        disabled={paymentLoading}
                        className={`w-full py-5 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                          plan.popular
                            ? 'bg-gradient-to-r from-black to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 shadow-xl hover:shadow-2xl'
                            : 'bg-gray-900 text-white hover:bg-black'
                        } ${paymentLoading && selectedPlan?.name === plan.name ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'}`}
                      >
                        {paymentLoading && selectedPlan?.name === plan.name ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
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

              <div className="mt-12 p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border border-gray-200">
                <h4 className="font-bold text-black mb-6 flex items-center text-xl">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Credit Usage Rates
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <div className="text-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <div className="font-bold text-black text-2xl mb-1">2</div>
                    <div className="text-gray-600 font-medium">Credits per minute call</div>
                  </div>
                  <div className="text-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </div>
                    <div className="font-bold text-black text-2xl mb-1">1</div>
                    <div className="text-gray-600 font-medium">Credit per WhatsApp message</div>
                  </div>
                  <div className="text-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </div>
                    <div className="font-bold text-black text-2xl mb-1">0.25</div>
                    <div className="text-gray-600 font-medium">Credits per Telegram message</div>
                  </div>
                  <div className="text-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div className="font-bold text-black text-2xl mb-1">0.10</div>
                    <div className="text-gray-600 font-medium">Credits per Email</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-8 bg-gradient-to-br from-black to-gray-900 rounded-2xl border border-gray-800">
                <div className="flex items-start text-white">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold mb-2 text-lg">🔒 Secure Payment Processing</p>
                    <p className="text-gray-300 text-base leading-relaxed">All payments are processed securely through Cashfree Payment Gateway. Your data is encrypted and protected. GST will be added at checkout.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Loading Overlay */}
      {paymentLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl p-10 shadow-2xl text-center max-w-md w-full mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-black mb-3">Processing Payment</h3>
            <p className="text-gray-600 text-base leading-relaxed">Please wait while we redirect you to the secure payment gateway...</p>
          </div>
        </div>
      )}
    </div>
  );
}