import TinderCard from 'react-tinder-card'
import {useEffect, useState} from 'react'
import ChatContainer from '../components/ChatContainer'
import {useNavigate} from 'react-router-dom'
import {useCookies} from 'react-cookie'
import { toast } from 'react-toastify';
import SpotifyLogo from '../assets/Spotify_Logo_RGB_Green.png'
import DefaultHeadshot from '../assets/default_headshot.png'
import Modal from 'react-modal';
import axios from 'axios'

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
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [matchGenreUsers, setMatchGenreUsers] = useState(null);
    const [lastDirection, setLastDirection] = useState()
    const [cookies, setCookie, removeCookie] = useCookies(null);
    const [modalIsOpen, setIsOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    function openModal() {
        setIsOpen(true);
    }

    function closeModal() {
        setIsOpen(false);
    }

    let navigate = useNavigate();

    const notify = () => toast.warning("You need to login again!");

    const clear = () => {
        notify();
        removeCookie('UserId', cookies.UserId)
        removeCookie('AuthToken', cookies.AuthToken)
        navigate("/");
    }
    
    useEffect(() => {
        if(!cookies.AuthToken || !cookies.UserId) {
            clear();
        }
        getUser();
    }, []);

    useEffect(() => {
        if (user) {
            getMatchGenre();
        }
    }, [user]);

    const getUser = async () => {
        try {
            await axios.get('/verify', {
                headers: {
                  Authorization: 'Bearer ' + cookies.AuthToken 
                }
            })

            const response = await axios.get('/user', {
                params: {userId: cookies.UserId}
            })

            if(!response.data.onboarded) navigate("/onboarding");

            setUser(response.data)
        } catch (error) {
            clear()
        }
    }
    
    const getMatchGenre = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/same-genre-users', {
                params: {genres: user?.genres}
            })
            setMatchGenreUsers(response.data)
        } catch (error) {
            console.log(error)
        }
        setLoading(false);
    }

    const updateMatches = async (matchedUserId) => {
        try {
            await axios.put('/addmatch', {
                userId: cookies.UserId,
                matchedUserId
            })
            getUser()
        } catch (err) {
            console.log(err)
        }
    }

    const swiped = (direction, swipedUserId) => {
        if (direction === 'right') {
            updateMatches(swipedUserId)
        }
        setLastDirection(direction)
    }

    const logout = () => {
        removeCookie('UserId', cookies.UserId)
        removeCookie('AuthToken', cookies.AuthToken)
        navigate("/");
    }

    const updateProfile = () => {
        navigate("/onboarding");
    }

    const deleteProfile = async () => {
        setDeleting(true);
        try {
            await axios.delete("/delete", {
                data: {
                    userId: cookies.UserId
                }
            });
            removeCookie('UserId', cookies.UserId)
            removeCookie('AuthToken', cookies.AuthToken)
            closeModal();
            navigate("/");
        } catch(err) {
            console.log(err);
        }
    }

    const matchedUserIds = user?.matches.map(({user_id}) => user_id).concat(cookies.UserId)

    const filteredGenre = matchGenreUsers?.filter(user => !matchedUserIds.includes(user.user_id));

    return (
        cookies.AuthToken && user && user.onboarded ? 
        <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
            <nav>
                <h1 style={{margin: '15px', fontSize: '2em'}}>Fusic</h1>
                <div style={{display: 'flex', flexDirection: 'row'}}>
                    <div className="nav-button" onClick={logout}>Logout</div>
                    <div className="nav-button" onClick={updateProfile}>Update</div>
                    <div className="nav-button" onClick={openModal}>Delete</div>
                    <Modal
                        closeTimeoutMS={100}
                        isOpen={modalIsOpen}
                        onRequestClose={closeModal}
                        style={customStyles}
                        contentLabel="Example Modal"
                    >
                        {
                            deleting ? 
                            <h1>Deleting. . .</h1>
                            :
                            <>
                                <h1>Are you sure you want to delete your account?</h1>
                                <p>This action will permenanently remove all your information including any messages with others.</p>
                                <button onClick={closeModal}>No</button>
                                <button onClick={deleteProfile}>Yes</button>
                            </>
                        }
                    </Modal>
                </div>
            </nav>
            <div style={{flexGrow: '1'}} className="dashboard">
                <ChatContainer user={user}/>
                <div className="swipe-container">
                    <div>
                        {lastDirection ? <p>You swiped {lastDirection}</p> : <p/>}
                    </div>
                    <div className="card-container">
                        {filteredGenre ? (filteredGenre.length > 0 ? filteredGenre.map(match =>
                            <TinderCard
                                className="swipe"
                                preventSwipe={['up', 'down']}
                                key={match.user_id}
                                onSwipe={(dir) => swiped(dir, match.user_id)}>
                                <div className="card">
                                    <img src={SpotifyLogo} style={{height: '30px', width: 'auto', alignSelf: 'flex-end', marginRight: '20px'}}/>
                                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%'}}>
                                        <img style={{height: '100px', width: '100px', borderRadius: '10%', objectFit: 'cover'}} src={match.picture === "none" ? DefaultHeadshot : match.picture}/>
                                        <div style={{textAlign: 'left'}}>
                                            <h3>{match.first_name}</h3>
                                            <h4 style={{marginBottom: '15px'}}>{match.about}</h4>
                                        </div>
                                    </div>
                                    {
                                        match.artists.length > 0 ? 
                                        <>
                                            <h3 style={{marginTop: '25px'}}>Top Artists!</h3>
                                            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', width: '100%'}}>
                                                {match.artists.map((artist, idx) => 
                                                    <div key={idx} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px'}}>
                                                        <img style={{height: '100px', width: '100px', borderRadius: '50%', objectFit: 'cover'}} src={artist.url.url}/>
                                                        <a style={{color: 'white'}} href={artist.spotify}>{artist.name}</a>
                                                    </div>

                                                )}
                                            </div> 
                                        </>
                                        : 
                                        <h1 style={{marginTop: '100px'}}>No Top Artists!</h1>
                                    }
                                    {
                                        match.tracks.length > 0 ? 
                                        <>
                                            <h3 style={{marginTop: '25px'}}>Top Tracks!</h3>
                                            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', width: '100%'}}> 
                                                {match.tracks.map((track, idx) => 
                                                    <div key={idx} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px'}}>
                                                        <img style={{height: '100px', width: '100px', borderRadius: '50%', objectFit: 'cover'}} src={track.url.url}/>
                                                        <a style={{color: 'white'}} href={track.spotify}>{track.name}</a>
                                                    </div>
                                                )}
                                            </div> 
                                        </>
                                        : 
                                        <h1 style={{marginTop: '100px', marginBottom: '100px'}}>No Top Tracks!</h1>
                                    }
                                    <p>Shared Genre Interests: </p>
                                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around', width: '100%', flexWrap: 'wrap'}}>
                                        {
                                            match.genres.map(genre => {
                                                if(user.genres.includes(genre)) {
                                                    return (
                                                        <h3 style={{height: '30px', width: '90px', border: '2px solid white', borderRadius: '10px'}}>{genre}</h3>
                                                    )
                                                }
                                            })
                                        }
                                    </div>
                                </div>
                            </TinderCard>
                            ) : 
                            <>
                                {
                                    loading ? <>Loading . . .</> : 
                                    <>
                                    <h1>
                                        No profiles matching your genre interest!
                                    </h1>
                                    <button className="primary-button" onClick={getMatchGenre}>Get More User Profiles!</button>
                                    </>
                                }
                            </>
                        ) : 'Loading . . .'}
                    </div>
                </div>
            </div>
        </div> : 
        <></>
    )
}
export default Dashboard
