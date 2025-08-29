import React, { useState } from "react";
import { useNavigate } from "react-router";
import aitota3 from "./LandingComponents/assets/aitota1.png";
import aitota4 from "./LandingComponents/assets/aitota3.png";
import aitota5 from "./LandingComponents/assets/aitota4.png";
import aitota6 from "./LandingComponents/assets/aitota5.png";
import aitota7 from "./LandingComponents/assets/aitota6.png";

const Home = () => {
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: ""
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGetCall = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
  };

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        .glow-img { border-radius: 12px; animation: multiGlow 4s infinite; }
        .glow-mic { animation: multiGlow 4s infinite; }
        @keyframes multiGlow {
          0% { box-shadow: 0 0 20px 5px red; }
          25% { box-shadow: 0 0 25px 8px blue; }
          50% { box-shadow: 0 0 25px 8px limegreen; }
          75% { box-shadow: 0 0 25px 8px orange; }
          100% { box-shadow: 0 0 20px 5px violet; }
        }
      `}</style>
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-6 lg:px-16">
        <div className="flex items-center gap-8">
        <div className="text-2xl font-bold">Aitota</div>
        <nav className="hidden md:flex space-x-8">
          <a href="#home" className="hover:text-gray-300 transition-colors">Home</a>
          <a href="#about" className="hover:text-gray-300 transition-colors">About</a>
          <a href="#business" className="hover:text-gray-300 transition-colors">Business</a>
          <a href="#blog" className="hover:text-gray-300 transition-colors">Blog</a>
        </nav>
        </div>
        <button 
          onClick={handleGetStarted}
          className="bg-black border border-white text-white px-6 py-2 rounded hover:bg-white hover:text-black transition-colors"
        >
          Sign Up
        </button>
      </header>

      {/* Hero Section */}
      <section id="home" className="px-6 py-16 lg:px-12 lg:py-24">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Conversational AI for Businesses
      </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Aitota is revolutionizing communication with cutting-edge conversational AI, 
            connecting people and businesses with AI Voice.
          </p>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 md:gap-14 mb-12">
            {/* Click to Talk Button */}
            <div className="flex flex-col items-center">
              <button className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-400 transition-colors mb-2 glow-mic">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-sm text-gray-400">(Click to Talk)</span>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleGetCall} className="flex flex-col gap-3 sm:gap-4 w-full max-w-md">
              <div className="relative">
                <svg className="absolute ml-50 left-3 top-3 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter Your Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-1/2 pl-10 ml-45 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-white"
                  required
                />
              </div>
              <div className="relative">
                <svg className="absolute ml-50 left-3 top-3 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter Mobile Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-1/2 pl-10 ml-45 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-1/3 bg-blue-600 ml-60 text-white py-3 px-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get a Call
              </button>
            </form>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGetStarted}
              className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-black transition-colors"
            >
              Try For Free
            </button>
            <a
              href="https://web.whatsapp.com/send/?phone=8147540362&text=I%20want%20to%20enable%20my%20business%20with%20Aitota.%20My%20name%20is"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors flex items-center justify-center"
            >
              Get in Touch <span className="ml-2">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="px-6 lg:px-12 py-16">
        <div className="max-w-6xl mx-auto space-y-16 md:space-y-24">
          {/* Revolutionizing Communication */}
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
            <div className="lg:w-1/2 w-full flex justify-center">
              <img 
                src={aitota3} 
                alt="Revolutionizing Communication" 
                className="w-full h-auto max-h-72 md:max-h-96 lg:max-h-[28rem] object-contain rounded-lg glow-img"
              />
            </div>
            <div className="lg:w-1/2 w-full">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6">Revolutionizing Communication</h1>
              <p className="text-gray-300 mb-4 md:mb-6 text-base md:text-lg">
                Harness the power of Aitota's AI Voice for seamless, natural interactions 
                that transcend traditional barriers and connect people globally.
              </p>
              <div className="space-y-3 md:space-y-4">
                <button 
                  onClick={handleGetStarted}
                  className="bg-black border border-white text-white px-6 py-2 rounded hover:bg-white hover:text-black transition-colors"
                >
                  Get Started
                </button>
                
              </div>
            </div>
          </div>

          {/* Empowering Voices */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8 md:gap-12">
            <div className="lg:w-1/2 w-full flex justify-center">
              <img 
                src={aitota4} 
                alt="Empowering Voices" 
                className="w-full h-auto max-h-72 md:max-h-96 lg:max-h-[28rem] object-contain rounded-lg glow-img"
              />
            </div>
            <div className="lg:w-1/2 w-full">
              <h2 className="text-3xl font-bold mb-4">Empowering Voices</h2>
              <p className="text-gray-300 mb-4 md:mb-6 text-base md:text-lg">
                Aitota enhances every conversation with intuitive AI Voice solutions, 
                enabling effective and collaborative communication for individuals and businesses.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleGetStarted}
                  className="bg-black border border-white text-white px-6 py-2 rounded hover:bg-white hover:text-black transition-colors"
                >
                  Get Started
                </button>
                
              </div>
            </div>
          </div>

          {/* Cutting-Edge AI Technology */}
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
            <div className="lg:w-1/2 w-full flex justify-center">
              <img 
                src={aitota5} 
                alt="Cutting-Edge AI Technology" 
                className="w-full h-auto max-h-72 md:max-h-96 lg:max-h-[28rem] object-contain rounded-lg glow-img"
              />
            </div>
            <div className="lg:w-1/2 w-full">
              <h2 className="text-3xl font-bold mb-4">Cutting-Edge AI Technology</h2>
              <p className="text-gray-300 mb-4 md:mb-6 text-base md:text-lg">
                Leverage Aitota's advanced AI Voice systems for impactful, efficient communication, 
                ensuring your interactions are always innovative and effective.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleGetStarted}
                  className="bg-black border border-white text-white px-6 py-2 rounded hover:bg-white hover:text-black transition-colors"
                >
                  Get Started
                </button>
                
              </div>
            </div>
          </div>

          {/* Global Connectivity */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8 md:gap-12">
            <div className="lg:w-1/2 w-full flex justify-center">
              <img 
                src={aitota7} 
                alt="Global Connectivity" 
                className="w-full h-auto max-h-72 md:max-h-96 lg:max-h-[28rem] object-contain rounded-lg glow-img"
              />
            </div>
            <div className="lg:w-1/2 w-full">
              <h2 className="text-3xl font-bold mb-4">Global Connectivity</h2>
              <p className="text-gray-300 mb-4 md:mb-6 text-base md:text-lg">
                Bridge gaps and foster global collaboration with Aitota's AI Voice, 
                creating a world where every voice is heard and understood.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleGetStarted}
                  className="bg-black border border-white text-white px-6 py-2 rounded hover:bg-white hover:text-black transition-colors"
                >
                  Get Started
                </button>
                
              </div>
            </div>
          </div>

          {/* Seamless Integration Across Industries */}
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
          <div className="lg:w-1/2 w-full flex justify-center">
              <img 
                src={aitota6} 
                alt="Seamless Integration Across Industries" 
                className="w-full h-auto max-h-72 md:max-h-96 lg:max-h-[28rem] object-contain rounded-lg glow-img"
              />
            </div>
            <div className="lg:w-1/2 w-full">
              <h2 className="text-3xl font-bold mb-4">Seamless Integration Across Industries</h2>
              <p className="text-gray-300 mb-4 md:mb-6 text-base md:text-lg">
                Integrate Aitota's AI Voice into systems across education, health, transportation, 
                eCommerce, banking, and customer support, enhancing communication and driving success.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={handleGetStarted}
                  className="bg-black border border-white text-white px-6 py-2 rounded hover:bg-white hover:text-black transition-colors"
                >
        Get Started
      </button>
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-6 py-12 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Aitota */}
            <div>
              <h3 className="text-xl font-bold mb-4">Aitota</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              </ul>
            </div>

            {/* Office */}
            <div>
              <h3 className="text-xl font-bold mb-4">Office</h3>
              <div className="text-gray-400 space-y-2">
                <p>Head Office</p>
                <p>804, 5th Cross, 4th Block,<br />Koramangala, Bengaluru-560095</p>
                <p>contact@aitota.com</p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#blog" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="/admin" className="text-gray-400 hover:text-white transition-colors">Admin</a></li>
                <li><a href="#careers" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            {/* Legal Stuff */}
            <div>
              <h3 className="text-xl font-bold mb-4">Legal Stuff</h3>
              <ul className="space-y-2">
                <li><a href="#privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#refunds" className="text-gray-400 hover:text-white transition-colors">Refunds</a></li>
                <li><a href="#disclaimer" className="text-gray-400 hover:text-white transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm">
              Copyright © 2024 aitota. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
