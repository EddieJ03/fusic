import { useEffect, useState, useContext, useRef } from 'react';
import DefaultHeadshot from '../assets/default_headshot.png';
import { GlobalContext } from '../GlobalContext';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import ChatDisplay from './ChatDisplay';
import { toast } from 'react-toastify';
import ChatHeader from './ChatHeader';
import io from 'socket.io-client';
import axios from 'axios';

const ChatContainer = () => {
    const [loading, setLoading] = useState(false);
    const [matchedProfiles, setMatchedProfiles] = useState(null);
    const [cookies, setCookie, removeCookie] = useCookies(null);
    const [clickedUser, setClickedUser] = useState(null);
    const [descendingOrderMessages, setDescendingOrderMessages] = useState();

    useEffect(() => {
        getMatches();

        const newSocket = io.connect("https://fusic-app.herokuapp.com/");

        newSocket.emit('join', {userId: cookies.UserId});

        newSocket.on('message', ({message, user}) => {
            console.log(`${user} sent a message!`);
            newMessage(message, user);
        });

        setSocket(newSocket);

        return () => {
            newSocket.emit("leave", {userId: cookies.UserId});
            newSocket.close();
        }
    }, [])

    const notifyWarning = (text) => toast.warning(text);

    let navigate = useNavigate();

    const clear = () => {
        notifyWarning("You need to login again!");
        removeCookie('UserId', cookies.UserId)
        removeCookie('AuthToken', cookies.AuthToken)
        navigate("/");
    }

    const { user, setUser, setSocket } = useContext(GlobalContext);

    const mapping = useRef(new Map());

    const clicked = useRef(null);

    function newMessage(message, user) {
        if(user != cookies.UserId) {
            if(clicked.current && user === clicked.current.user_id) {
                const formattedMessage = {}
                formattedMessage['name'] = clicked.current.first_name
                formattedMessage['message'] = message.message
                formattedMessage['timestamp'] = message.timestamp
                formattedMessage['user'] = false
                setDescendingOrderMessages(prevState => [...prevState, formattedMessage]);
            } else {
                let index = mapping.current.get(user);
                console.log(index);
                setMatchedProfiles(existingItems => {
                    return [
                      ...existingItems.slice(0, index),
                      {...existingItems[index], newMessage: true},
                      ...existingItems.slice(index + 1),
                    ]
                })
            }
        }
    }

    const getMatches = async () => {
        setLoading(true);

        try {
            const response = await axios.get("/users", {
                params: { userIds: JSON.stringify(user.matches.map(({ user_id }) => user_id)), userId: cookies.UserId },
            });

            const userResponse = response.data.user;
            const matchesResponse = response.data.foundUsers;

            setUser(userResponse);
            setMatchedProfiles(matchesResponse.map((match, idx) => {
                return {
                    first_name: match.first_name, 
                    user_id: match.user_id, 
                    picture: match.picture, 
                    matches: match.matches, 
                    newMessage: userResponse.new_messages.includes(match.user_id), 
                    new_messages: match.new_messages
                }
            }));
    
            matchesResponse.forEach((item, idx) => mapping.current.set(item.user_id, idx));
        } catch(err) {
            clear();
        }

        setLoading(false);
    }

    return (
        <>
            <div className="chat-container">
                <ChatHeader user={user}/>
                {
                    loading ? 
                    <p style={{textAlign: 'center'}}>
                        Loading . . .
                    </p>
                    :
                    <div className="matches-display">
                        {matchedProfiles && matchedProfiles.map((match, _index) => (
                        <div
                            key={_index}
                            className="match-card"
                            onClick={() => {
                                setClickedUser(match)
                                clicked.current = match
                                let index = mapping.current.get(match.user_id);
                                setMatchedProfiles(existingItems => {
                                    return [
                                      ...existingItems.slice(0, index),
                                      {...existingItems[index], newMessage: false},
                                      ...existingItems.slice(index + 1),
                                    ]
                                })
                                if(user.new_messages.includes(match.user_id)) {
                                    axios.put("/update-new-message", {
                                        data: { matchId: match.user_id, userId: cookies.UserId },
                                    });
                                }
                            }}
                        >
                                <div className="match">
                                    <div className="img-container">
                                        <img src={match.picture === "none" ? DefaultHeadshot : match.picture} alt={match.first_name + " profile"} />
                                    </div>
                                    <h3 style={{marginLeft: '5px'}}>{match.first_name}</h3>
                                    {
                                        match.newMessage 
                                        ? 
                                        <div className="notification"></div> 
                                        : 
                                        <></>
                                    }
                                </div>
                        </div>
                        ))}
                    </div>
                }
            </div>
            {
                clickedUser ? 
                <ChatDisplay 
                    descendingOrderMessages={descendingOrderMessages} 
                    setDescendingOrderMessages={setDescendingOrderMessages} 
                    clickedUser={clickedUser} 
                    /> 
                : 
                <h1 style={{alignSelf: 'center', width: '69%'}}>Start By Clicking a Friend on the Left!</h1>
            }
        </>
    )
}

export default ChatContainer