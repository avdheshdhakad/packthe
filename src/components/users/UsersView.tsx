import React from 'react';
import { Users, Shield, Award, CheckCircle2, Building, Mail } from 'lucide-react';
import { User, UserRole } from '../../types';

interface UsersViewProps {
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onSelectUser,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-700">Access Control & Directorate</span>
          <span className="text-xs text-slate-300">•</span>
          <span className="text-xs font-semibold text-slate-500">Authorized Personnel</span>
        </div>
        <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
          Enforcement Officers & Inspector Profiles
        </h2>
        <p className="text-xs font-medium text-slate-600">
          Switch active user context to test different role-based permissions (Director, Legal Metrology Officer, Field Inspector).
        </p>
      </div>

      {/* Current Active User Callout */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900">{currentUser.name}</span>
                <span className="rounded-md bg-blue-700 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                  Active Session
                </span>
              </div>
              <div className="text-xs font-medium text-slate-600">{currentUser.department}</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span>Badge: {currentUser.badgeNumber}</span>
                <span>•</span>
                <span>Role: {currentUser.role.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {users.map((user) => {
          const isSelected = user.id === currentUser.id;
          return (
            <div
              key={user.id}
              className={`rounded-2xl border p-5 shadow-2xs transition-all ${
                isSelected
                  ? 'border-blue-600 bg-white ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{user.name}</h3>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                </div>

                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'officer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              <div className="mt-4 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span>{user.department}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                  <Award className="h-3.5 w-3.5 text-slate-400" />
                  <span>Badge ID: {user.badgeNumber}</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => onSelectUser(user)}
                  disabled={isSelected}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-extrabold'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isSelected ? 'Current User' : 'Switch To This User'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
