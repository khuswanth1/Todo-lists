import React, { useEffect, useState, useCallback } from "react";
import Header from "../components/Header";
import toast from "react-hot-toast";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  AccessTime as AccessTimeIcon,
  Assignment as AssignmentIcon,
  Subtitles as SubtitlesIcon,
  FiberManualRecord as FiberManualRecordIcon,
  AddCircle as AddCircleIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Layers as LayersIcon,
  Save as SaveIcon,
  SwapHoriz as SwapHorizIcon,
  DragIndicator as DragIndicatorIcon,
  SubdirectoryArrowRight as SubdirectoryIcon,
  Notifications as NotificationsIcon,
  Check as CheckIcon
} from "@mui/icons-material";
import PushNotificationButton from "../components/PushNotificationButton";
import ProfileEditModal from "../components/ProfileEditModal";

export default function Dashboard({ token, setToken, theme, setTheme, isSystemDark }) {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeParentId, setActiveParentId] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueTime: "",
    status: "TODO",
    parentTaskId: null
  });

  const [subTaskForm, setSubTaskForm] = useState({
    title: "",
    description: "",
    priority: "Low",
    dueTime: ""
  });

  // Notification State (Tracks multiple alert levels for each task)
  const [notifiedTasks, setNotifiedTasks] = useState({}); // { taskId: [levels_triggered] }

  // Notification Permission State
  const [notifStatus, setNotifStatus] = useState("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotifStatus(Notification.permission);
    }
  }, []);

  const requestNotifPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(status => {
        setNotifStatus(status);
      });
    }
  };


  // Send Email Notification (Calls Backend)
  const triggerEmailNotification = async (task, subjectOverride, messageOverride) => {
    if (!user || !user.email) {
      console.warn("Skipping email notification: No user email available.");
      return;
    }

    const subject = subjectOverride || `Urgent: Mission "${task.title}" Deadline`;
    const message = messageOverride || `Hello ${user.name}, your mission "${task.title}" is scheduled to conclude soon (${task.dueTime ? new Date(task.dueTime).toLocaleString() : 'N/A'}). Please ensure all objectives are met.`;

    console.log(`🚀 Triggering email notification for task: ${task.title} to ${user.email}`);
    try {
      const res = await fetch("http://localhost:8080/auth/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          to: user.email,
          subject: subject,
          message: message
        })
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("Email notification endpoint returned error:", errorData);
      } else {
        console.log("✅ Email notification request sent to backend successfully.");
      }
    } catch (err) {
      console.error("❌ Email notification fetch failed:", err);
    }
  };

  // Send Push Notification (Calls Backend)
  const triggerPushNotification = useCallback(async (task, level) => {
    const currentPermission = "Notification" in window ? Notification.permission : "default";
    if (currentPermission !== "granted" || !user?.fcmToken) return;

    const titles = {
      overdue: "MISSION OVERDUE",
      critical: "CRITICAL ALERT",
      active: "SYSTEM TEST"
    };

    const images = {
      overdue: "https://cdn-icons-png.flaticon.com/512/595/595067.png", // Red Warning
      critical: "https://cdn-icons-png.flaticon.com/512/564/564619.png", // Amber Alert
      active: "https://cdn-icons-png.flaticon.com/512/190/190411.png" // Green Success
    };

    const title = titles[level] || "Mission Update";
    const message = level === "active" ? "Your device is now synced with the strategic command center." : `Task "${task.title}" is ${level}. Take immediate action.`;
    const image = images[level];

    try {
      await fetch("http://localhost:8080/auth/send-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          email: user.email,
          title,
          message,
          image,
          link: "http://localhost:5173/dashboard"
        })
      });
      console.log("Rich push notification request sent to backend.");
    } catch (err) {
      console.error("Push notification fetch failed:", err);
    }
  }, [user, token]);

  // Deadline Monitor
  useEffect(() => {
    const monitor = setInterval(() => {
      if (!tasks.length) return;

      const now = new Date();
      tasks.forEach(task => {
        if (!task.dueTime || task.status === "DONE") return;

        const due = new Date(task.dueTime);
        const diffMs = due - now;
        const diffMins = Math.floor(diffMs / (1000 * 60));

        const taskLevels = notifiedTasks[task.id] || [];
        let newLevel = null;

        // Multi-level notification logic
        if (diffMins <= 0 && !taskLevels.includes("overdue")) {
          newLevel = "overdue";
        } else if (diffMins > 0 && diffMins <= 5 && !taskLevels.includes("critical")) {
          newLevel = "critical";
        } else if (diffMins > 5 && diffMins <= 30 && !taskLevels.includes("warning")) {
          newLevel = "warning";
        }

        if (newLevel) {
          // 🔊 Play Alert Sound for time-based warnings
          try {
            const alertAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            alertAudio.volume = 0.4;
            alertAudio.play().catch(e => console.warn("Auto-play alert blocked:", e));
          } catch (err) {
            console.error("Alert audio error:", err);
          }

          // triggerEmailNotification(task); // Removed per user request: only send on new task creation

          if (newLevel === "critical" || newLevel === "overdue") {
            triggerPushNotification(task, newLevel);
          }

          // Native Desktop Alert
          if (Notification.permission === "granted") {
            const levels = { warning: "Strategic Warning", critical: "Critical Alert", overdue: "Mission Overdue" };
            new Notification(levels[newLevel] || "Mission Update", {
              body: `Mission "${task.title}" is ${newLevel}. Strategic adjustment required.`,
              icon: "/logo192.png",
              silent: true // Audio is handled separately in monitor
            });
          }

          setNotifiedTasks(prev => ({
            ...prev,
            [task.id]: [...(prev[task.id] || []), newLevel]
          }));
        }
      });
    }, 15000); // More frequent check for higher precision

    return () => clearInterval(monitor);
  }, [tasks, notifiedTasks, triggerPushNotification]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8080/auth/profile", {
        headers: { Authorization: "Bearer " + token }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem("token");
        setToken(null);
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  }, [token, setToken]);

  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`http://localhost:8080/tasks?userId=${user.id}`, {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  const handleCreateOrUpdate = async (e) => {
    if (e) e.preventDefault();
    const isEdit = !!editingTask;
    const url = isEdit ? `http://localhost:8080/tasks/${editingTask.id}` : "http://localhost:8080/tasks";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          ...form,
          userId: user.id,
          dueTime: form.dueTime || null
        })
      });

      if (res.ok) {
        // Send email for both creation and modification
        triggerEmailNotification(
          { title: form.title, dueTime: form.dueTime },
          isEdit ? `Mission Updated: ${form.title}` : `Mission Initiated: ${form.title}`,
          isEdit
            ? `Hello ${user.name}, the parameters for your mission "${form.title}" have been updated.`
            : `Hello ${user.name}, a new mission has been added to your log: "${form.title}".`
        );
        resetForms();
        fetchTasks();
      }
    } catch (err) {
      console.error("Error saving task", err);
    }
  };

  const resetForms = () => {
    setForm({ title: "", description: "", priority: "Medium", dueTime: "", status: "TODO", parentTaskId: null });
    setSubTaskForm({ title: "", description: "", priority: "Low", dueTime: "" });
    setShowAddForm(false);
    setEditingTask(null);
    setActiveParentId(null);
  };

  const updatePriority = async (task, newPriority) => {
    try {
      await fetch(`http://localhost:8080/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ ...task, priority: newPriority })
      });
      fetchTasks();
    } catch (err) {
      console.error("Error updating priority", err);
    }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";

    // 🔊 Play sound ONLY when marking as DONE
    let isPlaying = false;

    if (newStatus === "DONE" && !isPlaying) {
      try {
        isPlaying = true;
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3");
        audio.volume = 0.5;
        audio.currentTime = 0; // ✅ prevent overlap
        audio.play().finally(() => isPlaying = false);
      } catch (err) {
        console.error("Audio error:", err);
      }
    }

    try {
      await fetch(`http://localhost:8080/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ ...task, status: newStatus })
      });

      fetchTasks();
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const moveTask = async (taskId, newParentId, newPos = null) => {
    if (!taskId) return;
    try {
      const config = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          parentTaskId: newParentId,
          position: newPos
        })
      };
      const res = await fetch(`http://localhost:8080/tasks/${taskId}`, config);
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error("Critical movement failure:", err);
    }
  };

  const addSubTask = async (e) => {
    if (e) e.preventDefault();
    if (!subTaskForm.title) return;

    try {
      const res = await fetch("http://localhost:8080/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          title: subTaskForm.title,
          description: subTaskForm.description,
          priority: subTaskForm.priority,
          dueTime: subTaskForm.dueTime || null,
          userId: user.id,
          parentTaskId: activeParentId,
          status: "TODO"
        })
      });

      if (res.ok) {
        triggerEmailNotification(
          { title: subTaskForm.title, dueTime: subTaskForm.dueTime },
          `Milestone Added: ${subTaskForm.title}`,
          `Hello ${user.name}, a new milestone objective has been added to your mission log: "${subTaskForm.title}".`
        );
        resetForms();
        fetchTasks();
      }
    } catch (err) {
      console.error("Error adding subtask", err);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await fetch(`http://localhost:8080/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });
      fetchTasks();
    } catch (err) {
      console.error("Error deleting task", err);
    }
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "Medium",
      dueTime: formatDateForInput(task.dueTime),
      status: task.status || "TODO",
      parentTaskId: task.parentTaskId
    });
    setShowAddForm(true);
  };

  useEffect(() => {
    if (token) fetchProfile();
  }, [token, fetchProfile]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  // Color & Sort System
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };

  const priorityStyles = {
    High: {
      border: "border-l-[6px] border-l-rose-500",
      badge: "bg-rose-100 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
      card: "bg-rose-50/30",
      shadow: "hover:shadow-rose-100"
    },
    Medium: {
      border: "border-l-[6px] border-l-amber-500",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
      card: "bg-amber-50/30",
      shadow: "hover:shadow-amber-100"
    },
    Low: {
      border: "border-l-[6px] border-l-emerald-500",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      card: "bg-emerald-50/30",
      shadow: "hover:shadow-emerald-100"
    }
  };

  const handleDragStart = (e, taskId, isMain) => {
    e.stopPropagation(); // ✅ FIX
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("isMain", isMain.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ FIX

    if (draggedTaskId && draggedTaskId !== targetId) {
      setDropTargetId(targetId);
    }
  };

  const handleDrop = async (e, targetId, targetIsMain = false) => {
    e.preventDefault();
    e.stopPropagation(); // ✅ FIX

    const sourceId = parseInt(e.dataTransfer.getData("taskId"));
    const sourceIsMain = e.dataTransfer.getData("isMain") === "true";

    if (!sourceId || sourceId === targetId) return;

    const sourceTask = tasks.find(t => t.id === sourceId);
    const targetTask = tasks.find(t => t.id === targetId);

    if (!sourceTask || !targetTask) return;

    try {
      // ✅ MAIN ↔ MAIN swap
      if (sourceIsMain && targetIsMain) {
        await moveTask(sourceId, null, targetTask.position ?? 0);
        await moveTask(targetId, null, sourceTask.position ?? 0);
      }

      // ✅ SUB ↔ SUB (same parent only)
      else if (!sourceIsMain && !targetIsMain) {
        if (sourceTask.parentTaskId === targetTask.parentTaskId) {
          await moveTask(sourceId, sourceTask.parentTaskId, targetTask.position ?? 0);
          await moveTask(targetId, targetTask.parentTaskId, sourceTask.position ?? 0);
        }
      }

      setDropTargetId(null);
      fetchTasks();
    } catch (err) {
      console.error("Swap failed:", err);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDropTargetId(null);
  };
  const handleDropOnDashboard = (e) => {
    if (e.target === e.currentTarget) {
      const sourceId = parseInt(e.dataTransfer.getData("taskId"));
      const sourceIsMain = e.dataTransfer.getData("isMain") === "true";
      // Promote subtask to standalone mission
      if (sourceId && !sourceIsMain) moveTask(sourceId, null, -1);
    }
  };

  // Sorting and Grouping
  const sortedTasks = [...tasks].sort((a, b) => {
    // Primary Sort: User-defined Arrange/Rearrange Position
    const posA = a.position !== null && a.position !== undefined ? a.position : 9999;
    const posB = b.position !== null && b.position !== undefined ? b.position : 9999;

    if (posA !== posB) return posA - posB;

    // Secondary Sort: Priority
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const mainTasks = tasks
    .filter((t) => t.parentTaskId === null)
    .filter((t) => {
      const q = searchQuery.toLowerCase();
      const titleMatch = t.title.toLowerCase().includes(q);
      const descMatch = t.description?.toLowerCase().includes(q);

      // If the parent matches, show it.
      if (titleMatch || descMatch) return true;

      // Also show the parent if any of its children match
      const children = tasks.filter(sub => sub.parentTaskId === t.id);
      return children.some(sub =>
        sub.title.toLowerCase().includes(q) ||
        sub.description?.toLowerCase().includes(q)
      );
    });

  const getSubTasks = (parentId) =>
    tasks
      .filter((t) => t.parentTaskId === parentId)
      .filter(t => {
        const q = searchQuery.toLowerCase();
        // If the query is empty, show all subtasks
        if (!q) return true;

        // Otherwise, show subtask if it matches OR if parent matched (handled by parent logic)
        return t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      });

  return (
    <main
      className={`min-h-screen font-sans pb-24 transition-colors duration-500
        ${theme === 'dark' || (theme === 'system' && isSystemDark)
          ? 'bg-slate-950 text-slate-100'
          : 'bg-[#f8fafc] text-slate-900'
        }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropOnDashboard}
    >
      <Header
        user={user}
        setToken={setToken}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onEditProfile={() => setShowEditProfile(true)}
        theme={theme}
        setTheme={setTheme}
        isSystemDark={isSystemDark}
      />
      <PushNotificationButton token={token} onTokenSaved={fetchProfile} permission={notifStatus} />

      <div className="max-w-6xl mx-auto px-6 mt-8 pointer-events-none children:pointer-events-auto">
        <div className="pointer-events-auto">
          {/* STATS BAR & NOTIFICATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Active Missions", val: mainTasks.filter(t => !t.dueTime || new Date(t.dueTime) >= new Date()).length, icon: <LayersIcon />, color: "text-indigo-600 bg-indigo-50" },
              { label: "Critical Path", val: tasks.filter(t => t.priority === "High" && (!t.dueTime || new Date(t.dueTime) >= new Date())).length, icon: <ErrorIcon />, color: "text-rose-600 bg-rose-50" },
              { label: "Completed", val: tasks.filter(t => t.dueTime && new Date(t.dueTime) < new Date()).length, icon: <CheckCircleIcon />, color: "text-emerald-600 bg-emerald-50" },
            ].map((stat, i) => (
              <div key={i} className={`p-4 rounded-3xl shadow-sm flex items-center gap-4 border transition-all duration-300 hover:shadow-md
                ${theme === 'dark' || (theme === 'system' && isSystemDark)
                  ? 'bg-slate-900 border-slate-800 shadow-black/20'
                  : 'bg-white border-slate-100 shadow-slate-200/50'
                }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${stat.color} shadow-inner`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1.5">{stat.label}</p>
                  <h4 className={`text-2xl font-black leading-none ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-white' : 'text-slate-800'}`}>{stat.val}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* HEADER SECTION */}
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-white' : 'text-slate-800'}`}>Mission Boards</h2>
            <button
              onClick={() => { setEditingTask(null); setForm({ title: "", description: "", priority: "Medium", dueTime: "", status: "TODO", parentTaskId: null }); setShowAddForm(true); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 text-xs
                ${theme === 'dark' || (theme === 'system' && isSystemDark)
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                  : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-slate-200'
                }`}
            >
              <AddIcon fontSize="small" /> New Mission
            </button>
          </div>
        </div>

        {/* COMPREHENSIVE EDIT/CREATE MODAL */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 pointer-events-auto">
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-md p-7 animate-in zoom-in-95 duration-200 border max-h-[90vh] overflow-y-auto scrollbar-hide
              ${theme === 'dark' || (theme === 'system' && isSystemDark)
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-white text-slate-800'
              }`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                    ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}
                  `}>
                    {editingTask ? <EditIcon sx={{ fontSize: 24 }} /> : <AssignmentIcon sx={{ fontSize: 24 }} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">
                      {editingTask ? "Refine Resource" : "Initiate Mission"}
                    </h2>
                    <p className="text-slate-400 font-bold text-[10px]">Strategic parameters and placement.</p>
                  </div>
                </div>
                <button onClick={resetForms} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500'}
                `}>
                  <CloseIcon sx={{ fontSize: 20 }} />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="space-y-3">
                <div className={`flex gap-2 p-3 rounded-2xl border
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}
                `}>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={`flex-1 rounded-xl px-4 py-3 font-black outline-none text-base shadow-sm border transition-all
                      ${theme === 'dark' || (theme === 'system' && isSystemDark)
                        ? 'bg-slate-800 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5'}
                    `}
                    placeholder="Task Identity..."
                  />
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className={`rounded-xl px-3 py-3 font-black outline-none text-[11px] shadow-sm border cursor-pointer transition-all
                      ${theme === 'dark' || (theme === 'system' && isSystemDark)
                        ? 'bg-slate-800 border-slate-700/50 text-slate-300 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200 text-slate-600 focus:border-indigo-500/50'}
                    `}
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟠 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                <div className={`p-3 rounded-2xl border space-y-1
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}
                `}>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <AccessTimeIcon sx={{ fontSize: 12 }} /> Mission Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={form.dueTime}
                    onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                    className={`w-full rounded-xl px-4 py-3 font-black outline-none text-xs shadow-sm border cursor-pointer transition-all
                      ${theme === 'dark' || (theme === 'system' && isSystemDark)
                        ? 'bg-slate-800 border-slate-700/50 text-slate-300 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200 text-slate-600 focus:border-indigo-500/50'}
                    `}
                  />
                </div>

                <div className={`p-3 rounded-2xl border space-y-1
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}
                `}>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <SwapHorizIcon sx={{ fontSize: 12 }} /> Placement Location
                  </label>
                  <select
                    value={form.parentTaskId || ""}
                    onChange={(e) => setForm({ ...form, parentTaskId: e.target.value ? parseInt(e.target.value) : null })}
                    className={`w-full rounded-xl px-4 py-3 font-black outline-none text-xs shadow-sm border cursor-pointer transition-all
                      ${theme === 'dark' || (theme === 'system' && isSystemDark)
                        ? 'bg-slate-800 border-slate-700/50 text-slate-300 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500/50'}
                    `}
                  >
                    <option value="">Main Dashboard (Standalone Mission)</option>
                    {mainTasks.filter(t => t.id !== editingTask?.id).map(t => (
                      <option key={t.id} value={t.id}>Subtask of: {t.title}</option>
                    ))}
                  </select>
                </div>

                <div className={`p-3 rounded-2xl border space-y-1
                  ${theme === 'dark' || (theme === 'system' && isSystemDark) ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}
                `}>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <SubtitlesIcon sx={{ fontSize: 12 }} /> Strategic Brief
                  </label>
                  <textarea
                    rows="2"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={`w-full rounded-xl px-4 py-3 font-bold outline-none resize-none shadow-sm border text-xs transition-all
                      ${theme === 'dark' || (theme === 'system' && isSystemDark)
                        ? 'bg-slate-800 border-slate-700/50 text-slate-400 placeholder:text-slate-600 focus:border-indigo-500/50'
                        : 'bg-white border-slate-200 text-slate-500 focus:border-indigo-500/50'}
                    `}
                    placeholder="Mission objectives..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForms}
                    className={`flex-1 font-black py-4 rounded-[1.5rem] shadow-lg transition-all active:scale-[0.98] text-sm border
                      ${theme === 'dark' || (theme === 'system' && isSystemDark)
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-[2] font-black py-4 rounded-[1.5rem] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base
                      ${theme === 'dark' || (theme === 'system' && isSystemDark)
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                        : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-indigo-100'
                      }`}
                  >
                    {editingTask ? <SaveIcon sx={{ fontSize: 20 }} /> : <AddIcon sx={{ fontSize: 20 }} />}
                    {editingTask ? "Update Mission" : "Initiate Mission"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MILESTONE CREATION MODAL */}
        {activeParentId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[201] flex items-center justify-center p-4 pointer-events-auto">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-7 animate-in zoom-in-95 duration-200 border border-white max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <AddCircleIcon sx={{ fontSize: 24 }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Initiate Milestone</h2>
                    <p className="text-slate-400 font-bold text-[10px]">Specific objective for this mission.</p>
                  </div>
                </div>
                <button onClick={resetForms} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                  <CloseIcon sx={{ fontSize: 20 }} />
                </button>
              </div>
              <form onSubmit={addSubTask} className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Objective Identity</label>
                  <input
                    autoFocus
                    required
                    placeholder="E.g. Phase 1 Verification"
                    value={subTaskForm.title}
                    onChange={(e) => setSubTaskForm({ ...subTaskForm, title: e.target.value })}
                    className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-800 outline-none text-xs shadow-sm border border-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                      <FiberManualRecordIcon sx={{ fontSize: 10 }} /> Urgency
                    </label>
                    <select
                      value={subTaskForm.priority}
                      onChange={(e) => setSubTaskForm({ ...subTaskForm, priority: e.target.value })}
                      className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-600 outline-none text-xs shadow-sm border border-white cursor-pointer"
                    >
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟠 Med</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                      <AccessTimeIcon sx={{ fontSize: 12 }} /> Timeline
                    </label>
                    <input
                      type="datetime-local"
                      value={subTaskForm.dueTime}
                      onChange={(e) => setSubTaskForm({ ...subTaskForm, dueTime: e.target.value })}
                      className="w-full bg-white rounded-xl px-4 py-3 font-black text-slate-600 outline-none text-xs shadow-sm border border-white cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <SubtitlesIcon sx={{ fontSize: 12 }} /> Milestone Specs
                  </label>
                  <textarea
                    rows="2"
                    value={subTaskForm.description}
                    onChange={(e) => setSubTaskForm({ ...subTaskForm, description: e.target.value })}
                    className="w-full bg-white rounded-xl px-4 py-3 font-bold text-slate-500 outline-none resize-none shadow-sm border border-white text-xs"
                    placeholder="Milestone requirements..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForms}
                    className="flex-1 bg-white text-slate-600 font-black py-4 rounded-[1.5rem] border border-slate-200 hover:bg-slate-50 shadow-sm transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-[1.5rem] hover:bg-indigo-600 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                  >
                    <AddCircleIcon sx={{ fontSize: 20 }} /> Commit Milestone
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MISSION BOARDS */}
        <div className="grid grid-cols-1 gap-6 pointer-events-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : (
            mainTasks.map((task) => {
              const styles = priorityStyles[task.priority] || priorityStyles.Medium;

              return (
                <div key={task.id} className="transition-all duration-300">
                  <article
                    className={`p-4 md:p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 border-2 ${styles.border} 
                      ${theme === 'dark' || (theme === 'system' && isSystemDark)
                        ? 'bg-slate-900 border-slate-800'
                        : `border-slate-100 ${styles.card}`
                      }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              const next = task.priority === "High" ? "Low" : task.priority === "Medium" ? "High" : "Medium";
                              updatePriority(task, next);
                            }}
                            className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 transition-all hover:brightness-95 ${styles.badge}`}
                          >
                            <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                            {task.priority}
                          </button>
                          <span className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <AccessTimeIcon sx={{ fontSize: 14 }} />
                            {task.dueTime ? new Date(task.dueTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "TBD"}
                          </span>
                          {task.dueTime && task.status !== "DONE" && (new Date(task.dueTime) - new Date()) < 3600000 && (new Date(task.dueTime) - new Date()) > 0 && (
                            <span className="animate-pulse px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full shadow-lg shadow-rose-200">
                              DUE SOON
                            </span>
                          )}
                        </div>

                        <div
                          onClick={() => toggleStatus(task)}
                          className="pl-2 flex flex-col cursor-pointer group/title"
                        >
                          <h2 className={`text-2xl font-black transition-all 
                            ${(task.status === "DONE" || (task.dueTime && new Date(task.dueTime) < new Date()))
                              ? "line-through decoration-red-500 decoration-[3px] text-slate-500"
                              : theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-white hover:text-indigo-400' : 'text-slate-800 hover:text-indigo-600'
                            }`}>
                            {task.title}
                          </h2>
                          {task.description && (
                            <p className={`font-bold text-sm leading-relaxed mt-2 max-w-2xl transition-all 
                              ${(task.status === "DONE" || (task.dueTime && new Date(task.dueTime) < new Date()))
                                ? "line-through decoration-red-400 decoration-[1.5px] text-slate-500"
                                : theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row gap-2">
                        <button
                          onClick={() => setActiveParentId(task.id)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm border transition-all active:scale-90
                            ${theme === 'dark' || (theme === 'system' && isSystemDark)
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500 hover:text-white hover:border-indigo-400'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'}
                          `}
                          title="New Milestone"
                        >
                          <AddCircleIcon sx={{ fontSize: 20 }} />
                        </button>
                        <button
                          onClick={() => startEdit(task)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm border transition-all active:scale-90
                            ${theme === 'dark' || (theme === 'system' && isSystemDark)
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500 hover:text-white hover:border-blue-400'
                              : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-500'}
                          `}
                          title="Edit Task"
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm border transition-all active:scale-90
                            ${theme === 'dark' || (theme === 'system' && isSystemDark)
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-white hover:border-rose-400'
                              : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white hover:border-rose-500'}
                          `}
                          title="Delete Task"
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </button>
                      </div>
                    </div>

                    {/* MILESTONE LIST */}
                    {getSubTasks(task.id).length > 0 && (
                      <div className="mt-6 pt-4 border-t-2 border-white/50 space-y-3">
                        <div className="flex items-center gap-2 ml-2">
                          <div className="w-6 h-[2px] bg-slate-200"></div>
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                            <SubdirectoryIcon sx={{ fontSize: 14 }} /> Active Objectives
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                          {getSubTasks(task.id).map((sub) => {
                            const subS = priorityStyles[sub.priority] || priorityStyles.Low;

                            return (
                              <div
                                key={sub.id}
                                className={`flex flex-col p-4 rounded-2xl hover:shadow-lg transition-all duration-300 border shadow-sm border-white/50 group/sub ${subS.card}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => {
                                        const next = sub.priority === "High" ? "Low" : sub.priority === "Medium" ? "High" : "Medium";
                                        updatePriority(sub, next);
                                      }}
                                      className={`w-3.5 h-3.5 rounded-full ${subS.dot} hover:scale-125 transition-transform cursor-pointer shadow-sm`}
                                    ></button>
                                    <div
                                      onClick={() => toggleStatus(sub)}
                                      className="flex flex-col cursor-pointer group/subtitle"
                                    >
                                      <span className={`font-black text-[13px] tracking-tight leading-none transition-all 
                                        ${(sub.status === "DONE" || (sub.dueTime && new Date(sub.dueTime) < new Date()))
                                          ? "line-through decoration-red-500 decoration-[2px] text-slate-500"
                                          : theme === 'dark' || (theme === 'system' && isSystemDark) ? 'text-slate-200 hover:text-indigo-400' : 'text-slate-700 hover:text-indigo-600'
                                        }`}>
                                        {sub.title}
                                      </span>
                                      {sub.description && (
                                        <span className={`text-[10px] font-bold mt-1 line-clamp-1 transition-all ${(sub.status === "DONE" || (sub.dueTime && new Date(sub.dueTime) < new Date())) ? "line-through decoration-red-400 decoration-[1px] text-slate-300" : "text-slate-400"}`}>
                                          {sub.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEdit(sub)}
                                      className="text-slate-300 hover:text-indigo-600 transition-colors p-1.5"
                                    >
                                      <EditIcon sx={{ fontSize: 16 }} />
                                    </button>
                                    <button
                                      onClick={() => deleteTask(sub.id)}
                                      className="text-slate-300 hover:text-rose-500 transition-colors p-1.5"
                                    >
                                      <DeleteIcon sx={{ fontSize: 18 }} />
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between ml-6">
                                  <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                    <AccessTimeIcon sx={{ fontSize: 10 }} />
                                    {sub.dueTime ? new Date(sub.dueTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "No Deadline"}
                                  </div>
                                  {sub.dueTime && sub.status !== "DONE" && (new Date(sub.dueTime) - new Date()) < 3600000 && (new Date(sub.dueTime) - new Date()) > 0 && (
                                    <span className="animate-pulse px-1.5 py-0.5 bg-rose-500 text-white text-[7px] font-black rounded-full">
                                      SOON
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              );
            })
          )}
        </div>

        {showEditProfile && (
          <ProfileEditModal
            user={user}
            token={token}
            theme={theme}
            isSystemDark={isSystemDark}
            onClose={() => setShowEditProfile(false)}
            onComplete={() => {
              setShowEditProfile(false);
              fetchProfile();
              toast.success("Identity updated successfully");
            }}
          />
        )}
      </div>
    </main>
  );
}