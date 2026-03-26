import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  if (isAuthenticated) return null;

  return (
    <button 
      onClick={() => {
        localStorage.removeItem('sessionId');
        loginWithRedirect();
      }}
      className="w-full px-6 py-4 rounded-2xl bg-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white font-semibold transition-all duration-300 shadow-lg text-sm tracking-wide border border-transparent hover:border-blue-500/50"
    >
      Sign In Securely
    </button>
  );
};

export const LogoutButton = ({ onGuestExit }) => {
  const { logout, user, isAuthenticated } = useAuth0();

  if (!isAuthenticated && onGuestExit) {
    return (
      <button
        onClick={() => {
          localStorage.removeItem('sessionId');
          onGuestExit();
        }}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium transition-colors border border-slate-700"
      >
        Exit Guest Mode
      </button>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-blue-500" />
        <span className="text-sm font-medium text-slate-300 hidden sm:block">{user.name}</span>
      </div>
      <button
        onClick={() => {
          localStorage.removeItem('sessionId');
          logout({ logoutParams: { returnTo: window.location.origin } });
        }}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium transition-colors border border-slate-700"
      >
        Logout
      </button>
    </div>
  );
};
