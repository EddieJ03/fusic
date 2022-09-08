import { useState, useEffect, useContext } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { useNavigate, Link } from 'react-router-dom';
import { GlobalContext } from '../GlobalContext';
import TextField from '@mui/material/TextField';
import { useCookies } from 'react-cookie';
import { toast } from 'react-toastify';
import axios from 'axios';

const OnBoarding = () => {
    const [cookies, setCookie, removeCookie] = useCookies(['user']);
    const [genres, setGenres] = useState([]);

    const { user, setUser } = useContext(GlobalContext);   
    
    const [formData, setFormData] = useState({
        user_id: cookies.UserId,
        first_name: user && user.onboarded ? user.first_name : "",
        about: user && user.onboarded ? user.about : "",
        matches: user && user.onboarded ? user.matches : []
    }) 
    
    useEffect(() => {
        if(!cookies.AuthToken || !cookies.UserId) {
            clear();
            return;
        }

        if(!user) {
            getUser();
        } else {
            setGenres(user.genres);
        }
    }, [])

    let navigate = useNavigate();

    const notify = () => toast.warning("You need to login again!");

    const clear = () => {
        notify();
        removeCookie('UserId', cookies.UserId)
        removeCookie('AuthToken', cookies.AuthToken)
        navigate("/");
    }

    const getUser = async () => {
        try {
            const response = await axios.get('/user', {
                params: {userId: cookies.UserId}
            })

            if(!response.data.onboarded) navigate("/onboarding");

            setUser(response.data)

            if(response.data.onboarded) {
                setGenres(response.data.genres);
                setFormData({
                    user_id: cookies.UserId,
                    first_name: response.data.first_name,
                    about: response.data.about,
                    matches: response.data.matches,
                })
            }
        } catch (error) {
            clear();
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put('/user', { formData, genres });
            const success = response.status === 200
            if (success) {
                setUser(response.data.value);
                navigate('/dashboard')
            }
        } catch (err) {
            clear()
        }

    }

    const handleChange = (e) => {
        const value = e.target.value;
        const name = e.target.name;

        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }))
    }

    const allGenres = [
        "Pop",
        "Rock",
        "Rap",
        "Country",
        "R & B",
        "Folk",
        "Jazz",
        "EDM",
        "Classical",
        "Soul",
        "Latin Music",
        "World Music",
        "Funk",
        "Disco",
        "Synth Pop",
        "Blues",
        "Punk",
        "Indie",
        "Heavy Metal",
        "Instrumental",
        "House",
        "Grunge",
        "Trap"
    ]

    return (
        cookies.AuthToken && user ? 
        <>
            <div className="onboarding">
                <h1 style={{margin: '0px', padding: '10px'}}>SET PROFILE</h1>
                <form onSubmit={handleSubmit}>
                    <div style={{width: '50%', display: 'flex', flexDirection: 'column', textAlign: 'start'}}>
                        <label htmlFor="first_name">Name</label>
                        <input
                            style={{ border: 'solid 2px rgb(219, 219, 219)' }}
                            id="first_name"
                            type='text'
                            name="first_name"
                            placeholder="First Name"
                            required={true}
                            value={formData.first_name}
                            onChange={handleChange}
                        />
                        <br/>
                        <br/>

                        <label>Favorite Genres</label>
                        <Autocomplete
                            multiple
                            id="tags-standard"
                            defaultValue={user.genres}
                            options={allGenres}
                            getOptionLabel={(option) => option}
                            onChange={(event, value) => setGenres(value)}
                            renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="standard"
                            />
                            )}
                        />
                        <br/>
                        <br/>

                        <label htmlFor="about">Bio</label>
                        <textarea
                            id="about"
                            type="text"
                            name="about"
                            required={true}
                            placeholder="I like long walks..."
                            value={formData.about}
                            onChange={handleChange}
                        />

                        <input type="submit"/>
                        {user.onboarded ? <Link to="/dashboard">Dashboard</Link> : <></>}
                    </div>
                </form>
            </div>
        </> : 
        <>
            Loading . . .
        </>
    )
}
export default OnBoarding
