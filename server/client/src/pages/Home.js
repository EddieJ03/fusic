import {useState,useEffect} from 'react'
import {useCookies} from "react-cookie"
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import spotifyApi from '../constants/SpotifyWebApi.js'

const AUTH_URL = `${process.env.REACT_APP_URL}`;

const Home = ({ setExpiresIn, setRefreshToken, setAccessToken }) => {
    const [loading, setLoading] = useState(null);
    const [cookies, setCookie, removeCookie] = useCookies(['user']);

    let location = useLocation();
    let navigate = useNavigate();

    useEffect(() => {
        if(cookies.AuthToken && cookies.UserId) navigate("/onboarding");

        if(location.search.includes("code")) {
            Authentication();
        }
    }, [location])

    const Authentication = async () => {
        try {
            let code = location.search.split("code")[1].substring(1);

            setLoading(true);

            let res = await axios.post("/spotify", {
                code: code
            })

            spotifyApi.setAccessToken(res.data.accessToken);
            setAccessToken(res.data.accessToken);
            setExpiresIn(res.data.expiresIn);
            setRefreshToken(res.data.refreshToken);

            let artistData = await spotifyApi.getMyTopArtists({ limit: 3, offset: 0 });

            artistData = artistData.body.items;

            let topArtists = [];

            for(let i = 0; i < artistData.length; i++) {
                let artist = { name: artistData[i].name, url: artistData[i].images[0], spotify: artistData[i].external_urls.spotify };
                topArtists.push(artist);
            }

            let topTracksData = await spotifyApi.getMyTopTracks({ limit: 3, offset: 0 });
            
            topTracksData = topTracksData.body.items;

            let topTracks = [];

            for(let i = 0; i < topTracksData.length; i++) {
                let track = { name: topTracksData[i].name, url: topTracksData[i].album.images[0], spotify: topTracksData[i].external_urls.spotify };              
                topTracks.push(track);
            }

            let data = await spotifyApi.getMe();
            
            res = await axios.post("/authenticate", {
                email: data.body.email,
                username: data.body.display_name,
                id: data.body.id,
                artists: topArtists,
                tracks: topTracks,
                picture: data.body.images.length === 0 ? "none" : data.body.images[0].url
            })
    
            setCookie('AuthToken', res.data.token);
            setCookie('UserId', res.data.userId);

            if(res.data.onboarded) {
                setLoading(false);
                navigate('/dashboard');
            } else {
                setLoading(false);
                navigate('/onboarding');
            }
        } catch(err) {
            console.log(err);
        }
    }

    const handleClick = () => {
        window.location = AUTH_URL;
    }

    return (
        loading 
        ? <div>
            Loading . . .
          </div> 
        :   <div className="overlay">
                <div className="home">
                    <h1 className="primary-title">Fusic</h1>
                    <p style={{fontSize: '45px', width: '400px', textAlign: 'center'}}>Find and chat with people who have similar musical tastes!</p>
                    <button className="primary-button" onClick={handleClick}>
                        Login
                    </button>
                    <p style={{width: '200px'}}>HEADS UP: I am currently trying to get my app's quota extension approved by Spotify so anyone can use it. Meanwhile, check out my GitHub repo: </p>
                    <a href="https://github.com/EddieJ03/fusic">Fusic GitHub</a>
                </div>
            </div>
    )
}
export default Home
