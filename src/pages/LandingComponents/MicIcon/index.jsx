import './index.css'
import { GoogleLogin,GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { FaGreaterThan } from "react-icons/fa";
import Popup from 'reactjs-popup';
import {useState, useEffect} from 'react'
import { FiUser } from "react-icons/fi";
import { MdMailOutline, MdOutlineMailOutline } from "react-icons/md";
import { VscCallOutgoing } from "react-icons/vsc";

const MicIcon=()=>{
  const navigate = useNavigate();
  const [bgClass, setBgClass] = useState('1');
  const [username,setUsername] = useState('');
  const [useremail, setUserEmail] = useState('');
  const [userMobileNo, setUserMobileNo] = useState('');

  const onCallNow = (e) => {
    e.preventDefault();
    console.log({
      username,
      userMobileNo
    });
    setUsername('');
    setUserMobileNo('');
  }


      useEffect(() => {
          // Define an array of background color classes
          const colors = ['1','2','3','4','5','6','7','8','9','10','11','12'];
          // Randomly select one color class
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          console.log(randomColor);
          // Set the background color class
          setBgClass(randomColor);
      }, []);

    return(
      <div style={{marginTop:'0',textAlign:'center',width:'100%'}} className="Voice-box-container">
        <div className='micicon-flex-container'>
        <div className='mic-icon-combined'>
          <div style={{display:'flex',justifyContent:'center'}}> 
          <div className={`mic mic${bgClass} mb-2`}>
            <i className="mic-icon"></i>
            <div className="mic-shadow"></div>
          </div>
          </div>
          <div style={{display:'flex',justifyContent:'center'}}>
            <p className='click-to-talk'>Click to Talk</p>
          </div>
          </div>
          <div className='phone-call-container'>
            <form onSubmit={onCallNow}>
              <div className='mi-form-input-container'>
                <label className='mi-form-label' htmlFor='username'><FiUser/></label>
                <input value={username} placeholder='Enter Your Name' id="username" type="text" className='mi-form-input' onChange={(e) => setUsername(e.target.value)} required/>
              </div>
              {/* <div className='mi-form-input-container'>
                <label className='mi-form-label' htmlFor='useremail'><MdMailOutline/></label>
                <input placeholder='Enter Email' id="useremail" type="text" className='mi-form-input' onChange={(e) => setUserEmail(e.target.value)} />
              </div> */}
              <div className='mi-form-input-container'>
                <label className='mi-form-label' htmlFor='usermobileno'><VscCallOutgoing/></label>
                <input value={userMobileNo} placeholder='Enter Mobile Number' id="usermobileno" type="tel" className='mi-form-input' onChange={(e) => setUserMobileNo(e.target.value)} required />
              </div>
              <button className='mi-form-submit-button' type="submit">Get a Call</button>
            </form>
          </div>
          </div>
      <div className="mic-icon-flexi mx-auto">
    <div className="mic-icon-flexi mt-5">
    <button className="try-button mt-2 mr-5" style={{width:'220px'}} type="button">Try For Free</button>
      {/* <Popup
        trigger={<button className="try-button mt-2 mr-5" style={{width:'220px'}} type="button">Try For Free</button>}
        modal
        nested
      >
        {close => (
          <div className="flex flex-col justify-center p-5 text-center bg-white w-[400px] h-[400px] rounded-md ytpa-modal ytpa-custom-popup">
            <h1>Sign Up</h1>
            <div className="ytpa-content ytpa-popup-cont">
              <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    navigate("/overview");
                  }}
                  onError={() => {
                    console.log("Login Failed");
                  }}
                />
              </GoogleOAuthProvider>
              <a
                href={`https://web.whatsapp.com/send/?phone=8147540362&text=I want to enable my business with Aitota. My name is `}
                target="_blank"
                rel="noopener noreferrer"
                className="talk-wrapper google-signup-container mt-2 flex items-center"
              >
                <img src="whatsapp-icon.png" alt="whatsapp" className="signup-google-image mr-2" />
                <p>Talk to Us</p>
              </a>
            </div>
            <div className="ytpa-actions">
              <button
                className="bg-red-600 p-2 rounded text-white mt-2"
                onClick={() => {
                  close();
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Popup> */}
      <a style={{fontSize:'20px',textDecoration:'none',color:'white'}}
        href={`https://web.whatsapp.com/send/?phone=8147540362&text=I want to enable my business with Aitota. My name is `}
        target="_blank"
        rel="noopener noreferrer"
        className="talk-wrapper google-signup-container mt-2 flex items-center ml-auto"
      >
        <p style={{textDecoration:'underline'}}>Get in Touch &gt; </p>
      </a>
    </div>
    </div>
      </div>
    )
}
export default MicIcon;