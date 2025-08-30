import { useEffect, useState } from "react";
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { API_BASE_URL } from "../../../config";

export default function CreditsOverview() {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFilter, setSelectedFilter] = useState('credit');
  const [dateFilter, setDateFilter] = useState('all');
  const [graphDateFilter, setGraphDateFilter] = useState('today');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const token = sessionStorage.getItem("clienttoken");

  const plans = [
    { 
      name: 'Basic', 
      priceINR: 1000, 
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

  // Get filtered data based on graph date filter
  const getFilteredDataForGraph = () => {
    const now = new Date();
    let filterDate = null;

    switch (graphDateFilter) {
      case 'today':
        filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        filterDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        filterDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
        break;
      case '7days':
        filterDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'all':
      default:
        return history;
    }

    return history.filter(item => new Date(item.timestamp) >= filterDate);
  };

  // Get hourly credit additions for line chart (for today and yesterday)
  const getHourlyCreditAdditions = () => {
    const now = new Date();
    const hourlyData = [];
    
    if (graphDateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Generate 24 hours for today
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(today);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(today);
        hourEnd.setHours(hour + 1, 0, 0, 0);
        
        const hourCredits = history
          .filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= hourStart && itemDate < hourEnd && item.amount > 0;
          })
          .reduce((sum, item) => sum + item.amount, 0);
        
        const hourLabel = hour === 0 ? '12 AM' : 
                         hour === 12 ? '12 PM' : 
                         hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
        
        hourlyData.push({
          hour: hourLabel,
          credits: hourCredits,
          time: hour
        });
      }
    } else if (graphDateFilter === 'yesterday') {
      const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      
      // Generate 24 hours for yesterday
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(yesterdayStart);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(yesterdayStart);
        hourEnd.setHours(hour + 1, 0, 0, 0);
        
        const hourCredits = history
          .filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate >= hourStart && itemDate < hourEnd && item.amount > 0;
          })
          .reduce((sum, item) => sum + item.amount, 0);
        
        const hourLabel = hour === 0 ? '12 AM' : 
                         hour === 12 ? '12 PM' : 
                         hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
        
        hourlyData.push({
          hour: hourLabel,
          credits: hourCredits,
          time: hour
        });
      }
    } else {
      // For 7 days, use daily data
      const days = 7;
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
        
        hourlyData.push({
          hour: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          credits: dayCredits,
          time: i
        });
      }
    }
    
    return hourlyData;
  };

  // Usage breakdown pie chart: how much used for call, whatsapp, email, telegram
  const getUsageBreakdown = () => {
    const usageTypes = {
      call: { name: 'Mobile Calls', color: '#0ea5e9', total: 0 },
      whatsapp: { name: 'WhatsApp', color: '#22c55e', total: 0 },
      email: { name: 'Email', color: '#a855f7', total: 0 },
      telegram: { name: 'Telegram', color: '#f59e0b', total: 0 }
    };

    const filteredForGraph = getFilteredDataForGraph();
    
    filteredForGraph.forEach(item => {
      if (item.amount < 0 && item.usageType && usageTypes[item.usageType]) {
        usageTypes[item.usageType].total += Math.abs(item.amount);
      }
    });

    const totalUsage = Object.values(usageTypes).reduce((sum, type) => sum + type.total, 0);

    return Object.entries(usageTypes)
      .map(([key, data]) => ({
        name: data.name,
        value: data.total,
        color: data.color,
        percentage: totalUsage > 0 ? ((data.total / totalUsage) * 100).toFixed(1) : 0
      }))
      .filter(item => item.value > 0);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [balRes, histRes] = await Promise.all([
        fetch(`${API_BASE_URL}/client/credits/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/client/credits/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const bal = await balRes.json();
      const hist = await histRes.json();
      if (bal.success) setBalance(bal.data);
      if (hist.success) {
        const rows = Array.isArray(hist.data?.history) ? hist.data.history : Array.isArray(hist.data) ? hist.data : [];
        setHistory(rows);
        setFilteredHistory(rows.filter(item => item.amount > 0));
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

  const dailyCreditData = getHourlyCreditAdditions();
  const usageBreakdown = getUsageBreakdown();
  
  // Get credits used history (last 10 usage transactions)
  const getCreditsUsedHistory = () => {
    return history
      .filter(item => item.amount < 0)
      .slice(0, 10)
      .map(item => ({
        ...item,
        usageName: item.usageType === 'call' ? 'Mobile Call' : 
                  item.usageType === 'whatsapp' ? 'WhatsApp Message' :
                  item.usageType === 'email' ? 'Email' :
                  item.usageType === 'telegram' ? 'Telegram Message' : 'Unknown',
        usageIcon: item.usageType === 'call' ? '📞' : 
                  item.usageType === 'whatsapp' ? '📱' :
                  item.usageType === 'email' ? '📧' :
                  item.usageType === 'telegram' ? '💬' : '❓'
      }));
  };

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

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage</h3>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setGraphDateFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                graphDateFilter === 'today'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setGraphDateFilter('yesterday')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                graphDateFilter === 'yesterday'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setGraphDateFilter('7days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                graphDateFilter === '7days'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Credit Additions Line Chart */}
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-4">
              {graphDateFilter === 'today' || graphDateFilter === 'yesterday' ? 'Hourly Credit Usage' : 'Daily Credit Usage'}
            </h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyCreditData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="hour" 
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
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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

          {/* Usage Breakdown Pie Chart with Breakdown Values */}
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-4">Credits Usage Breakdown</h4>
            {usageBreakdown.length > 0 ? (
              <div className="flex">
                {/* Pie Chart */}
                <div className="w-1/2">
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usageBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          fontSize={10}
                        >
                          {usageBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            color: '#000000',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [`${value} credits`, 'Used']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Breakdown Values - Right Side */}
                <div className="w-1/2 pl-4">
                  <div className="space-y-3">
                    {usageBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-xs font-medium text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">No usage data available</p>
                  <p className="text-xs text-gray-500 mt-1">Start using services to see analytics</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credits Used History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Credits Usage</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Credits Used</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getCreditsUsedHistory().map((usage, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{usage.usageIcon}</span>
                      <span className="font-medium text-gray-900 text-sm">{usage.usageName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900">{usage.description}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-lg font-bold text-red-600">{Math.abs(usage.amount)}</div>
                    <div className="text-xs text-gray-500">credits</div>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="font-medium text-gray-900 text-sm">
                      {new Date(usage.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {new Date(usage.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {getCreditsUsedHistory().length === 0 && (
                <tr>
                  <td className="py-8 px-4 text-center text-gray-500" colSpan={4}>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">No usage history available</p>
                      <p className="text-xs text-gray-500 mt-1">Start using our services to see your usage history</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Usage Rates */}
      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
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
            <div className="text-gray-600 text-xs font-medium">Credits per minute</div>
            <div className="text-gray-800 text-xs font-semibold mt-1">Mobile Calls</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <div className="font-bold text-gray-900 text-lg mb-1">1</div>
            <div className="text-gray-600 text-xs font-medium">Credit per message</div>
            <div className="text-gray-800 text-xs font-semibold mt-1">WhatsApp</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <div className="font-bold text-gray-900 text-lg mb-1">0.25</div>
            <div className="text-gray-600 text-xs font-medium">Credits per message</div>
            <div className="text-gray-800 text-xs font-semibold mt-1">Telegram</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div className="font-bold text-gray-900 text-lg mb-1">0.10</div>
            <div className="text-gray-600 text-xs font-medium">Credits per email</div>
            <div className="text-gray-800 text-xs font-semibold mt-1">Email</div>
          </div>
        </div>
      </div>
    </div>
  );

  const PaymentHistoryTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
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

      {/* Transaction History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
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
  );

  // Inline purchase section (replaces modal)
  const PurchaseCreditsInline = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Purchase Credits</h3>
        <button
          onClick={() => setActiveTab('overview')}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <div className="absolute -top-3 left:1/2 md:left-1/2 transform -translate-x-1/2">
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
              <div className="text-green-600 font-medium text-sm mt-2">
                +{plan.bonus} bonus credits
              </div>
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

    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Purchase Button */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Credits Overview</h2>
            <p className="text-gray-600 text-sm">Monitor your usage and manage credits efficiently</p>
          </div>
          <button
            onClick={() => setActiveTab('purchase')}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-gray-800 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            Purchase Credits
          </button>
        </div>
      </div>

      {/* Common Summary Cards for All Pages */}
      <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Balance Card */}
          <div
            className="bg-gradient-to-r from-gray-900 to-black rounded-xl shadow-sm p-6 text-white border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-300"
            onClick={() => setActiveTab('overview')}
          >
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

          {/* Payment History Card */}
          <div 
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-300"
            onClick={() => setActiveTab('history')}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm font-medium mb-2">Payment History</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{history.filter(item => item.amount > 0).length}</div>
                <div className="text-gray-500 text-sm">Total Transactions</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */
      }
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "history" && <PaymentHistoryTab />}
        {activeTab === "purchase" && <PurchaseCreditsInline />}
      </div>

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