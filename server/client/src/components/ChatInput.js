import { useState} from 'react'
import axios from 'axios'

const ChatInput = ({ user, clickedUser, getUserMessages, getClickedUsersMessages, socket, room, setDescendingOrderMessages }) => {
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
            socket.emit("newMessage", {chatName: room, message: message, userId: userId});
            setTextArea("");
            await axios.post('/message', { message })
        } catch (error) {
            console.log(error)
        }
    }


    return (
        <div className="chat-input">
            <textarea value={textArea} onChange={(e) => setTextArea(e.target.value)} style={{resize: 'none', height: '80px'}}/>
            <button style={{marginTop: '15px'}} className="primary-button" onClick={addMessage}>Submit</button>
        </div>
    )
}

export default ChatInput