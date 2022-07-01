import { useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'
import DefaultHeadshot from '../assets/default_headshot.png'

const ChatHeader = ({ user }) => {
    const [cookies, setCookie, removeCookie ] = useCookies(['user']);

    return (
        <div className="chat-container-header">
            <div className="profile">
                <div style={{marginTop: '5px'}} className="img-container">
                    <img src={user.picture === "none" ? DefaultHeadshot : user.picture} alt={"photo of " + user.first_name}/>
                </div>
                <h3 style={{marginLeft: '15px'}}>{user.first_name}</h3>
            </div>
        </div>
    )
}

export default ChatHeader