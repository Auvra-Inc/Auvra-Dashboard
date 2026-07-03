import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Simulate Auth
    setTimeout(() => {
      if (email && password) {
        localStorage.setItem("auvra_user", JSON.stringify({ email, name: "Vincent" }));
        navigate("/");
      } else {
        setError("Invalid credentials. Please try again.");
      }
      setLoading(false);
    }, 1200);
  };

  return (
    // font-sans here applies Clash Display to everything inside
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-black selection:text-white">

      {/* Subtle background grid/noise for texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      <div className="w-full max-w-[380px] relative z-10">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          
          {/* Increased size, tightened tracking, and bumped weight for the Clash Display heading */}
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight leading-snug">Log in to Auvra</h1>
          <p className="text-sm font-medium text-zinc-500 mt-2">Enter your details to access the workspace</p>
        </div>

        {/* The Card */}
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_20px_-10px_rgba(0,0,0,0.02)] border border-zinc-200/60 p-6 sm:p-8">

          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-100 text-sm px-4 py-3 rounded-md flex items-start gap-2">
                <span className="leading-tight font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              {/* Wide tracking and semibold weight makes Clash Display labels look incredibly sharp */}
              <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-widest text-left block">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vincent@auvra.io"
                className="w-full px-3 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-md text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-widest">
                  Password
                </label>
                <button type="button" className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2.5 bg-zinc-50/50 border border-zinc-200 rounded-md text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 mt-2 bg-black hover:bg-zinc-800 text-white text-sm font-semibold tracking-wide rounded-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
            </button>
          </form>

        </div>
        
      </div>
    </div>
  );
}