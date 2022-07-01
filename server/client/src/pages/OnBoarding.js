import {useState, useEffect} from 'react'
import {useCookies} from 'react-cookie'
import {useNavigate, Link} from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify';

const OnBoarding = () => {
    const [cookies, setCookie, removeCookie] = useCookies(['user']);
    const [onboarded, setOnboarded] = useState(false);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);

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
    }, [])

    const [formData, setFormData] = useState({
        user_id: cookies.UserId,
        first_name: "",
        dob_day: "",
        dob_month: "",
        dob_year: "",
        url: "",
        about: "",
        matches: [],
    })

    const getUser = async () => {
        try {
            const verifyToken = await axios.get('/verify', {
                headers: {
                  Authorization: 'Bearer ' + cookies.AuthToken 
                }
            })

            if(!verifyToken.data.verified) {
                clear();
            }

            const response = await axios.get('/user', {
                params: {userId: cookies.UserId}
            })

            if(response.data.onboarded) {
                setFormData((prevState) => ({
                    ...prevState,
                    first_name: response.data.first_name,
                    dob_day: response.data.dob_day,
                    dob_month: response.data.dob_month,
                    dob_year: response.data.dob_year,
                    about: response.data.about,
                    matches: response.data.matches,
                }))
                setOnboarded(response.data.onboarded);
                setGenres(prevState => [...prevState, ...response.data.genres])
            }

            setLoading(false);
        } catch (error) {
            clear()
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const response = await axios.put('/user', {formData, genres});
            const success = response.status === 200
            if (success) navigate('/dashboard')
        } catch (err) {
            console.log(err)
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

    const handleGenres = (e) => {
        if(genres.includes(e.target.name)) {
            setGenres((prevState) => prevState.filter(item => item !== e.target.name))
        } else {
            setGenres(prevState => [...prevState, e.target.name])
        }
    }

    return (
        cookies.AuthToken && !loading ? 
        <>
            <div className="onboarding">
                <h1 style={{margin: '0px', padding: '10px'}}>SET PROFILE</h1>

                <form onSubmit={handleSubmit}>
                    <section>
                        <label htmlFor="first_name">Name</label>
                        <input
                            id="first_name"
                            type='text'
                            name="first_name"
                            placeholder="First Name"
                            required={true}
                            value={formData.first_name}
                            onChange={handleChange}
                        />

                        <label>Birthday</label>
                        <div className="multiple-input-container">
                            <input
                                id="dob_day"
                                type="number"
                                name="dob_day"
                                placeholder="DD"
                                required={true}
                                value={formData.dob_day}
                                onChange={handleChange}
                            />

                            <input
                                id="dob_month"
                                type="number"
                                name="dob_month"
                                placeholder="MM"
                                required={true}
                                value={formData.dob_month}
                                onChange={handleChange}
                            />

                            <input
                                id="dob_year"
                                type="number"
                                name="dob_year"
                                placeholder="YYYY"
                                required={true}
                                value={formData.dob_year}
                                onChange={handleChange}
                            />
                        </div>

                        <label>Favorite Genres</label>
                        <div className="multiple-input-container">
                            
                            <input
                                id="pop"
                                type="checkbox"
                                name="pop"
                                value="pop"
                                onChange={handleGenres}
                                checked={genres.includes("pop")}
                            />
                            <label htmlFor="pop">Pop</label>
                            
                            <input
                                id="rock"
                                type="checkbox"
                                name="rock"
                                value="rock"
                                onChange={handleGenres}
                                checked={genres.includes("rock")}
                            />
                            <label htmlFor="rock">Rock</label>
                            
                            <input
                                id="rap"
                                type="checkbox"
                                name="rap"
                                value="rap"
                                onChange={handleGenres}
                                checked={genres.includes("rap")}
                            />
                            <label htmlFor="rap">Rap</label>
                            
                            <input
                                id="country"
                                type="checkbox"
                                name="country"
                                value="country"
                                onChange={handleGenres}
                                checked={genres.includes("country")}
                            />
                            <label htmlFor="country">Country</label>
                            
                            <input
                                id="randb"
                                type="checkbox"
                                name="randb"
                                value="randb"
                                onChange={handleGenres}
                                checked={genres.includes("randb")}
                            />
                            <label htmlFor="randb">R & B</label>
                            
                            <input
                                id="folk"
                                type="checkbox"
                                name="folk"
                                value="folk"
                                onChange={handleGenres}
                                checked={genres.includes("folk")}
                            />
                            <label htmlFor="folk">Folk</label>
                            
                            <input
                                id="jazz"
                                type="checkbox"
                                name="jazz"
                                value="jazz"
                                onChange={handleGenres}
                                checked={genres.includes("jazz")}
                            />
                            <label htmlFor="jazz">Jazz</label>
                            
                            <input
                                id="edm"
                                type="checkbox"
                                name="edm"
                                value="edm"
                                onChange={handleGenres}
                                checked={genres.includes("edm")}
                            />
                            <label htmlFor="edm">EDM</label>
                            
                            <input
                                id="classical"
                                type="checkbox"
                                name="classical"
                                value="classical"
                                onChange={handleGenres}
                                checked={genres.includes("classical")}
                            />
                            <label htmlFor="classical">Classical</label>
                            
                            <input
                                id="reggae"
                                type="checkbox"
                                name="reggae"
                                value="reggae"
                                onChange={handleGenres}
                                checked={genres.includes("reggae")}
                            />
                            <label htmlFor="reggae">Reggae</label>
                            
                            <input
                                id="soul"
                                type="checkbox"
                                name="soul"
                                value="soul"
                                onChange={handleGenres}
                                checked={genres.includes("soul")}
                            />
                            <label htmlFor="soul">Soul</label>
                            
                            <input
                                id="latinmusic"
                                type="checkbox"
                                name="latinmusic"
                                value="latinmusic"
                                onChange={handleGenres}
                                checked={genres.includes("latinmusic")}
                            />
                            <label htmlFor="latinmusic">Latin Music</label>
                        </div>
                        <label htmlFor="about">Bio</label>
                        <input
                            id="about"
                            type="text"
                            name="about"
                            required={true}
                            placeholder="I like long walks..."
                            value={formData.about}
                            onChange={handleChange}
                        />

                        <input type="submit"/>
                        {onboarded ? <Link to="/dashboard">Dashboard</Link> : <></>}
                    </section>
                </form>
            </div>
        </> : 
        <></>
    )
}
export default OnBoarding
