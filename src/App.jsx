import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Create from "./pages/Create";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Theme Management
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");
  const [isSystemDark, setIsSystemDark] = useState(window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (mode) => {
      if (mode === "dark") {
        root.classList.add("dark");
      } else if (mode === "light") {
        root.classList.remove("dark");
      } else {
        root.classList.toggle("dark", isSystemDark);
      }
    };
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme, isSystemDark]);

  const fetchProfile = async (tk) => {
    try {
      const res = await fetch("http://localhost:8080/auth/profile", {
        headers: { Authorization: "Bearer " + tk }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        const errData = await res.json();
        console.error("Profile fetch rejected:", errData.error);
        localStorage.removeItem("token");
        setToken(null);
      }
    } catch (err) {
      console.error("Network error fetching profile", err);
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      setToken(urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">Loading...</div>;

  if (!token) return <Login setToken={setToken} theme={theme} isSystemDark={isSystemDark} />;

  // ✅ If user is logged in but has no mobile number, redirect to Create page to fill profile
  if (user && !user.mobile) {
    return <Create token={token} onComplete={() => fetchProfile(token)} theme={theme} isSystemDark={isSystemDark} />;
  }

  return <Dashboard token={token} setToken={setToken} theme={theme} setTheme={setTheme} isSystemDark={isSystemDark} />;
}