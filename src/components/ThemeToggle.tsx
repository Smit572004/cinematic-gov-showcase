import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/i18n/ThemeContext";
import { motion } from "framer-motion";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full flex items-center justify-center border border-border/60 bg-secondary/50 hover:bg-secondary transition-colors duration-300"
      aria-label="Toggle theme"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3 }}
      >
        {theme === "light" ? (
          <Moon size={16} className="text-foreground" />
        ) : (
          <Sun size={16} className="text-foreground" />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
