import React, { useState, useEffect } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import WcIcon from "@mui/icons-material/Wc";
import CloseIcon from "@mui/icons-material/Close";

export default function ProfileEditModal({ user, token, onComplete, onClose, theme, isSystemDark }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    image: null
  });

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (user) {
      const names = user.name ? user.name.split(" ") : ["", ""];
      setForm({
        firstName: names[0] || "",
        lastName: names.slice(1).join(" ") || "",
        age: user.age || "",
        gender: user.gender || "",
        dob: user.dob || "",
        email: user.email || "",
        phone: user.mobile || "",
        image: null
      });
      setPreview(user.profileImage || null);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result); // Base64 string
        setForm({ ...form, image: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: `${form.firstName} ${form.lastName}`.trim(),
        mobile: form.phone || null,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        dob: form.dob || null,
        profileImage: preview || null
      };

      const res = await fetch("http://localhost:8080/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onComplete();
      } else {
        alert("Update failed");
      }
    } catch (err) {
      console.error("Error updating profile", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 pointer-events-auto">
      <div className={`rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 animate-in zoom-in-95 duration-200 border max-h-[90vh] overflow-y-auto scrollbar-hide
        ${theme === 'dark' || (theme === 'system' && isSystemDark)
          ? 'bg-slate-900 border-slate-800 text-white'
          : 'bg-white border-white text-slate-800'
        }`}>
        
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h1 className={`text-3xl font-black tracking-tight ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-white' : 'text-gray-800'}`}>
              Refine Identity
            </h1>
            <p className="text-gray-500 font-medium">Strategic parameter adjustment.</p>
          </div>
          <button onClick={onClose} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all
            ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500'}
          `}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex flex-col items-center justify-center group">
            <div className="relative w-28 h-28 mb-2">
              <div className={`w-full h-full rounded-full border-4 shadow-xl flex items-center justify-center overflow-hidden
                ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 border-slate-700' : 'bg-indigo-50 border-white'}
              `}>
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <AccountCircleIcon className={theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-slate-700' : 'text-indigo-200'} sx={{ fontSize: 90 }} />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-indigo-700 transition-all hover:scale-110">
                <CloudUploadIcon fontSize="small" />
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
              </label>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Signature Image</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                <PersonIcon sx={{ fontSize: 14 }} className="text-indigo-500" /> First Designation
              </label>
              <input
                type="text"
                value={form.firstName}
                className={`w-full rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all border
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) 
                    ? 'bg-slate-800 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-indigo-500/50' 
                    : 'bg-white border-slate-200 text-gray-700 focus:border-indigo-500/50'}
                `}
                onChange={(e) => setForm({...form, firstName: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                <PersonIcon sx={{ fontSize: 14 }} className="text-indigo-500" /> Final Designation
              </label>
              <input
                type="text"
                value={form.lastName}
                className={`w-full rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all border
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) 
                    ? 'bg-slate-800 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-indigo-500/50' 
                    : 'bg-white border-slate-200 text-gray-700 focus:border-indigo-500/50'}
                `}
                onChange={(e) => setForm({...form, lastName: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                <PersonIcon sx={{ fontSize: 14 }} className="text-indigo-500" /> Age Parameter
              </label>
              <input
                type="number"
                value={form.age}
                className={`w-full rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all border
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) 
                    ? 'bg-slate-800 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-indigo-500/50' 
                    : 'bg-white border-slate-200 text-gray-700 focus:border-indigo-500/50'}
                `}
                onChange={(e) => setForm({...form, age: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                <WcIcon sx={{ fontSize: 14 }} className="text-indigo-500" /> Gender Binary
              </label>
              <select
                value={form.gender}
                className={`w-full rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer border
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) 
                    ? 'bg-slate-800 border-slate-700/50 text-white focus:border-indigo-500/50' 
                    : 'bg-white border-slate-200 text-gray-700 focus:border-indigo-500/50'}
                `}
                onChange={(e) => setForm({...form, gender: e.target.value})}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                <CalendarTodayIcon sx={{ fontSize: 14 }} className="text-indigo-500" /> Chronological Origin
              </label>
              <input
                type="date"
                value={form.dob}
                className={`w-full rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all border
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) 
                    ? 'bg-slate-800 border-slate-700/50 text-white focus:border-indigo-500/50' 
                    : 'bg-white border-slate-200 text-gray-700 focus:border-indigo-500/50'}
                `}
                onChange={(e) => setForm({...form, dob: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                <PhoneIcon sx={{ fontSize: 14 }} className="text-indigo-500" /> Comm Channel
              </label>
              <input
                type="tel"
                value={form.phone}
                className={`w-full rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all border
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) 
                    ? 'bg-slate-800 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-indigo-500/50' 
                    : 'bg-white border-slate-200 text-gray-700 focus:border-indigo-500/50'}
                `}
                onChange={(e) => setForm({...form, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
              <EmailIcon sx={{ fontSize: 14 }} className="text-indigo-500" /> Digital Identity
            </label>
            <input
              type="email"
              value={form.email}
              readOnly
              className={`w-full border-none rounded-2xl p-4 text-sm font-bold cursor-not-allowed
                ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800/50 text-slate-500' : 'bg-slate-100 text-gray-400'}
              `}
            />
          </div>

          <button
            type="submit"
            className={`w-full font-black py-5 rounded-[1.5rem] shadow-xl transition-all duration-300 mt-2
              ${theme === 'dark' || (theme === 'system' && isSystemDark)
                ? 'bg-indigo-600 text-white shadow-indigo-900/20 hover:bg-indigo-500'
                : 'bg-slate-900 text-white shadow-indigo-100 hover:bg-indigo-600'
              }`}
          >
            Update Identity Parameters
          </button>
        </form>
      </div>
    </div>
  );
}
