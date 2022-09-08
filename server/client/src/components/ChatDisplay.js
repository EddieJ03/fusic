import ChatInput from './ChatInput'
import axios from 'axios'
import { useState, useEffect, useRef, useContext } from "react"
import { toast } from 'react-toastify';
import {useNavigate} from 'react-router-dom';
import {useCookies} from 'react-cookie';
import {GlobalContext} from '../GlobalContext'

const ChatDisplay = ({ clickedUser, descendingOrderMessages, setDescendingOrderMessages }) => {
    const { user } = useContext(GlobalContext);
    const [usersMessages, setUsersMessages] = useState(null);
    const [clickedUsersMessages, setClickedUsersMessages] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cookies, setCookie, removeCookie] = useCookies(null);

    const chatContainer = useRef([]);

    const userId = user?.user_id
    const clickedUserId = clickedUser?.user_id

    useEffect(() => {
        setLoading(true);
        getUsersMessages();
        getClickedUsersMessages();
    }, [])

    useEffect(() => {
        if(descendingOrderMessages && descendingOrderMessages.length > 15) {
            chatContainer.current.scrollTop = chatContainer.current.scrollHeight;
        }
    }, [descendingOrderMessages])

    useEffect(() => {
        setDescendingOrderMessages([]);
        let messages = [];

        usersMessages?.forEach(message => {
            const formattedMessage = {}
            formattedMessage['name'] = user?.first_name;
            formattedMessage['message'] = message.message
            formattedMessage['timestamp'] = message.timestamp
            formattedMessage['user'] = true
            messages.push(formattedMessage)
        })
    
        clickedUsersMessages?.forEach(message => {
            const formattedMessage = {}
            formattedMessage['name'] = clickedUser?.first_name
            formattedMessage['message'] = message.message
            formattedMessage['timestamp'] = message.timestamp
            formattedMessage['user'] = false
            messages.push(formattedMessage)
        })

        messages = messages.sort((a,b) => a.timestamp.localeCompare(b.timestamp));

        setDescendingOrderMessages(prevState => [...prevState, ...messages]);
    }, [usersMessages, clickedUsersMessages])

    const notifyWarning = (text) => toast.warning(text);

    let navigate = useNavigate();

    const clear = () => {
        notifyWarning("You need to login again!");
        removeCookie('UserId', cookies.UserId)
        removeCookie('AuthToken', cookies.AuthToken)
        removeCookie('MatchesLength', cookies.MatchesLength)
        navigate("/");
    }

    const getUsersMessages = async () => {
        try {
            const response = await axios.get('/messages', {
                params: { userId: userId, correspondingUserId: clickedUserId }
            })
            setUsersMessages(response.data);
        } catch (error) {
            clear();
        }
    }

    const getClickedUsersMessages = async () => {
        try {
            const response = await axios.get('/messages', {
                params: { userId: clickedUserId , correspondingUserId: userId }
            })
            setClickedUsersMessages(response.data);
        } catch (error) {
            clear();
        }
        setLoading(false);
    }

    return (
        <div className="chat-display-container">
            {
                loading || !descendingOrderMessages 
                ? 
                <div style={{textAlign: 'center'}}>
                    Loading . . .
                </div>
                :
                <>
                    <div className="chat-display" ref={chatContainer}>
                        <div>
                            Messages with {clickedUser.first_name}
                        </div>
                        {descendingOrderMessages.map((message, _index) => (
                            <div key={_index}>
                                    <div style={{display: 'flex', 
                                                 justifyContent: message.user ? 'flex-end' : 'flex-start'}}>
                                        <p style={{backgroundColor: message.user ? '#add8e6' : 'red', 
                                                   height: '20px', 
                                                   textAlign: message.user ? 'right' : 'left', 
                                                   borderRadius: '10px', 
                                                   padding: '10px', 
                                                   margin: '5px'}}>
                                            {message.message}
                                        </p>
                                    </div>
                            </div>
                        ))}
                    </div>
                    <ChatInput
                        clickedUser={clickedUser} 
                        setDescendingOrderMessages={setDescendingOrderMessages}
                        />
                </>
            }
        </div>
    )
}

export default ChatDisplay