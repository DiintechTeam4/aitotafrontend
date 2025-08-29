// src/components/LandingPage.js

import React from 'react';
import BoxComponent from '../boxComponent';
import Logo from '../assets/aitota1.png'
import Logo2 from '../assets/aitota3.png';
import Logo4 from '../assets/aitota4.png';
import Logo5 from '../assets/aitota5.png';
import Logo6 from '../assets/aitota6.png';
import Logo7 from '../assets/aitota7.png'
// import Logo2 from 'assets/image2.png'
// import Logo3 from 'assets/image3.png'
// import Logo4 from 'assets/image4.png'
// import Logo5 from 'assets/image5.png'
// import Logo6 from 'assets/image6.png'
import MyNavbar from '../Navbar';

import FooterSection from '../Footer';
import './landingpage.css'
// import VoiceComponent from '../VoiceComponent';
import VoiceBox from '../VoiceComponent';
const content = {
  button: 'Start Now',
  order: 'box-order-2',
  image: { src: '', alt: 'Logo' },
  heading: 'Conversational AI for Businesses',
  paragraph: `Aitota is revolutionizing communication with cutting-edge conversational AI, connecting people and businesses with AI Voice.`
};

const content2 = {
  button: 'Get Started',
  order: 'box-order-1',
  image: { src: Logo, alt: 'Logo2' },
  heading: 'Revolutionizing Communication',
  paragraph: `Harness the power of Aitota's AI Voice for seamless,  natural interactions that transcend traditional barriers and connect people globally.`
};

const content3 = {
  button: 'Get Started',
  order: 'box-order-2',
  image: { src: Logo2, alt: 'Logo3' },
  heading: 'Empowering Voices',
  paragraph: `Aitota enhances every conversation with intuitive AI Voice solutions,  enabling effective and collaborative communication for individuals and businesses.`
};

const content4 = {
  button: 'Get Started',
  order: 'box-order-1', // Adjust this if you want a different order
  image: { src: Logo4, alt: 'Logo4' }, // Replace with the actual image source
  heading: 'Cutting-Edge AI Technology',
  paragraph: `Leverage Aitota's advanced AI Voice systems for impactful,  efficient communication, ensuring your interactions are always innovative and effective.`
};

const content5 = {
  button: 'Get Started',
  order: 'box-order-2', // Adjust this if you want a different order
  image: { src: Logo6, alt: 'Logo5' }, // Replace with the actual image source
  heading: 'Global Connectivity',
  paragraph: `Bridge gaps and foster global collaboration with Aitota’s AI Voice, creating a world where every voice is heard and understood.`
};

const content6 = {
  button: 'Get Started',
  order: 'box-order-1', // Adjust this if you want a different order
  image: { src: Logo5, alt: 'Logo6' }, // Replace with the actual image source
  heading: 'Seamless Integration Across Industries',
  paragraph: `Integrate Aitota’s AI Voice into systems across education, health, transportation, eCommerce, banking, and customer support, enhancing communication and driving success.`
};

  
  

const LandingPage2 = () => {
  return (
     <div className='landingpage'>
    <MyNavbar/>
    <VoiceBox/>
    <BoxComponent content={content2} />
    <BoxComponent content={content3} />
    <BoxComponent content={content4} />
    <BoxComponent content={content5} />
    <BoxComponent content={content6} />
    <FooterSection/>
    </div>
  );
};

export default LandingPage2;