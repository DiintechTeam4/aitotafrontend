import MicIcon from '../MicIcon';
import './index.css'
import { FaChevronRight } from "react-icons/fa";


const VoiceBox=()=>{
    return(
         <div style={{textAlign:'center'}} className="Voice-box-container">
            <h1 className="Voice-header">Conversational AI for Businesses</h1>
            <p className='Voice-paragraph'>Aitota is revolutionizing communication with cutting-edge conversational AI,<br/> connecting people and businesses with AI Voice.</p>
            <MicIcon/>
         </div>
    )
}
export default VoiceBox