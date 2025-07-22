import React from "react";
import { useNavigate } from "react-router";

const Home = () => {
    const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-100 to-blue-200 p-6">
      
      <h1 className="text-5xl font-extrabold text-indigo-700 mb-6 text-center">
        Welcome to My Website
      </h1>

      <p className="text-lg text-indigo-600 max-w-xl text-center mb-8">
        This is a simple landing page built with React and Tailwind CSS. 
        Customize it to match your brand and start building amazing experiences!
      </p>

      <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-indigo-700 transition duration-300"
      onClick={()=>navigate('/auth')}>
        Get Started
      </button>

    </div>
  );
};

export default Home;
