import React, { useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';
import './Testing.css';

// Initialize Cashfree
let cashfree;
const initializeSDK = async () => {
  try {
    cashfree = await load({
      mode: "production" 
    });
    console.log('✅ Cashfree SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Cashfree SDK:', error);
  }
};
initializeSDK();

function App() {
  const [paymentData, setPaymentData] = useState({
    amount: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handleInputChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
  };

  const createOrder = async () => {
    try {
      console.log('Creating order with data:', paymentData);
      
      const response = await fetch('https://cashfree-backen.onrender.com/create-order', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      console.log('Create order response:', result);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Create order error:', error);
      throw new Error('Failed to create order: ' + error.message);
    }
  };

  const verifyPayment = async (orderId) => {
    try {
      console.log('Verifying payment for order:', orderId);
      
      const response = await fetch('https://cashfree-backen.onrender.com/verify-payment', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: orderId })
      });

      const result = await response.json();
      console.log('Payment verification result:', result);
      
      return result;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return { success: false, message: 'Verification failed: ' + error.message };
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!paymentData.amount || !paymentData.customerName || !paymentData.customerEmail || !paymentData.customerPhone) {
      alert('Please fill all required fields');
      return;
    }

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!/^\d{10}$/.test(paymentData.customerPhone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.customerEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!cashfree) {
      alert('Payment system not initialized. Please refresh the page and try again.');
      return;
    }

    setLoading(true);
    setPaymentStatus(null);

    try {
      // Step 1: Create order
      console.log('Step 1: Creating order...');
      const orderData = await createOrder();
      console.log('Order created successfully:', orderData);

      if (!orderData.payment_session_id) {
        throw new Error('No payment session ID received from server');
      }

      // Step 2: Initialize payment
      const checkoutOptions = {
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_modal"
      };

      console.log('Step 2: Opening Cashfree checkout...', checkoutOptions);

      // Step 3: Open Cashfree checkout
      const result = await cashfree.checkout(checkoutOptions);
      
      console.log('Payment checkout result:', result);

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      if (result.redirect) {
        console.log('Payment completed, processing...');
      }

      // Step 4: Verify payment
      console.log('Step 4: Verifying payment...');
      const verification = await verifyPayment(orderData.order_id);
      
      if (verification.success) {
        if (verification.payment_status === 'SUCCESS' || verification.order_status === 'PAID') {
          setPaymentStatus({
            success: true,
            message: 'Payment completed successfully!',
            orderId: orderData.order_id,
            amount: paymentData.amount,
            status: verification.order_status
          });
          
          // Clear form
          setPaymentData({
            amount: '',
            customerName: '',
            customerEmail: '',
            customerPhone: ''
          });
        } else {
          setPaymentStatus({
            success: false,
            message: `Payment status: ${verification.order_status || verification.payment_status}`,
            orderId: orderData.order_id,
            status: verification.order_status
          });
        }
      } else {
        setPaymentStatus({
          success: false,
          message: verification.message || 'Payment verification failed. Please contact support.',
          orderId: orderData.order_id
        });
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus({
        success: false,
        message: error.message || 'Payment failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="payment-container">
        <h1>Cashfree Payment Gateway</h1>
        
        <form onSubmit={handlePayment} className="payment-form">
          <div className="form-group">
            <label htmlFor="amount">Amount (₹): *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={paymentData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount"
              min="1"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerName">Customer Name: *</label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={paymentData.customerName}
              onChange={handleInputChange}
              placeholder="Enter customer name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerEmail">Email: *</label>
            <input
              type="email"
              id="customerEmail"
              name="customerEmail"
              value={paymentData.customerEmail}
              onChange={handleInputChange}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerPhone">Phone Number: *</label>
            <input
              type="tel"
              id="customerPhone"
              name="customerPhone"
              value={paymentData.customerPhone}
              onChange={handleInputChange}
              placeholder="Enter 10-digit phone number"
              pattern="[0-9]{10}"
              maxLength="10"
              required
            />
          </div>

          <button 
            type="submit" 
            className="pay-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay ₹${paymentData.amount || '0'}`}
          </button>
        </form>

        {paymentStatus && (
          <div className={`payment-status ${paymentStatus.success ? 'success' : 'error'}`}>
            <h3>{paymentStatus.success ? '✅ Payment Successful!' : '❌ Payment Failed!'}</h3>
            <p>{paymentStatus.message}</p>
            {paymentStatus.orderId && (
              <p><strong>Order ID:</strong> {paymentStatus.orderId}</p>
            )}
            {paymentStatus.amount && (
              <p><strong>Amount:</strong> ₹{paymentStatus.amount}</p>
            )}
            {paymentStatus.status && (
              <p><strong>Status:</strong> {paymentStatus.status}</p>
            )}
          </div>
        )}

        <div className="info-section">
          <h3>💳 Live Payment Gateway</h3>
          <div style={{textAlign: 'left', margin: '10px 0'}}>
            <p><strong>Environment:</strong> Production</p>
            <p><strong>Currency:</strong> INR</p>
            <p><strong>Payment Methods:</strong> Cards, UPI, Net Banking, Wallets</p>
            <p><strong>Note:</strong> This will process real payments</p>
          </div>
        </div>

        <div className="debug-section">
          <h3>🔧 Debug Information</h3>
          <p><strong>Environment:</strong> Production</p>
          <p><strong>SDK Status:</strong> {cashfree ? '✅ Loaded' : '❌ Not Loaded'}</p>
        </div>
      </div>
    </div>
  );
}

export default App;