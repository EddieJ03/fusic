import ResponsiveAppBar from '../components/ResponsiveAppBar';
import ChatContainer from '../components/ChatContainer';
import { useEffect, useState, useContext } from 'react';
import { GlobalContext } from '../GlobalContext';
import { useNavigate } from 'react-router-dom';
import Profiles from '../components/Profiles';
import { useCookies } from 'react-cookie';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import axios from 'axios';

Modal.setAppElement('#root');

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width:'300px',
        borderRadius: '15px',
        backgroundColor: '#14397d',
        color: 'white'
    },
};

const Dashboard = () => {
    const [cookies, setCookie, removeCookie] = useCookies(null);
    const [modalIsOpen, setIsOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [chat, setChat] = useState(false);

    const { user, setUser } = useContext(GlobalContext);    
    
    useEffect(() => {
        if(!cookies.AuthToken || !cookies.UserId) {
            clear();
            return;
        }

        if(!user) {
            getUser();
        }
    }, []);

    function closeModal() {
        setIsOpen(false);
    }

    let navigate = useNavigate();

    const notifyWarning = (text) => toast.warning(text);

    const clear = () => {
        notifyWarning("You need to login again!");
        removeCookie('UserId', cookies.UserId)
        removeCookie('AuthToken', cookies.AuthToken)
        removeCookie('MatchesLength', cookies.MatchesLength)
        navigate("/");
    }

    const getUser = async () => {
        try {
            const response = await axios.get('/user', {
                params: {userId: cookies.UserId}
            })

            if(!response.data.onboarded) navigate("/onboarding");

            setUser(response.data)
        } catch (error) {
            console.log(error)
            clear();
        }
    }

    const deleteProfile = async () => {
        setDeleting(true);
        try {
            await axios.delete("/delete", {
                data: {
                    userId: cookies.UserId,
                }
            });
            removeCookie('UserId', cookies.UserId)
            removeCookie('AuthToken', cookies.AuthToken)
            navigate("/");
        } catch(err) {
            clear();
        }
    }

    return (
        cookies.AuthToken && user && user.onboarded ? 
            <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
                <Modal
                    closeTimeoutMS={100}
                    isOpen={modalIsOpen}
                    onRequestClose={closeModal}
                    style={customStyles}
                    shouldCloseOnOverlayClick={false}
                    contentLabel="Example Modal"
                >
                    {
                        deleting ? 
                        <h1>Deleting . . .</h1>
                        :
                        <>
                            <h1>Are you sure you want to delete your account?</h1>
                            <p>This action will permenanently remove all your information including any messages with others.</p>
                            <button className="secondary-button" onClick={closeModal}>No</button>
                            <button className="primary-button" onClick={deleteProfile}>Yes</button>
                        </>
                    }
                </Modal>
                <ResponsiveAppBar setIsOpen={setIsOpen} user={user} setChat={setChat} />
                <div style={{flexGrow: '1'}} className="dashboard">
                    {
                        chat ? 
                        <ChatContainer />
                        :
                        <Profiles />
                    }
                </div>
            </div> 
        : 
            <>Loading . . .</>
    )
}

export default Dashboard
