import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './board.css';
import pfimg from "./profile.jpg" ;

export default function Board() {
  const [userId, setUserid] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [difficulty, setDifficulty] = useState('Easy');
  const [domain, setDomain] = useState('All');
  const [showDomainSelection, setShowDomainSelection] = useState(false);
  const [uniqueDomains, setUniqueDomains] = useState([]);
  const [userPhoto, setUserPhoto] = useState('default-photo-url'); // Set a default photo URL

  useEffect(() => {
    const fetchedUserId = localStorage.getItem('userId');
    setUserid(fetchedUserId);

    fetchUserData(fetchedUserId); // Fetch user data for photo URL
    fetchLeaderboardData(fetchedUserId);
  }, [difficulty, domain]);

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/userprofile/${userId}`);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log("Fetched user data:", data);

      if (data.photo !== null) {
        const completePhotoUrl = `http://127.0.0.1:8000${data.photo}`;
        setUserPhoto(completePhotoUrl);
      } else {
        setUserPhoto('default-photo-url');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };


  useEffect(() => {
    setUserid(localStorage.getItem('userId'));
  }, []);

  // useEffect(() => {
  //   if (userId) {
  //     fetchUserData();
  //   }
  // }, [userId]);


  const fetchLeaderboardData = () => {
    const difficultyParam = difficulty !== 'All' ? `&difficulty_level=${difficulty}` : '';
    const domainParam = domain !== 'All' ? `&domain=${domain}` : '';

    axios
      .get(`http://127.0.0.1:8000/api/questionhistoryget/?${difficultyParam}${domainParam}`)
      .then((response) => {
        console.log('Fetched Leaderboard Data:', response.data);
        const fetchedLeaderboard = response.data.map((item) => ({
          user: item.user,
          score: JSON.parse(item.score),
          domain: item.domain,
          difficulty_level: item.difficulty_level,
          photo: item.photo || 'default-photo-url',
        }));

        const uniqueDomainsArray = Array.from(new Set(fetchedLeaderboard.map((item) => item.domain)));
        setUniqueDomains(uniqueDomainsArray);

        const filteredLeaderboard = filterAndRankLeaderboard(fetchedLeaderboard);
        setLeaderboard(filteredLeaderboard);
      })
      .catch((error) => {
        console.error('Error fetching leaderboard data:', error);
      });
  };


  const filterAndRankLeaderboard = (fetchedLeaderboard) => {
    const userMap = new Map();

    fetchedLeaderboard.forEach((current) => {
      const userKey = `${current.user}_${current.difficulty_level}_${current.domain}`;
      const maxScore = current.score || 0;

      // Check if the current user matches the selected difficulty and domain
      if (
        (current.difficulty_level === difficulty || difficulty === 'All') &&
        (current.domain === domain || domain === 'All')
      ) {
        if (!userMap.has(userKey)) {
          userMap.set(userKey, {
            user: current.user,
            domain: current.domain,
            difficulty_level: current.difficulty_level,
            maxScore,
            rank: 1,
            photo: current.photo,
          });
        } else {
          const existingUser = userMap.get(userKey);
          if (maxScore > existingUser.maxScore) {
            existingUser.maxScore = maxScore;
            existingUser.photo = current.photo;
          }
        }
      }
    });

    const filteredLeaderboard = Array.from(userMap.values()).sort((a, b) => b.maxScore - a.maxScore);

    filteredLeaderboard.forEach((user, index) => {
      user.rank = index + 1;
    });

    return filteredLeaderboard;
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setShowDomainSelection(newDifficulty !== 'All');
  };

  const handleDomainChange = (newDomain) => {
    setDomain(newDomain);
  };

  console.log('Leaderboard State:', leaderboard);

  return (
    <div className="container">
      <div className="sidebar">
        <h2>LEADERBOARD</h2>
        <br />
        <hr />
        <br />
        <h2>Select Difficulty:</h2>
        <div className="difficulty-buttons">
          <button onClick={() => handleDifficultyChange('easy')}>Easy</button>
          <button onClick={() => handleDifficultyChange('medium')}>Medium</button>
          <button onClick={() => handleDifficultyChange('difficult')}>Difficult</button>
        </div>

        {showDomainSelection && (
          <>
            <h2>Domains:</h2>
            <div className="domain-buttons">
              {uniqueDomains.map((domain) => (
                <button key={domain} onClick={() => handleDomainChange(domain)}>
                  {domain}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* {leaderboard.length > 0 && (
        <div className="board" style={{ textAlign: 'mid-center' }}>
          <h1 className="leaderboard">LEADERBOARD</h1>
          {leaderboard.map((user, index) => (
            <div key={index} className="user-profile">
              <span className="rank">#{user.rank}</span>
              <span className="iduser">{user.user}</span>
              <img className="profile-image" src={userPhoto} alt={`User ${index + 1}`} />
              <p> Score: {user.maxScore}</p>
            </div>
          ))}
        </div>
      )} */}

{leaderboard.length > 0 && (
  <div className="board" style={{ textAlign: 'mid-center' }}>
    <h1 className="leaderboard">LEADERBOARD</h1>
    {leaderboard.map((user, index) => (
      <div key={index} className="user-profile">
        <span className="rank">#{user.rank}</span>
        <span className="iduser">{user.user}</span>
        <img
          className="profile-image"
          src={userId === user.user ? userPhoto : pfimg}
          alt={`User ${index + 1}`}
          width="175px"
          height="175px"
        />
        <p> Score: {user.maxScore}</p>
      </div>
    ))}
  </div>
)}

      

      {leaderboard.length === 0 && (
        <div className="board" style={{ textAlign: 'mid-center' }}>
          <h1 className="leaderboard">LEADERBOARD</h1>
          <p>Select the difficulty level and domain.</p>
        </div>
      )}
    </div>
  );
}
