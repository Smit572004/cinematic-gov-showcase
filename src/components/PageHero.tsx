import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  description?: string;
  children?: ReactNode;
  backgroundImage?: string;
}

const PageHero = ({ title, subtitle, description, children, backgroundImage }: Props) => (
  <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
    {backgroundImage && (
      <>
        <div className="absolute inset-0">
          <img src={backgroundImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px]" />
      </>
    )}
    {!backgroundImage && <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />}

    <div className="relative z-10 container mx-auto px-6 text-center py-20">
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-block px-4 py-1.5 rounded-full border border-primary/40 text-primary text-sm font-body tracking-[0.2em] uppercase mb-6"
      >
        {subtitle}
      </motion.span>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl mx-auto"
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-body leading-relaxed"
        >
          {description}
        </motion.p>
      )}
      {children}
    </div>
  </section>
);

export default PageHero;
