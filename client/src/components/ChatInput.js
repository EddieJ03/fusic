
import { GlobalContext } from '../GlobalContext';
import { useState, useContext } from 'react';
import axios from 'axios';

const ChatInput = ({ clickedUser, setDescendingOrderMessages }) => {
    const { user, socket } = useContext(GlobalContext);
    const [textArea, setTextArea] = useState("")
    const userId = user?.user_id
    const clickedUserId = clickedUser?.user_id

    const addMessage = async () => {
        const message = {
            timestamp: new Date().toISOString(),
            from_userId: userId,
            to_userId: clickedUserId,
            message: textArea,
            user: true
        }

        setDescendingOrderMessages(prevState => [...prevState, message]);

        try {
            socket.emit("newMessage", {message: message, userId: userId, clickedUserId: clickedUserId});
            setTextArea("");
            await axios.post('/message', { message })
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="chat-input">
            <input 
                value={textArea} 
                onChange={(e) => setTextArea(e.target.value)} 
                style={{resize: 'none', height: '40px', fontSize: '20px', width: '80%'}} 
                />
            <button className="primary-button" style={{marginLeft: '15px'}} onClick={addMessage}>
                SEND
            </button>
        </div>
    )
}

export default ChatInput