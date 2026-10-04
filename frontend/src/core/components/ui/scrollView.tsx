"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
}

export default function ScrollReveal({ children, delay = 0 }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} // Starts slightly lower and invisible
      whileInView={{ opacity: 1, y: 0 }} // Smoothly shifts up when scrolled to
      viewport={{ once: true, margin: "-100px" }} // Triggers ONCE, 100px before coming fully into view
      transition={{ 
        duration: 0.6, 
        ease: [0.16, 1, 0.3, 1], // Premium, elegant cubic-bezier easing curve
        delay: delay 
      }}
      className="will-change-transform" // Tells the browser to use GPU acceleration
    >
      {children}
    </motion.div>
  );
}
