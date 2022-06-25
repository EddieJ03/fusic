import { useRef } from 'react';

const Chat = ({descendingOrderMessages}) => {
    const chatContainer = useRef(null);
    return (
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
        </>
    )
}

export default Chat