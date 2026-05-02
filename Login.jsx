import React, { useState, useEffect } from "react";

// MUI Icons
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import KeyIcon from "@mui/icons-material/VpnKey";
import GoogleIcon from "@mui/icons-material/Google";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Auth({ setToken }) {
  const [mode, setMode] = useState("login");
  // login | signup | forgot | otp | reset

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });

  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Automatically clear fields when switching between Login, Signup, and Forgot Password
  useEffect(() => {
    if (mode === "login" || mode === "signup" || mode === "forgot") {
      resetForm();
    }
  }, [mode]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({
      email: "",
      username: "",
      password: "",
      confirmPassword: ""
    });
    setOtp("");
    setGeneratedOtp("");
    setOtpExpiry(null);
    setTimer(0);
    setError("");
    setMsg("");
  };

  // LOGIN
  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("Please enter both email/username and password");
      return;
    }
    try {
      console.log("Attempting login with:", { identifier: form.email, password: form.password });
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: form.email, password: form.password })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Login failed response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.message || "Login failed");
        } catch (e) {
          throw new Error("Login failed: " + errorText);
        }
      }

      // Send Login Email Notification
      if (form.email.includes("@")) {
        fetch("http://localhost:8080/auth/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: form.email,
            subject: "Security Alert: New Login",
            message: "We detected a new login to your Todo Pro account. If this wasn't you, please secure your account immediately."
          })
        }).catch(err => console.error("Failed to send login email:", err));
      }

      const token = await res.text();
      localStorage.setItem("token", token);
      resetForm();
      setToken(token);

      // ✅ Show Device Notification
      if (Notification.permission === "granted") {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification("Security Alert", {
              body: "Successful login detected on this device.",
              icon: "/logo192.png"
            });
          });
        } else {
          new Notification("Security Alert", {
            body: "Successful login detected on this device.",
            icon: "/logo192.png"
          });
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // SIGNUP
  const handleSignup = async () => {
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match");

    try {
      const { confirmPassword, ...userData } = form;
      const res = await fetch("http://localhost:8080/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userData, confirmPassword: form.confirmPassword })
      });

      if (res.ok) {
        // Send Signup Email Notification
        if (form.email) {
          fetch("http://localhost:8080/auth/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: form.email,
              subject: "Welcome to Todo Pro!",
              message: `Hello ${form.username},\n\nYour account has been successfully created. You are now logged in and ready to initiate missions.`
            })
          }).catch(err => console.error("Failed to send signup email:", err));
        }

        const token = await res.text();
        localStorage.setItem("token", token);
        resetForm();
        setToken(token);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Signup failed");
      }
    } catch (err) {
      setError("Signup failed: " + err.message);
    }
  };

  // FORGOT → SEND OTP
  const handleForgot = async () => {
    if (!form.email) return setError("Enter Email");
    try {
      const res = await fetch("http://localhost:8080/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email })
      });
      if (!res.ok) throw new Error("Failed to send OTP");

      const currentEmail = form.email;
      resetForm(); // Clears all state

      // The backend generates and emails the OTP now.
      setOtpExpiry(Date.now() + 60000); // 1 minute expiry
      setForm(prev => ({ ...prev, email: currentEmail })); // Keep email for reference if needed
      setMsg("OTP sent to email");
      setMode("otp");
      setTimer(60);
    } catch {
      setError("Failed to send OTP");
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError("");
    setMsg("");
    setOtp("");
    await handleForgot();
  };

  // VERIFY OTP → go to reset
  const handleVerifyOTP = async () => {
    if (!otp) return setError("Enter OTP");

    if (Date.now() > otpExpiry) {
      return setError("OTP has expired. Please resend.");
    }

    try {
      const res = await fetch("http://localhost:8080/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp })
      });

      if (!res.ok) throw new Error("Invalid OTP");

      setError("");
      setMsg("OTP verified successfully!");
      setMode("reset");
    } catch (err) {
      setError(err.message);
    }
  };

  // RESET PASSWORD
  const handleReset = async () => {
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match");

    try {
      const res = await fetch("http://localhost:8080/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otp, newPassword: form.password })
      });
      if (!res.ok) throw new Error("Reset failed");

      resetForm();
      setMsg("Password updated successfully! Please login with your new password.");
      setMode("login");
    } catch {
      setError("Reset failed");
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 font-sans">

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/30 blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-pink-600/20 blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md px-4 py-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 p-10 space-y-8">

          {/* LOGO / ICON AREA */}
          <div className="flex flex-col items-center gap-3">

            <h1 className="text-4xl font-black text-center text-white tracking-tighter">
              {mode === "login" && "Login"}
              {mode === "signup" && "Signup"}
              {mode === "forgot" && "Forgot Password"}
              {mode === "otp" && "Enter OTP"}
              {mode === "reset" && "Reset Password"}
            </h1>
          </div>

          {/* TOGGLE */}
          {(mode === "login" || mode === "signup") && (
            <div className="flex bg-slate-800/50 rounded-2xl p-1.5 border border-white/5">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2.5 rounded-xl font-bold transition-all duration-500 ${mode === "login" ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/30" : "text-slate-400 hover:text-slate-200"}`}
              >
                Login
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 py-2.5 rounded-xl font-bold transition-all duration-500 ${mode === "signup" ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/30" : "text-slate-400 hover:text-slate-200"}`}
              >
                Signup
              </button>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-center text-sm font-bold animate-shake">
              {error}
            </div>
          )}
          {msg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-center text-sm font-bold">
              {msg}
            </div>
          )}

          <div className="space-y-4">
            {/* LOGIN */}
            {mode === "login" && (
              <>
                <Input icon={<EmailIcon />} name="email" value={form.email} placeholder="Email / Username" onChange={handleChange} />
                <Input icon={<LockIcon />} name="password" type="password" value={form.password} placeholder="Password" onChange={handleChange} />
                <Link text="Forgot Password?" onClick={() => setMode("forgot")} />

                <div className="flex gap-4 pt-2">
                  <Button text="Cancel" variant="secondary" onClick={resetForm} />
                  <Button text="Login" onClick={handleLogin} />
                </div>
              </>
            )}

            {/* SIGNUP */}
            {mode === "signup" && (
              <>
                <Input icon={<EmailIcon />} name="email" value={form.email} placeholder="Email Address" onChange={handleChange} />
                <Input icon={<PersonIcon />} name="username" value={form.username} placeholder="Username" onChange={handleChange} />
                <Input icon={<LockIcon />} name="password" type="password" value={form.password} placeholder="Password" onChange={handleChange} />
                <Input icon={<LockIcon />} name="confirmPassword" type="password" value={form.confirmPassword} placeholder="Confirm Password" onChange={handleChange} />
                <div className="flex gap-4 pt-2">
                  <Button text="Cancel" variant="secondary" onClick={resetForm} />
                  <Button text="Create Account" onClick={handleSignup} />
                </div>
              </>
            )}

            {/* FORGOT */}
            {mode === "forgot" && (
              <>
                <Input icon={<EmailIcon />} name="email" value={form.email} placeholder="Enter your email" onChange={handleChange} />
                <div className="flex gap-4 pt-2">
                  <Button text="Back" variant="secondary" onClick={() => setMode("login")} />
                  <Button text="Send OTP" onClick={handleForgot} />
                </div>
              </>
            )}

            {/* OTP */}
            {mode === "otp" && (
              <>
                <Input icon={<KeyIcon />} value={otp} placeholder="Enter 6-digit OTP" onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} />
                <div className="text-right px-2">
                  {timer > 0 ? (
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Resend in {timer}s</span>
                  ) : (
                    <button onClick={handleResendOtp} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">Resend OTP</button>
                  )}
                </div>
                <Button text="Verify Access" onClick={handleVerifyOTP} />
              </>
            )}

            {/* RESET */}
            {mode === "reset" && (
              <>
                <Input icon={<LockIcon />} name="password" type="password" value={form.password} placeholder="New Password" onChange={handleChange} />
                <Input icon={<LockIcon />} name="confirmPassword" type="password" value={form.confirmPassword} placeholder="Confirm New Password" onChange={handleChange} />
                <Button text="Update Credentials" onClick={handleReset} />
              </>
            )}
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
          </div>

          {/* GOOGLE LOGIN */}
          <button
            onClick={() => window.location.href = "http://localhost:8080/oauth2/authorization/google"}
            className="group relative w-full overflow-hidden bg-slate-800/40 hover:bg-slate-800/60 border border-white/5 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
            <GoogleIcon className="text-white group-hover:scale-110 transition-transform" />
            <span className="text-white font-bold tracking-tight">Continue with Google</span>
          </button>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </main>
  );
}

/* Reusable Components */
const Input = ({ icon, type, ...props }) => {
  const [show, setShow] = React.useState(false);
  const isPassword = type === "password";
  const actualType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="group relative flex items-center transition-all duration-300">
      <div className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors z-10">
        {React.cloneElement(icon, { sx: { fontSize: 20 } })}
      </div>
      <input
        type={actualType}
        className={`w-full bg-slate-800/40 border border-white/5 rounded-2xl py-4 pl-12 ${isPassword ? 'pr-12' : 'pr-4'} text-white placeholder:text-slate-500 outline-none focus:bg-slate-800/60 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 font-medium`}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 text-slate-500 hover:text-indigo-400 transition-colors z-10"
        >
          {show ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
        </button>
      )}
    </div>
  );
};

const Button = ({ text, onClick, variant = "primary" }) => (
  <button
    onClick={onClick}
    className={`group relative overflow-hidden w-full py-4 rounded-2xl font-black tracking-tight transition-all duration-500 active:scale-95 ${variant === "primary"
        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:bg-indigo-500"
        : "bg-slate-800/40 text-slate-300 border border-white/5 hover:bg-slate-800/60 hover:text-white"
      }`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
    {text}
  </button>
);

const Link = ({ text, onClick }) => (
  <div className="flex justify-end">
    <button
      onClick={onClick}
      className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 hover:text-blue-400 hover:underline transition-colors duration-300 py-2"
    >
      {text}
    </button>
  </div>
);