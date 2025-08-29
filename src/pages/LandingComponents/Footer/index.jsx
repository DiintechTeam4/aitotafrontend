import React from 'react';
import './footersection.css'; // Assuming you have a CSS file for styling
// import TradeMark from '../../assets/img10.png'
// import Popup from 'reactjs-popup';
// import Cookies from 'js-cookie';
import { GoogleOAuthProvider,GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
// import CryptoJS from 'crypto-js';



const FooterSection = () => {
    const navigate = useNavigate();
    

  return (
    <div style={{marginTop:"20px",backgroundColor:'black'}} className='landing-footer'>
                <div className='footer-items'>
                <div className="footer-col">
                <h3>Aitota</h3>
                <div className="footer-col-item">
                    <p><a href="/about">About</a></p>
                </div>
            </div>
            <div className="footer-col">
                <h3>Office</h3>
                <div className="footer-col-item">
                    <p><a href="">Head Office</a></p>
                    <p className="mt-2 mb-2">804, 5th Cross, 4th Block,</p>
                    <p className="mt-2 mb-2">Koramangala, Bengaluru-560095</p>
                    <p className='mt-2 mb-2'>contact@aitota.com</p>
                    
                </div>
            </div>
            <div className="footer-col">
                <h3>Quick Links</h3>
                <div className="footer-col-item">
                    <p><a href="https://aitota.blogspot.com/2024/08/aitota.html">Blog</a></p>
                    {/* <p><a href="/admin">Admin</a></p> */}
                    {/*<button className="bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition-colors duration-300" type="button">Admin</button>  */}
                    <p><a href="/admin">Admin</a></p>
                
                    
                    <p><a href="">Careers</a></p>
                </div>
            </div>
            <div className="footer-col">
                <h3>Legal Stuff</h3>
                <div className="footer-col-item">
                    <p><a href="/privacy-policy">Privacy Policy</a></p>
                    <p><a href="/terms-conditions">Terms of Service</a></p>
                    <p><a href="/refunds">Refunds</a></p>
                    <p><a href="/disclaimer">Disclaimer</a></p>
                </div>
            </div>
                </div>
                <div className='footer-bottom'>
                <p className="copyright">
                    Copyright © 2024 aitota. All Rights Reserved. 
                </p>
                </div>
                
            </div>
  );
};

export default FooterSection;