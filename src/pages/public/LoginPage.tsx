import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ExousiaLogo } from '../../components/ExousiaLogo';
import { hseDataService, HSEAppState } from '../../services/hseDataService';
import { Shield, ArrowRight, UserCheck, Lock, Info } from 'lucide-react';
import { CONTRACT_CLIENT_DISPLAY, DELIVERY_CONTRACTOR } from '../../constants/contractScope';

interface LoginPageProps {
  appState: HSEAppState;
}

export const LoginPage: React.FC<LoginPageProps> = ({ appState }) => {
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState(appState.currentUser.id);
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    hseDataService.setCurrentUser(selectedUserId);
    navigate('/app');
  };

  const handleSimulatePendingAccess = () => {
    navigate('/access-pending');
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-4">
          <ExousiaLogo variant="full" theme="light" height={44} />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-[#15251C]">
          Sign in to HSE Workspace
        </h2>
        <p className="mt-1 text-xs text-[#5D6961]">
          Authorized portal for {CONTRACT_CLIENT_DISPLAY} & {DELIVERY_CONTRACTOR}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl shadow-xs border border-[#DDE5DF] space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#15251C] mb-1">
                Select Authorized Account Persona *
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44] bg-white text-[#15251C]"
              >
                {appState.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.roleTitle}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#5D6961] mt-1">
                Test different role boundaries (Reporter, Supervisor, Inspector, Manager).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#15251C] mb-1">
                Enterprise Credentials / Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#DDE5DF] rounded-lg focus:outline-hidden focus:border-[#007A44]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-[#007A44] hover:bg-[#005D35] transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Enter Workspace</span>
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DDE5DF]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-[#5D6961]">Access Governance</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleSimulatePendingAccess}
              className="w-full py-2 px-3 border border-[#DDE5DF] rounded-lg text-xs font-medium text-[#5D6961] hover:bg-[#F7F9F7] transition-colors flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#B54708]" />
              <span>Simulate Unapproved Identity (Access-Pending Screen)</span>
            </button>
          </div>

          <div className="pt-2 text-[11px] text-[#5D6961] text-center border-t border-[#DDE5DF]">
            <Link to="/" className="text-[#007A44] hover:underline font-medium">
              ← Return to public website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
