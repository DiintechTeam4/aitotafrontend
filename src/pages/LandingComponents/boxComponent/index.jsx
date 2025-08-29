// src/components/BoxComponent.js

import React from 'react';
import './index.css'; // Ensure you have this CSS file for styling
import { GoogleOAuthProvider,GoogleLogin } from '@react-oauth/google';
import Popup from 'reactjs-popup';
import { useNavigate } from 'react-router-dom';

const BoxComponent = ({ content }) => {
  const { image, heading, paragraph, order,button } = content;
  const navigate = useNavigate();
 

  return (
    <div className="Box-container">
      <div className={`Box-content ${order}`}>
        <h1 className="Box-header">{heading}</h1>
        <p  className='Box-Paragraph'>{paragraph}</p>
        <div className="landing-buttons">
        <button className="start-button" onClick={()=>navigate('/auth')}>{button}</button>
      
  
        </div>
      </div>
      <div className='Box-content'>
        <div className='image-box' >
         <img className='box-image' src={image.src} alt={image.alt} />
        </div>
      </div>
   
    </div>
  );
};

export default BoxComponent;