import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './board.css';
import pfimg from './profile.jpg';

export default function Board() {
  const [userId, setUserid] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [difficulty, setDifficulty] = useState('Easy');
  const [domain, setDomain] = useState('All');
  const [showDomainSelection, setShowDomainSelection] = useState(false);
  const [uniqueDomains, setUniqueDomains] = useState([]);
  const [userPhoto, setUserPhoto] = useState('default-photo-url'); // Set a default photo URL
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [error, setError] = useState(null);
  const [scoreFilter, setScoreFilter] = useState('All');

  useEffect(() => {
    const fetchedUserId = localStorage.getItem('userId');
    setUserid(fetchedUserId);
    fetchUserData(fetchedUserId);
    fetchLeaderboardData();
  }, [difficulty, domain]);

  const fetchUserData = async (userId) => {
    try {
      setIsLoadingUserData(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/userprofile/${userId}`);
      const userData = response.data;
      console.log('Fetched user data:', userData);

      if (userData.photo !== null) {
        const completePhotoUrl = `http://127.0.0.1:8000${userData.photo}`;
        setUserPhoto(completePhotoUrl);
      } else {
        setUserPhoto('default-photo-url');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Error fetching user data');
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const fetchLeaderboardData = async () => {
    setIsLoadingLeaderboard(true);
    setError(null);

    try {
      const difficultyParam = difficulty !== 'All' ? `&difficulty_level=${difficulty}` : '';
      const domainParam = domain !== 'All' ? `&domain=${domain}` : '';
      const response = await axios.get(
        `http://127.0.0.1:8000/api/questionhistoryget/?${difficultyParam}${domainParam}`
      );

      console.log('Fetched Leaderboard Data:', response.data);

      const fetchedLeaderboard = response.data.map((item) => ({
        userId: item.user,
        username: '', // Initialize username as an empty string
        score: JSON.parse(item.score),
        domain: item.domain,
        difficulty_level: item.difficulty_level,
        photo: item.photo || 'default-photo-url',
      }));

      const uniqueUserIds = Array.from(new Set(fetchedLeaderboard.map((item) => item.userId)));
      const usernameMap = new Map();

      await Promise.all(
        uniqueUserIds.map(async (uniqueUserId) => {
          try {
            const userProfileResponse = await axios.get(
              `http://127.0.0.1:8000/api/userprofile/${uniqueUserId}`
            );
            console.log('User Profile Response:', userProfileResponse.data);

            const { username, photo } = userProfileResponse.data; // Extract username and photo from the response

            if (username) {
              usernameMap.set(uniqueUserId, { username, photo });
            }
          } catch (error) {
            console.error('Error fetching username and photo:', error);
          }
        })
      );

      // Update the leaderboard state with usernames and photos
      setLeaderboard((prevLeaderboard) =>
        prevLeaderboard.map((user) => {
          const userDetail = usernameMap.get(user.userId) || {};
          return { ...user, username: userDetail.username, photo: userDetail.photo || user.photo };
        })
      );

      const finalLeaderboard = filterAndRankLeaderboard(fetchedLeaderboard);
      setLeaderboard(finalLeaderboard);

      const uniqueDomainsArray = Array.from(
        new Set(fetchedLeaderboard.map((item) => item.domain))
      );
      setUniqueDomains(uniqueDomainsArray);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setError('Error fetching leaderboard data');
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const handleScoreFilterChange = (newScoreFilter) => {
    setScoreFilter(newScoreFilter);
  };

  const filterAndRankLeaderboard = (fetchedLeaderboard) => {
    const userMap = new Map();

    fetchedLeaderboard.forEach((current) => {
      const userKey = `${current.userId}_${current.difficulty_level}_${current.domain}`;
      const maxScore = current.score || 0;

      // Check if the score filter condition is met
      let isScoreFilterPassed = false;
      switch (scoreFilter) {
        // case 'All':
        //   isScoreFilterPassed = true;
        //   break;
        case 'LessThan3':
          isScoreFilterPassed = maxScore < 3;
          break;
        case 'Between3And5':
          isScoreFilterPassed = maxScore >= 3 && maxScore <= 5;
          break;
        case 'GreaterThanOrEqual5':
          isScoreFilterPassed = maxScore >= 5;
          break;
        default:
          isScoreFilterPassed = true;
      }

      // Check difficulty and domain conditions along with the score filter
      if (
        (current.difficulty_level === difficulty || difficulty === 'All') &&
        (current.domain === domain || domain === 'All') &&
        isScoreFilterPassed
      ) {
        if (!userMap.has(userKey)) {
          userMap.set(userKey, {
            userId: current.userId,
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

    const filteredLeaderboard = Array.from(userMap.values()).sort(
      (a, b) => b.maxScore - a.maxScore
    );

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


// Pagination logic
const itemsPerPage = 3;
const [currentPage, setCurrentPage] = useState(1);

const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = leaderboard.slice(indexOfFirstItem, indexOfLastItem);

const totalPages = Math.ceil(leaderboard.length / itemsPerPage);

const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
};


  return (
    <div className="container">
      <div className="sidebar">
        <h2>LEADER BOARD</h2>
        <br />
        <hr />
        <br />
        <h2>Score Filter: {scoreFilter}</h2>
        <div className="score-filter-buttons">
          {/* <button onClick={() => handleScoreFilterChange('All')}>All</button> */}
          <button onClick={() => handleScoreFilterChange('Less Than 3')}>Less than 3</button>
          <button onClick={() => handleScoreFilterChange('Between 3 And 5')}>3 to 5</button>
          <button onClick={() => handleScoreFilterChange('Greater Than Or Equal 5')}>5 or more</button>
        </div>

        {/* Render difficulty selection only when a score filter is chosen */}
        {scoreFilter !== 'All' && (
          <>
            <h2>Select Difficulty:</h2>
            <div className="difficulty-buttons">
              <button onClick={() => handleDifficultyChange('easy')}>Easy</button>
              <button onClick={() => handleDifficultyChange('medium')}>Medium</button>
              <button onClick={() => handleDifficultyChange('difficult')}>Difficult</button>
            </div>
          </>
        )}

        {/* Render domain selection only when a difficulty level is selected */}
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

      {(isLoadingUserData || isLoadingLeaderboard) && <p>Loading...</p>}

      {error && <p>Error: {error}</p>}
      {leaderboard.length > 0 && (
  <div className="board" style={{ textAlign: 'center' }}>
    <h1 className="leaderboard">LEADER BOARD</h1>
    {showDomainSelection && difficulty !== 'All' && (
      <h2 className="header-text">{`${domain}-${difficulty}`}</h2>
    )}

    {console.log('Rendering Leaderboard:', currentItems)} {/* Updated for pagination */}
    {currentItems.map((user, index) => (
      <div key={index} className="user-profile">
        <span className="rank">#{user.rank}</span>
        <span className="iduser">{user.userId}</span>
        <img
          className="profile-image"
          src={user.photo !== 'default-photo-url' ? user.photo : pfimg}
          alt={`User ${index + 1}`}
          width="175px"
          height="175px"
        />
        <p> Score: {user.maxScore}</p>
      </div>
    ))}
  </div>
)}

{/* Pagination */}
{totalPages > 1 && (
  <div className="pagination">
    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
      Previous
    </button>
    {Array.from({ length: totalPages }, (_, index) => (
      <button
        key={index + 1}
        onClick={() => handlePageChange(index + 1)}
        className={currentPage === index + 1 ? 'active' : ''}
      >
        {index + 1}
      </button>
    ))}
    <button
      onClick={() => handlePageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      Next
    </button>
  </div>
)}
        

      {leaderboard.length === 0 && !isLoadingUserData && !isLoadingLeaderboard && !error && (
        <div className="board" style={{ textAlign: 'mid-center' }}>
          <h1 className="leaderboard">LEADERBOARD</h1>
          <p>Select the difficulty level and domain.</p>
        </div>
      )}
    </div>
  );
}
