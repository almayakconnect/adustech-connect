import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { GradCap, UserCheck, ShieldCheck, Sparkles, BookOpen, Users, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [programme, setProgramme] = useState('');
  const [level, setLevel] = useState('100');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              full_name: fullName,
              matric_number: matricNumber,
              faculty,
              department,
              programme,
              level,
              email,
            },
          ]);

          if (profileError) throw profileError;
        }
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Decorative Gradient Blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden z-10">
        
        {/* Left Welcome Hero Panel */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 p-8 flex flex-col justify-between relative">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 font-black text-2xl shadow-inner">
                A
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">ADUSTECH</h1>
                <p className="text-xs font-medium text-emerald-300">Connect Network</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Welcome to your campus digital community.
              </h2>
              <p className="text-sm text-emerald-100/80 leading-relaxed">
                Connect with fellow students, access course materials, collaborate in student communities, and chat seamlessly.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-4 border-t border-emerald-700/50">
              <div className="flex items-center gap-3 text-xs text-emerald-100">
                <Users className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Student feed, status updates & messaging</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-emerald-100">
                <BookOpen className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Academic resources & assignment hub</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-emerald-100">
                <Sparkles className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Almayak AI Study Assistant</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-emerald-200/60 pt-6">
            Aliko Dangote University of Science and Technology, Wudil
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 flex flex-col justify-center bg-slate-800">
          
          {/* Toggle Tab */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl mb-6 border border-slate-700">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${isLogin ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setErrorMessage(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${!isLogin ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Abdulrahman Abdulmalik"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Matric Number</label>
                    <input
                      type="text"
                      required
                      value={matricNumber}
                      onChange={(e) => setMatricNumber(e.target.value)}
                      placeholder="UG25/CIVE/1112"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="100">100 Level</option>
                      <option value="200">200 Level</option>
                      <option value="300">300 Level</option>
                      <option value="400">400 Level</option>
                      <option value="500">500 Level</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Faculty</label>
                    <input
                      type="text"
                      required
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      placeholder="Engineering"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Department</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Civil Engineering"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@adustech.edu.ng"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Processing...' : isLogin ? 'Sign In to ADUSTECH Connect' : 'Complete Registration'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
