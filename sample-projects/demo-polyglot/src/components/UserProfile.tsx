import React from 'react';

interface UserProfileProps {
  userId: string;
  name: string;
}

export function UserProfile({ userId, name }: UserProfileProps) {
  return (
    <div className="user-profile-card">
      <h3>{name}</h3>
      <p>User ID: {userId}</p>
    </div>
  );
}
