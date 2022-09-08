import SpotifyLogo from '../assets/Spotify_Logo_RGB_Green.png';
import DefaultHeadshot from '../assets/default_headshot.png';
import { useState, useEffect, useContext } from 'react';
import { GlobalContext } from '../GlobalContext';
import {useNavigate} from 'react-router-dom';
import TinderCard from 'react-tinder-card';
import {useCookies} from 'react-cookie';
import { toast } from 'react-toastify';
import axios from 'axios';

function Profiles() {
    const [loading, setLoading] = useState(false);
    const [matchGenreUsers, setMatchGenreUsers] = useState(null);
    const [numberOfUsers, setNumberOfUsers] = useState(0);
    const [cookies, setCookie, removeCookie] = useCookies(null);

    const { user, addMatch, addSwipedLeft, addSwipedRight } = useContext(GlobalContext);

    useEffect(() => {
        getMatchGenre();
    }, []);

    const notifyWarning = (text) => toast.warning(text);

    let navigate = useNavigate();

    const clear = () => {
        notifyWarning("You need to login again!");
        removeCookie('UserId', cookies.UserId)
        removeCookie('AuthToken', cookies.AuthToken)
        navigate("/");
    }

    const notifySuccess = (text) => toast.success(text);

    const getMatchGenre = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/same-genre-users', {
                params: {  
                    big_object: JSON.stringify({
                        swiped_left: user.swiped_left, 
                        matches: user.matches, 
                        genres: user.genres, 
                        userId: cookies.UserId, 
                        swiped_right: user.swiped_right,
                    })
                }
            })
            
            setMatchGenreUsers(response.data);
            setNumberOfUsers(response.data.length);
        } catch (error) {
            clear();
        }
        setLoading(false);
    }

    const updateMatches = async (direction, match) => {
        const matchedUserId = match.user_id;
        const otherUser = match.first_name;
        const pic = match.picture;

        try {
            if(direction === "left") {
                await axios.put('/nomatch', {
                    userId: user.user_id,
                    matchedUserId
                });

                addSwipedLeft(matchedUserId);
                
                return;
            }

            const response = await axios.put('/addmatch', {
                userId: cookies.UserId,
                matchedUserId,
            });

            if(response.data) {
                addMatch(matchedUserId);
                notifySuccess(`Matched with ${otherUser}`);
            } else {
                addSwipedRight(matchedUserId);
            }

            setNumberOfUsers(numberOfUsers - 1);
        } catch (err) {
            clear()
        }
    }

  return (
    <div className="swipe-container">
        <div className="card-container">
            {matchGenreUsers ? (numberOfUsers > 0 ? matchGenreUsers.map(match =>
                <TinderCard
                    className="swipe"
                    preventSwipe={['up', 'down']}
                    key={match.user_id}
                    onSwipe={(direction) => updateMatches(direction, match)}>
                    <div className="card">
                        <img className="spotify-logo" src={SpotifyLogo} />
                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%'}}>
                            <img style={{height: '100px', width: '100px', borderRadius: '10%', objectFit: 'cover'}} src={match.picture === "none" ? DefaultHeadshot : match.picture} />
                            <div style={{textAlign: 'left'}}>
                                <h3>
                                    {match.first_name}
                                </h3>
                                <h4 style={{marginBottom: '15px'}}>
                                    {match.about}
                                </h4>
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
                                            <a style={{color: 'white'}} href={artist.spotify}>
                                                {artist.name}
                                            </a>
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
                                            <img style={{height: '100px', width: '100px', borderRadius: '50%', objectFit: 'cover'}} src={track.url.url} />
                                            <a style={{color: 'white'}} href={track.spotify}>
                                                {track.name}
                                            </a>
                                        </div>
                                    )}
                                </div> 
                            </>
                            : 
                            <h1 style={{marginTop: '100px', marginBottom: '100px'}}>No Top Tracks!</h1>
                        }
                        <p>Shared Genre Interests: </p>
                        <div className="genre">
                            {
                                match.genres.map(genre => {
                                    if(user.genres.includes(genre)) {
                                        return (
                                            <h3 style={{height: '30px', width: '90px', border: '2px solid white', borderRadius: '10px'}}>
                                                {genre}
                                            </h3>
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
                        loading 
                        ? 
                        <>
                            Loading . . .
                        </> 
                        : 
                        <>
                            <h1>
                                No profiles matching your genre interest!
                            </h1>
                            <button className="primary-button" onClick={getMatchGenre}>
                                Get More User Profiles!
                            </button>
                        </>
                    }
                </>
            ) 
            : 
            'Loading . . .'}
        </div>
    </div>
  )
}

export default Profiles