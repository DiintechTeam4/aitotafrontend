import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import './index.css';
import Popup from 'reactjs-popup';
import { GoogleOAuthProvider,GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';



const MyNavbar = () => {
  const navigate = useNavigate();


  const checkUser = async (email) => {
    try{
        const options = {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify({email})
        }
        const response = await fetch(`${process.env.REACT_APP_API_URL}/checkuser`,options);
        const data = await response.json();
        console.log(data);
        if(data.exist===true && data.regstatus==="approved"){
          // loginUser(data.user);
            return true;
        }
        else if(data.exist===true && data.regstatus==="pending"){
            return "pending";
        }
        else if(data.exist===true && data.regstatus==="rejected"){
            return "rejected";
        }
        else
        return false;
    }
    catch(Err){
        console.log(`Error Occurred : ${Err}`);
    }
  }

  return (
    <Navbar bg="transparent" expand="lg">
      <Container style={{width:'100%',backgroundColor:'black'}}>
        <Navbar.Brand as={Link} to="/" className="text-white navbar-brand-custom d-flex align-items-center">
          Aitota
        </Navbar.Brand>
        <Nav.Link as={Link} to="/help" className="text-white d-flex align-items-center small-btn-custom " style={{ fontSize: '20px' }}>
              <FontAwesomeIcon icon={faWhatsapp} style={{ color: '#25D366', fontSize: '21px', marginRight: '8px' }} />
              Help
            </Nav.Link>
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-toggle-custom" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/about" className="text-white nav-link-custom">Home</Nav.Link>
            <Nav.Link as={Link} to="/about" className="text-white nav-link-custom">About</Nav.Link>
            <Nav.Link as={Link} to="/business" className="text-white nav-link-custom">Business</Nav.Link>
            <Nav.Link style={{textDecoration:'none',color:'white'}} as={Link} to="/blogs" className="text-white nav-link-custom">Blog</Nav.Link>
          </Nav>
          <Nav>
          {/* <Nav.Link className="text-white d-flex align-items-center btn-custom " style={{ fontSize: '20px' }}>
              <FontAwesomeIcon icon={faWhatsapp} style={{ color: '#25D366', fontSize: '21px', marginRight: '8px' }} />
              Help
            </Nav.Link> */}
            <button className='signup-button' onClick={()=>navigate('/auth')}>Sign Up</button>
          
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default MyNavbar;