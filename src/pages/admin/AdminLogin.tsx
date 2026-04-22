import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, LogIn } from "lucide-react";
import logoColour from "@/assets/tinplant-logo-colour.png";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const de = lang === "de";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] relative"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-5"
          >
            <img src={logoColour} alt="TinPlant Logo" className="h-14 w-auto mx-auto" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold tracking-tight">TinPlant Admin</h1>
          <p className="text-muted-foreground font-body text-sm mt-2">
            {de ? "Melden Sie sich an, um Ihre Website zu verwalten" : "Sign in to manage your website"}
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-card rounded-2xl p-8 space-y-6 border border-border/60 shadow-xl shadow-black/5"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium font-body text-foreground block">
              {de ? "E-Mail" : "Email"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground font-body text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                placeholder="admin@tinplant.de"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium font-body text-foreground block">
              {de ? "Passwort" : "Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/30 border border-border text-foreground font-body text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-muted-foreground/50"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {de ? "Anmeldung..." : "Signing in..."}
              </div>
            ) : (
              <>
                <LogIn size={16} />
                {de ? "Anmelden" : "Sign In"}
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground/60 font-body mt-6">
          {de ? "Geschützter Bereich · Nur autorisiertes Personal" : "Protected area · Authorized personnel only"}
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
