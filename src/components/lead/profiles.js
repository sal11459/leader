import React from 'react';
import './profiles.css'; // Assuming you have a CSS file named profiles.css for styling

export default function Profiles({ Leaderboard }) {
  console.log('Leaderboard Data:', Leaderboard); // Log the Leaderboard data

  // Assuming Leaderboard is an array of user data objects
  const sortedLeaderboard = Leaderboard.sort((a, b) => b.maxScore - a.maxScore);

  console.log('Sorted Leaderboard:', sortedLeaderboard);

  return (
    <div className="profile-container">
      {/* Top 3 profiles */}
      <div className="top-three">
        {sortedLeaderboard.slice(0, 3).map((profile, index) => (
          <div className={`top-profile rank-${index + 1}`} key={index}>
            <span className="rank">#{index + 1}</span>
            <div className="podium-profile">
              <img
                className="profile-image-medium"
                src={profile.photo}  // Adjust according to the actual API response structure
                alt={profile.user}
              />
              <div className="info">
                <h3 className="name">{profile.user}</h3>
                <p>Domain: {profile.domain}</p>
                <p>Difficulty Level: {profile.difficulty_level}</p>
                <p>Max Score: {profile.maxScore}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Remaining profiles */}
      <div className="other-profiles">
        {sortedLeaderboard.slice(3).map((profile, index) => (
          <div className={`flex ${profile.highlight ? 'highlight' : ''}`} key={index}>
            <span className="rank"># {index + 4}</span>
            <img
              className="profile-image"
              src={profile.photo}  // Adjust according to the actual API response structure
              alt={profile.user}
            />
            <div className="info">
              <h3 className="name">{profile.user}</h3>
              <p>Domain: {profile.domain}</p>
              <p>Difficulty Level: {profile.difficulty_level}</p>
              <p>Max Score: {profile.maxScore}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
