/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Download,
  Heart,
  X,
  Settings as SettingsIcon,
  Palette,
  Type as TypeIcon,
  Image as ImageIcon,
  Save,
  Filter,
  Mail,
  Upload,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface CheckIn {
  id: number;
  name: string;
  group_name: string;
  timestamp: string;
}

interface AppSettings {
  app_title: string;
  encouraging_verse: string;
  verse_reference: string;
  bg_url: string;
  primary_color: string;
  logo_url: string;
  thank_you_message: string;
  thank_you_verse: string;
  thank_you_reference: string;
}

export default function App() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminTab, setAdminTab] = useState<'roster' | 'settings'>('roster');
  
  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    app_title: 'CPI Check in',
    encouraging_verse: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
    verse_reference: 'Galatians 6:9',
    bg_url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=2000',
    primary_color: '#4f46e5',
    logo_url: '',
    thank_you_message: 'Thank you for being here!',
    thank_you_verse: 'Each of you should use whatever gift you have received to serve others.',
    thank_you_reference: '1 Peter 4:10'
  });

  // Filter state
  const [exportDate, setExportDate] = useState('');
  const [exportGroup, setExportGroup] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailing, setEmailing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchCheckIns();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const fetchCheckIns = async () => {
    try {
      const res = await fetch('/api/check-ins');
      const data = await res.json();
      setCheckIns(data);
    } catch (err) {
      console.error('Failed to fetch check-ins', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, group_name: group })
      });
      if (res.ok) {
        setName('');
        setGroup('');
        setShowCelebration(true);
        
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [settings.primary_color, '#10b981', '#f59e0b']
        });

        if (isAdmin) fetchCheckIns();
      }
    } catch (err) {
      console.error('Check-in failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'cpi2026') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (exportDate) params.append('date', exportDate);
    if (exportGroup) params.append('group', exportGroup);
    window.location.href = `/api/export?${params.toString()}`;
  };

  const handleEmailExport = async () => {
    if (!emailRecipient) {
      alert('Please enter an email address');
      return;
    }
    setEmailing(true);
    try {
      const res = await fetch('/api/email-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailRecipient,
          date: exportDate,
          group: exportGroup
        })
      });
      if (res.ok) {
        alert('Export emailed successfully!');
      } else {
        const data = await res.json();
        alert(`Failed to email export: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to email export', err);
      alert('Failed to email export. Please check your SMTP settings.');
    } finally {
      setEmailing(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...settings, logo_url: data.logo_url });
        alert('Logo uploaded successfully!');
      }
    } catch (err) {
      console.error('Failed to upload logo', err);
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save settings', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const uniqueGroups = Array.from(new Set(checkIns.map(ci => ci.group_name)));

  return (
    <div className="min-h-screen relative font-sans selection:bg-indigo-100" style={{ '--primary': settings.primary_color } as any}>
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          src={settings.bg_url || "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=2000"} 
          alt="Community Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[3px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/20" />
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-12 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: settings.primary_color }} />
              
              <button 
                onClick={() => setShowCelebration(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={24} />
              </button>

              <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-indigo-50 rounded-[2rem]" style={{ color: settings.primary_color }}>
                <Heart size={48} fill="currentColor" />
              </div>

              <h2 className="text-4xl font-black mb-4 tracking-tight text-slate-900">{settings.thank_you_message}</h2>
              <p className="text-slate-600 text-xl leading-relaxed mb-10">
                "{settings.thank_you_verse}" <br/>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">— {settings.thank_you_reference}</span>
              </p>

              <button 
                onClick={() => setShowCelebration(false)}
                className="w-full py-5 text-white rounded-2xl font-black text-lg transition-all shadow-xl"
                style={{ backgroundColor: settings.primary_color }}
              >
                God Bless You!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl"
            >
              <h2 className="text-2xl font-black mb-6">Admin Access</h2>
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter admin password"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 text-white rounded-2xl font-bold transition-all shadow-lg"
                    style={{ backgroundColor: settings.primary_color }}
                  >
                    Login
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg" style={{ color: settings.primary_color }}>
                <ClipboardCheck size={24} />
              </div>
            )}
            <span className="font-bold text-2xl tracking-tight text-white">{settings.app_title}</span>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-4">
              <div className="flex bg-white/10 rounded-xl p-1 border border-white/10">
                <button 
                  onClick={() => setAdminTab('roster')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${adminTab === 'roster' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/60 hover:text-white'}`}
                >
                  Roster
                </button>
                <button 
                  onClick={() => setAdminTab('settings')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${adminTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/60 hover:text-white'}`}
                >
                  Settings
                </button>
              </div>
              <button 
                onClick={() => setIsAdmin(false)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/10"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={`relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24 ${isAdmin ? 'flex flex-col gap-12' : 'flex flex-col items-center'}`}>
        <AnimatePresence mode="wait">
          {!isAdmin ? (
            <motion.div
              key="volunteer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center space-y-12"
            >
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
                  {settings.app_title.split(' ').map((word, i) => (
                    <span key={i} className={i === settings.app_title.split(' ').length - 1 ? "text-indigo-400" : ""}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>
                <p className="text-xl md:text-2xl text-white/80 font-medium max-w-xl mx-auto leading-relaxed">
                  "{settings.encouraging_verse}"
                  <span className="block mt-2 text-sm font-bold text-white/40 uppercase tracking-[0.2em]">{settings.verse_reference}</span>
                </p>
              </div>

              <form onSubmit={handleCheckIn} className="bg-white/95 backdrop-blur-xl p-10 md:p-12 rounded-[3rem] shadow-2xl space-y-8 text-left border border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Enter your name"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg font-medium"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-wider ml-1">Group / Team</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Which group are you in?"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg font-medium"
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  disabled={submitting}
                  type="submit"
                  className="w-full py-6 text-white rounded-[2rem] font-black text-xl transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-[0.98]"
                  style={{ backgroundColor: settings.primary_color }}
                >
                  {submitting ? 'Checking in...' : 'Confirm Check-In'}
                  <UserPlus size={24} />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              {adminTab === 'roster' ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
                    <h2 className="text-3xl font-black flex items-center gap-4">
                      <Users size={32} />
                      Admin Dashboard
                    </h2>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 border border-white/10">
                        <Filter size={16} className="text-white/60" />
                        <input 
                          type="date" 
                          className="bg-transparent text-sm font-bold focus:outline-none"
                          value={exportDate}
                          onChange={(e) => setExportDate(e.target.value)}
                        />
                      </div>
                      <select 
                        className="bg-white/10 text-sm font-bold rounded-xl px-4 py-2 border border-white/10 focus:outline-none"
                        value={exportGroup}
                        onChange={(e) => setExportGroup(e.target.value)}
                      >
                        <option value="" className="text-slate-900">All Groups</option>
                        {uniqueGroups.map(g => (
                          <option key={g} value={g} className="text-slate-900">{g}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <Download size={18} />
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Email Export Section */}
                  <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 shadow-xl flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                        <Mail size={18} className="text-slate-400" />
                        <input 
                          type="email" 
                          placeholder="Enter email to receive export"
                          className="bg-transparent text-sm font-medium focus:outline-none w-full"
                          value={emailRecipient}
                          onChange={(e) => setEmailRecipient(e.target.value)}
                        />
                      </div>
                    </div>
                    <button 
                      disabled={emailing}
                      onClick={handleEmailExport}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50"
                    >
                      {emailing ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                      {emailing ? 'Sending...' : 'Email Export'}
                    </button>
                  </div>

                  <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                      {loading ? (
                        <div className="p-12 text-center text-slate-400">Loading data...</div>
                      ) : checkIns.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 italic">No check-ins recorded yet.</div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
                            <tr>
                              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Volunteer</th>
                              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Group</th>
                              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {checkIns.map((ci) => (
                              <tr key={ci.id} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-8 py-6 font-bold text-slate-900">{ci.name}</td>
                                <td className="px-8 py-6">
                                  <span className="px-3 py-1 bg-indigo-50 rounded-lg text-xs font-bold" style={{ color: settings.primary_color }}>
                                    {ci.group_name}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <div className="text-sm font-bold text-slate-900">
                                    {new Date(ci.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400">
                                    {new Date(ci.timestamp).toLocaleDateString()}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* General Settings */}
                  <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 space-y-8">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                      <TypeIcon className="text-indigo-500" />
                      App Content
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">App Title</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={settings.app_title}
                          onChange={(e) => setSettings({ ...settings, app_title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Encouraging Verse</label>
                        <textarea 
                          rows={3}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={settings.encouraging_verse}
                          onChange={(e) => setSettings({ ...settings, encouraging_verse: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Verse Reference</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={settings.verse_reference}
                          onChange={(e) => setSettings({ ...settings, verse_reference: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual Settings */}
                  <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 space-y-8">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                      <Palette className="text-indigo-500" />
                      Visuals & Branding
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Primary Color</label>
                        <div className="flex gap-4">
                          <input 
                            type="color" 
                            className="h-12 w-20 rounded-xl cursor-pointer"
                            value={settings.primary_color}
                            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                          />
                          <input 
                            type="text" 
                            className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={settings.primary_color}
                            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Background Image URL</label>
                        <div className="flex gap-3">
                          <ImageIcon className="text-slate-300 mt-4" size={20} />
                          <input 
                            type="text" 
                            className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={settings.bg_url}
                            onChange={(e) => setSettings({ ...settings, bg_url: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Logo</label>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <label className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-600 border-2 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all">
                              {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                              <span className="font-bold">{uploading ? 'Uploading...' : 'Upload Logo File'}</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                            </label>
                          </div>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-slate-400 text-xs font-bold">URL</span>
                            </div>
                            <input 
                              type="text" 
                              className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              value={settings.logo_url}
                              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                              placeholder="Or paste logo URL here"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thank You Settings */}
                  <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 space-y-8 lg:col-span-2">
                    <h3 className="text-2xl font-black flex items-center gap-3">
                      <Heart className="text-indigo-500" />
                      Success Message
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Main Message</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={settings.thank_you_message}
                          onChange={(e) => setSettings({ ...settings, thank_you_message: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Success Verse</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={settings.thank_you_verse}
                          onChange={(e) => setSettings({ ...settings, thank_you_verse: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Reference</label>
                        <input 
                          type="text" 
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={settings.thank_you_reference}
                          onChange={(e) => setSettings({ ...settings, thank_you_reference: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <button 
                        disabled={saving}
                        onClick={saveSettings}
                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                        {saving ? 'Saving...' : 'Save All Settings'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center">
        <p className="text-white/40 text-sm font-medium tracking-wide mb-4">
          © 2026 {settings.app_title} System • "Whatever you do, work at it with all your heart."
        </p>
        <button 
          onClick={() => setShowAdminLogin(true)}
          className="text-xs text-white/20 hover:text-white/60 transition-colors font-bold uppercase tracking-widest"
        >
          Admin Access
        </button>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
