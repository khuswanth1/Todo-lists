import React, { useState, useEffect, useRef } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import TaskIcon from "@mui/icons-material/Task";

export default function Header({ user, setToken, searchQuery, setSearchQuery, onEditProfile, theme, setTheme, isSystemDark }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <header className={`flex justify-between items-center px-6 py-3 rounded-b-3xl shadow-2xl sticky top-0 z-50 transition-all duration-500
  ${theme === "light"
        ? "bg-white/70 backdrop-blur-xl text-slate-900 border-b border-x border-slate-100 shadow-slate-200/50"
        : theme === "dark"
          ? "bg-slate-900/70 backdrop-blur-xl text-white border-b border-x border-slate-800 shadow-black/50"
          : isSystemDark
            ? "bg-slate-900/70 backdrop-blur-xl text-white border-b border-x border-slate-800 shadow-black/50"
            : "bg-white/70 backdrop-blur-xl text-slate-900 border-b border-x border-slate-100 shadow-slate-200/50"
      }
`}>
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
          <TaskIcon className="text-white" sx={{ fontSize: 24 }} />
        </div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tighter">
          Todo Pro
        </h1>
      </div>

      <div className="flex-1 max-w-xl mx-12">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className={`transition-colors duration-300 ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'}`} sx={{ fontSize: 20 }} />
          </div>
          <input
            type="text"
            placeholder="Search missions, objectives, or specs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-2xl py-3 pl-12 pr-10 text-sm font-semibold transition-all duration-300 focus:ring-4 border
              ${theme === 'dark' || (theme === 'system' && isSystemDark)
                ? 'bg-slate-800/40 text-slate-100 placeholder:text-slate-500 focus:ring-indigo-500/20 focus:bg-slate-800 border-slate-700/50 focus:border-indigo-500/50'
                : 'bg-slate-100/40 text-slate-700 placeholder:text-slate-400 focus:ring-indigo-500/10 focus:bg-white border-slate-200/50 focus:border-indigo-500/50 shadow-inner'
              }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-500 transition-colors"
            >
              <ClearIcon sx={{ fontSize: 18 }} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Dropdown */}
        <div className="relative group/theme">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className={`appearance-none px-4 py-2 pr-10 rounded-xl border text-[10px] font-black uppercase tracking-[0.1em] shadow-sm focus:outline-none transition-all duration-300 cursor-pointer hover:shadow-md
              ${theme === "dark" || (theme === 'system' && isSystemDark)
                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200"
              }`}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 group-hover/theme:text-indigo-500 transition-colors">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`group flex items-center gap-2 p-1 rounded-full transition-all duration-300 ${showDropdown
            ? "bg-indigo-500/10 ring-4 ring-indigo-500/20"
            : "hover:bg-indigo-500/5"
            }`}
        >
          {user?.profileImage && !user.profileImage.startsWith('blob:') ? (
            <img
              src={user.profileImage}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-indigo-500/30"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              <PersonIcon />
            </div>
          )}
        </button>

        {showDropdown && (
          <div className={`absolute right-0 mt-4 w-80 rounded-[2.5rem] shadow-2xl border p-8 z-50 transform origin-top-right transition-all animate-in fade-in zoom-in slide-in-from-top-4 duration-300
            ${theme === "dark" || (theme === 'system' && isSystemDark)
              ? "bg-slate-900/95 backdrop-blur-2xl border-slate-800 text-white"
              : "bg-white/95 backdrop-blur-2xl border-slate-100 text-slate-900"
            }`}>
            {/* User Info Header */}
            <div className="flex flex-col items-center pb-6 border-b border-slate-100/10">
              <div className="relative group/avatar">
                <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover/avatar:opacity-50 transition duration-300"></div>
                <div className="relative w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-2xl overflow-hidden">
                  {user?.profileImage && !user.profileImage.startsWith('blob:') ? (
                    <img src={user.profileImage} alt="Avatar" className="w-full h-full object-cover transform group-hover/avatar:scale-110 transition duration-500" />
                  ) : (
                    <AccountCircleIcon className="text-indigo-500" sx={{ fontSize: 80 }} />
                  )}
                </div>
              </div>
              <h3 className="mt-4 font-black text-2xl tracking-tighter">
                {user?.name || "Member"}
              </h3>
              <p className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent font-bold text-sm">
                @{user?.username || "username"}
              </p>
            </div>

            {/* Profile Details */}
            <div className="py-6 space-y-5">
              <div className="flex items-center gap-4 px-3 group/item">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover/item:bg-indigo-500/20 transition-colors">
                  <EmailIcon className="text-indigo-500" sx={{ fontSize: 18 }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Email Address</span>
                  <span className="text-sm font-bold truncate opacity-80">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 px-3 group/item">
                <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover/item:bg-purple-500/20 transition-colors">
                  <PhoneIcon className="text-purple-500" sx={{ fontSize: 18 }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Phone Number</span>
                  <span className="text-sm font-bold truncate opacity-80">{user?.mobile || "Not provided"}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onEditProfile();
                }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] transition-all font-black text-sm"
              >
                <PersonIcon sx={{ fontSize: 18 }} /> Edit Profile
              </button>

              <button
                onClick={handleLogout}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl active:scale-[0.98] transition-all font-black text-sm border
                  ${theme === 'dark' || (theme === 'system' && isSystemDark)
                    ? 'bg-slate-800 text-red-400 border-slate-700 hover:bg-red-500/10'
                    : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                  }`}
              >
                <LogoutIcon sx={{ fontSize: 18 }} /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
</div>
    </header>
  );
}