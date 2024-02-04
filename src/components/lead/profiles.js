import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './profiles.css'; // Assuming you have a CSS file named profiles.css for styling
import pfimg from './profile.jpg';

export default function Profiles() {
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
            const userProfileData = userProfileResponse.data;

            if (userProfileData.username) {
              usernameMap.set(uniqueUserId, userProfileData.username);
            }
          } catch (error) {
            console.error('Error fetching username:', error);
          }
        })
      );

      // Update the leaderboard state with usernames
      setLeaderboard((prevLeaderboard) =>
        prevLeaderboard.map((user) => {
          const username = usernameMap.get(user.userId) || user.username;
          return { ...user, username };
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
        case 'All':
          isScoreFilterPassed = true;
          break;
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

  return (
    <div className="profile-container">
      {/* Top 3 profiles */}
      <div className="top-three">
        {leaderboard.slice(0, 3).map((user, index) => (
          <div className={`top-profile rank-${index + 1}`} key={index}>
            <span className="rank">#{user.rank}</span>
            <div className="podium-profile">
              <img
                className="profile-image-medium"
                src={user.photo !== 'default-photo-url' ? user.photo : pfimg}
                alt={`User ${index + 1}`}
              />
              <div className="info">
                <h3 className="name">{user.username}</h3>
                <p>Domain: {user.domain}</p>
                <p>Difficulty Level: {user.difficulty_level}</p>
                <p>Max Score: {user.maxScore}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Remaining profiles */}
      <div className="other-profiles">
        {leaderboard.slice(3).map((user, index) => (
          <div className={`flex`} key={index}>
            <span className="rank"># {user.rank}</span>
            <img
              className="profile-image"
              src={user.photo !== 'default-photo-url' ? user.photo : pfimg}
              alt={`User ${index + 4}`}
            />
            <div className="info">
              <h3 className="name">{user.username}</h3>
              <p>Domain: {user.domain}</p>
              <p>Difficulty Level: {user.difficulty_level}</p>
              <p>Max Score: {user.maxScore}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
