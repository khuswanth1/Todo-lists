import React, { useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import WcIcon from "@mui/icons-material/Wc";

export default function Create({ token, onComplete, theme, isSystemDark }) {
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

  const handleCancel = () => {
    setForm({
      firstName: "",
      lastName: "",
      age: "",
      gender: "",
      dob: "",
      email: "",
      phone: "",
      image: null
    });
    setPreview(null);
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

      console.log("Sending payload:", payload);

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
    <div className={`min-h-screen p-6 flex items-center justify-center transition-colors duration-500
      ${theme === 'dark' || (theme === 'system' && isSystemDark) 
        ? 'bg-slate-950' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
      }`}>
      <div className={`w-full max-w-2xl backdrop-blur-xl rounded-[2.5rem] shadow-2xl border p-10 transition-all duration-300
        ${theme === 'dark' || (theme === 'system' && isSystemDark)
          ? 'bg-slate-900/80 border-slate-800 shadow-black/20 text-white'
          : 'bg-white/80 border-white text-slate-800'
        }`}>
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className={`text-4xl font-black tracking-tight mb-2 ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-white' : 'text-gray-800'}`}>
            Create New Account
          </h1>
          <p className="text-gray-500 font-medium">Please fill in the details below to register.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center justify-center group">
            <div className="relative w-32 h-32 mb-4">
              <div className={`w-full h-full rounded-full border-4 shadow-xl flex items-center justify-center overflow-hidden
                ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 border-slate-700' : 'bg-indigo-50 border-white'}
              `}>
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <AccountCircleIcon className={theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-slate-700' : 'text-indigo-200'} sx={{ fontSize: 100 }} />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-indigo-700 transition-all hover:scale-110">
                <CloudUploadIcon fontSize="small" />
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
              </label>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upload Profile Picture</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* First Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                <PersonIcon fontSize="inherit" className="text-indigo-500" /> First Name
              </label>
              <input
                type="text"
                value={form.firstName}
                placeholder="John"
                className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-gray-50 text-gray-700'}
                `}
                onChange={(e) => setForm({...form, firstName: e.target.value})}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                <PersonIcon fontSize="inherit" className="text-indigo-500" /> Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                placeholder="Doe"
                className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-gray-50 text-gray-700'}
                `}
                onChange={(e) => setForm({...form, lastName: e.target.value})}
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                <PersonIcon fontSize="inherit" className="text-indigo-500" /> Age
              </label>
              <input
                type="number"
                value={form.age}
                placeholder="25"
                className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-gray-50 text-gray-700'}
                `}
                onChange={(e) => setForm({...form, age: e.target.value})}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                <WcIcon fontSize="inherit" className="text-indigo-500" /> Gender
              </label>
              <select
                value={form.gender}
                className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 text-white' : 'bg-gray-50 text-gray-700'}
                `}
                onChange={(e) => setForm({...form, gender: e.target.value})}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                <CalendarTodayIcon fontSize="inherit" className="text-indigo-500" /> Date of Birth
              </label>
              <input
                type="date"
                value={form.dob}
                className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 text-white' : 'bg-gray-50 text-gray-700'}
                `}
                onChange={(e) => setForm({...form, dob: e.target.value})}
              />
            </div>

            {/* Phone No */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
                <PhoneIcon fontSize="inherit" className="text-indigo-500" /> Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                placeholder="+1 234 567 890"
                className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-gray-50 text-gray-700'}
                `}
                onChange={(e) => setForm({...form, phone: e.target.value})}
              />
            </div>
          </div>

          {/* Email ID */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 ml-1">
              <EmailIcon fontSize="inherit" className="text-indigo-500" /> Email Address
            </label>
            <input
              type="email"
              value={form.email}
              placeholder="john.doe@example.com"
              className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all
                ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-gray-50 text-gray-700'}
              `}
              onChange={(e) => setForm({...form, email: e.target.value})}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className={`flex-1 font-black py-5 rounded-[1.5rem] shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300
                ${theme === 'dark' || (theme === 'system' && isSystemDark)
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-black/20'
                  : 'bg-white text-gray-700 border border-gray-100 shadow-indigo-50'
                }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-[2] font-black py-5 rounded-[1.5rem] shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300
                ${theme === 'dark' || (theme === 'system' && isSystemDark)
                  ? 'bg-indigo-600 text-white shadow-indigo-900/20'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-100'
                }`}
            >
              Create User Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}