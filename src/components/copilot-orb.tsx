"use client"

import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"

export function CopilotOrb({
  active,
  className,
}: {
  active: boolean
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <div className={cn("relative size-9", className)} aria-hidden="true">
      {!reduce && active && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full bg-[var(--aksh-coral)]/30"
            animate={{ scale: [1, 1.55, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-1 rounded-full bg-[var(--aksh-coral)]/40"
            animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0, 0.45] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.25,
            }}
          />
        </>
      )}
      <motion.span
        className="absolute inset-[6px] rounded-full bg-gradient-to-br from-[var(--aksh-coral)] to-[#ff8a45] shadow-[0_0_18px_rgba(255,107,26,0.45)]"
        animate={
          reduce || !active
            ? { scale: 1 }
            : { scale: [1, 1.08, 0.96, 1], rotate: [0, 8, -6, 0] }
        }
        transition={
          reduce || !active
            ? { duration: 0.2 }
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
      />
    </div>
  )
}
