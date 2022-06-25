import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import OnBoarding from './pages/OnBoarding'
import EmptyPage from './pages/EmptyPage'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import { useCookies } from 'react-cookie'
import { useState, useEffect } from 'react'
import axios from 'axios'
import spotifyApi from './constants/SpotifyWebApi'

const App = () => {
    const [cookies, setCookie, removeCookie] = useCookies(['user']);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [expiresIn, setExpiresIn] = useState(null);
    
    useEffect(() => {
        if (!refreshToken || !expiresIn) return;
        const interval = setInterval(() => {
          axios
            .post("/refresh", {
              refreshToken,
            })
            .then(res => {
              setAccessToken(res.data.accessToken);
              setExpiresIn(res.data.expiresIn);
            })
            .catch(() => {
              removeCookie('UserId', cookies.UserId);
              removeCookie('AuthToken', cookies.AuthToken);
              window.location = "/";
            })
        }, (expiresIn - 60) * 1000)
    
        return () => clearInterval(interval)
    }, [refreshToken, expiresIn])

    useEffect(() => {
        if (!accessToken) return;
        spotifyApi.setAccessToken(accessToken)
    }, [accessToken])

    return (
        <BrowserRouter>
            <Routes>
                <Route exact path="/" element={<Home setExpiresIn={setExpiresIn} setRefreshToken={setRefreshToken} setAccessToken={setAccessToken}/>}/>
                <Route path="/dashboard" element={<Dashboard />}/>
                <Route path="/onboarding" element={<OnBoarding/>}/>
                <Route path="/*" element={<EmptyPage/>} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
