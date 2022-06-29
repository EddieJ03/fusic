import axios from "axios";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { toast } from 'react-toastify';
import {useNavigate} from 'react-router-dom'

const MatchesDisplay = ({ matches, setClickedUser }) => {
  const [loading, setLoading] = useState(false);
  const [matchedProfiles, setMatchedProfiles] = useState(null);
  const [cookies, setCookie, removeCookie] = useCookies(null);

  const notify = () => toast.warning("You need to login again!");

  const matchedUserIds = matches.map(({ user_id }) => user_id);
  const userId = cookies.UserId;

  let navigate = useNavigate();

  const clear = () => {
    notify();
    removeCookie('UserId', cookies.UserId)
    removeCookie('AuthToken', cookies.AuthToken)
    navigate("/");
  }

  const getMatches = async () => {
    try {
      if(!cookies.AuthToken || !cookies.UserId) {
          clear();
      }

      const verifyToken = await axios.get('/verify', {
          headers: {
            Authorization: 'Bearer ' + cookies.AuthToken 
          }
      })

      if(!verifyToken.data.verified) {
          clear();
      }

      const response = await axios.get("/users", {
        params: { userIds: JSON.stringify(matchedUserIds) },
      });
      setMatchedProfiles(response.data);
      setLoading(false);
    } catch (error) {
      clear();
    }
  };

  useEffect(() => {
    setLoading(true);
    getMatches();
  }, [matches]);

  const filteredMatchedProfiles = matchedProfiles?.filter(
    (matchedProfile) =>
      matchedProfile.matches.filter((profile) => profile.user_id === userId)
        .length > 0
  );

  return (
    loading ?
    <p style={{textAlign: 'center'}}>Loading. . .</p>
    :
    <div className="matches-display" style={{height: '70vh'}}>
      {filteredMatchedProfiles?.map((match, _index) => (
        <div
          key={_index}
          className="match-card"
          onClick={() => setClickedUser(match)}
        >
          <div className="match" style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
            <div className="img-container">
              <img src={match?.url} alt={match?.first_name + " profile"} />
            </div>
            <h3 style={{marginLeft: '5px'}}>{match?.first_name}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchesDisplay;
