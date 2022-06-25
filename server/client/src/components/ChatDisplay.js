import io from 'socket.io-client'
import ChatInput from './ChatInput'
import axios from 'axios'
import { useState, useEffect, useRef } from "react"


const ChatDisplay = ({ user , clickedUser }) => {
    const userId = user?.user_id
    const clickedUserId = clickedUser?.user_id
    const [usersMessages, setUsersMessages] = useState(null);
    const [clickedUsersMessages, setClickedUsersMessages] = useState(null);
    const [loading, setLoading] = useState(false);
    const [room, setRoom] = useState("");
    const [descendingOrderMessages, setDescendingOrderMessages] = useState();

    // initialize socket
    const [socket, setSocket] = useState(null);

    const chatContainer = useRef([]);

    useEffect(() => {
        setLoading(true);
        getUsersMessages();
        getClickedUsersMessages();

        const newSocket = io.connect("http://localhost:8000");

        setSocket(newSocket);

        newSocket.emit("joinChat", {userId, clickedUserId});

        newSocket.on('roomName', (data) => {
            setRoom(data);
        });

        newSocket.on('message', ({message, user}) => {
            if(user != userId) {
                const formattedMessage = {}
                formattedMessage['name'] = clickedUser?.first_name
                formattedMessage['img'] = clickedUser?.url
                formattedMessage['message'] = message.message
                formattedMessage['timestamp'] = message.timestamp
                formattedMessage['user'] = false
                setDescendingOrderMessages(prevState => [...prevState, formattedMessage]);
            }
        });

        return () => newSocket.close();
    }, [])

    useEffect(() => {
        if(descendingOrderMessages && descendingOrderMessages.length > 20) {
            console.log(chatContainer.current);
            chatContainer.current.scrollTop = chatContainer.current.scrollHeight;
        }
    }, [descendingOrderMessages])

    useEffect(() => {
        setDescendingOrderMessages([]);
        let messages = [];

        usersMessages?.forEach(message => {
            const formattedMessage = {}
            formattedMessage['name'] = user?.first_name;
            formattedMessage['img'] = user?.url;
            formattedMessage['message'] = message.message
            formattedMessage['timestamp'] = message.timestamp
            formattedMessage['user'] = true
            messages.push(formattedMessage)
        })
    
        clickedUsersMessages?.forEach(message => {
            const formattedMessage = {}
            formattedMessage['name'] = clickedUser?.first_name
            formattedMessage['img'] = clickedUser?.url
            formattedMessage['message'] = message.message
            formattedMessage['timestamp'] = message.timestamp
            formattedMessage['user'] = false
            messages.push(formattedMessage)
        })

        messages = messages.sort((a,b) => a.timestamp.localeCompare(b.timestamp));

        setDescendingOrderMessages(prevState => [...prevState, ...messages]);
    }, [usersMessages, clickedUsersMessages])

    const getUsersMessages = async () => {
        try {
            const response = await axios.get('/messages', {
                params: { userId: userId, correspondingUserId: clickedUserId }
            })
            setUsersMessages(response.data);
        } catch (error) {
            console.log(error)
        }
    }

    const getClickedUsersMessages = async () => {
        try {
            const response = await axios.get('/messages', {
                params: { userId: clickedUserId , correspondingUserId: userId }
            })
            setClickedUsersMessages(response.data);
        } catch (error) {
            console.log(error)
        }
        setLoading(false);
    }

    return (
        loading || !descendingOrderMessages 
        ? 
        <div style={{textAlign: 'center'}}>Loading. . .</div>
        :
        <>
            <div className="chat-display" ref={chatContainer}>
                {descendingOrderMessages.map((message, _index) => (
                    <div key={_index}>
                            <div style={{display: 'flex', justifyContent: message.user ? 'flex-end' : 'flex-start'}} >
                                <p style={{backgroundColor: message.user ? '#add8e6' : 'red', height: '20px', textAlign: message.user ? 'right' : 'left', borderRadius: '10px', padding: '10px'}}>
                                    {message.message}
                                </p>
                            </div>
                    </div>
                ))}
            </div>
            <ChatInput
                user={user}
                socket={socket}
                room={room}
                clickedUser={clickedUser} getUserMessages={getUsersMessages} getClickedUsersMessages={getClickedUsersMessages} setDescendingOrderMessages={setDescendingOrderMessages}/>
        </>
    )
}

export default ChatDisplay