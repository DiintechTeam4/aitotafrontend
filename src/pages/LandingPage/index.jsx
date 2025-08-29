import { GoogleLogin, GoogleOAuthProvider} from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

import './index.css'; 

// import { dataContext } from '../../Context/data';

const LandingPage=()=>{
    const navigate=useNavigate();
    const [showModal,setShowModal]=useState(false);
    const [number,setNumber]=useState("");
    const currentYear= new Date().getFullYear();
    const [address,setAddress]=useState("");
    const [email,setEmail]=useState("");
    const [businessName,setBusinessName]=useState("");
    const [signInModal,setSignInModal]=useState(false);
    const [isPlaying,setIsPlaying]=useState(false);
    const [showDrawer,setShowDrawer]=useState(false);
    const [isOpen,setIsOpen] = useState(false);
    // const videoRef=useRef();
    const footerItems=[
        {header:"Aitota",subHeaders:[{title:"About Us",path:""}]},
        {header:"Office",subHeaders:[{title:"Head Office",path:"",par:{one : '804, 5th Cross, 4th Block,',two:'Koramangala, Bengaluru-560095'}}]},
        {header:"Quick Links",subHeaders:[{title:"Blog",path:""},{title:"Admin",path:"/admin"},{title:"Careers",path:""}]},
        {header:"Legal Stuff",subHeaders:[{title:"Privacy Policy",path:"/privacy-policy"},{title:"Terms of Service",path:"/terms-conditions"},{title:"Refunds",path:"/refunds"},{title:"Disclaimer",path:"/disclaimer"},]},
    ]

    const h3Style = {
        fontSize: '1.31em', /* Typical font-size for h3 */
        fontWeight: 'bold', /* h3 is typically bold */
        marginTop: '1em', /* Top margin for spacing */
        marginBottom: '1em', /* Bottom margin for spacing */
        lineHeight: '1.25', /* Adjust line-height for readability */
        cursor: 'pointer', /* Add cursor pointer to indicate clickability */
    };


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
            if(data.exist===true && data.regstatus==="approved")
                return true;
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


    const checkAdmin = async (email) => {
        try{
            const options = {
                method : "POST",
                headers : {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify({email})
            }
            const response = await fetch(`${process.env.REACT_APP_API_URL}/checkadmin`,options);
            const data = await response.json();
            console.log(data);
            if(data.exist===true)
                return true;
            else
            return false;
        }
        catch(Err){
            console.log(`Error Occurred : ${Err}`);
        }
    }

    const checkSubAdmin = async (email) => {
        try{
            const options = {
                method : "POST",
                headers : {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify({email})
            }
            const response = await fetch(`${process.env.REACT_APP_API_URL}/checksubadmin`,options);
            const data = await response.json();
            console.log(data);
            if(data.exist===true)
                return true;
            else
            return false;
        }
        catch(Err){
            console.log(`Error Occurred : ${Err}`);
        }
    }

    
    return(
        <>
       
       
        </>
    )
}

export default LandingPage;