'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GameLayoutProps {
  children: ReactNode
  topBar?: ReactNode
  sideLeft?: ReactNode
  sideRight?: ReactNode
  className?: string
}

export default function GameLayout({ children, topBar, sideLeft, sideRight }: GameLayoutProps) {
  return (
    <div className="game-root">
      {/* Ambient vignette overlay */}
      <div className="game-vignette" aria-hidden />

      {/* Scanline texture */}
      <div className="game-scanlines" aria-hidden />

      {/* Top HUD bar */}
      {topBar && (
        <motion.header
          className="game-topbar"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {topBar}
        </motion.header>
      )}

      {/* Main three-column layout */}
      <div className="game-body">
        {sideLeft && (
          <motion.aside
            className="game-side-left"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          >
            {sideLeft}
          </motion.aside>
        )}

        <motion.main
          className="game-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          {children}
        </motion.main>

        {sideRight && (
          <motion.aside
            className="game-side-right"
            initial={{ x: 280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          >
            {sideRight}
          </motion.aside>
        )}
      </div>

      <style jsx global>{`
        .game-root {
          position: relative;
          min-height: 100vh;
          height: 100vh;
          background: #080810;
          color: #E8E4DC;
          font-family: 'Georgia', 'Times New Roman', serif;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .game-vignette {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 50;
          background:
            radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%);
        }

        .game-scanlines {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 49;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.08) 2px,
            rgba(0, 0, 0, 0.08) 4px
          );
        }

        .game-topbar {
          position: relative;
          z-index: 40;
          height: 52px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          background: rgba(10, 10, 18, 0.96);
          border-bottom: 1px solid rgba(192, 57, 43, 0.25);
          backdrop-filter: blur(8px);
          flex-shrink: 0;
        }

        .game-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
          z-index: 10;
        }

        .game-side-left {
          width: 240px;
          min-width: 240px;
          border-right: 1px solid rgba(255,255,255,0.05);
          overflow-y: auto;
          background: rgba(8, 8, 16, 0.8);
          backdrop-filter: blur(4px);
          scrollbar-width: thin;
          scrollbar-color: #2A2A30 transparent;
        }

        .game-center {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          scrollbar-width: thin;
          scrollbar-color: #2A2A30 transparent;
        }

        .game-side-right {
          width: 220px;
          min-width: 220px;
          border-left: 1px solid rgba(255,255,255,0.05);
          overflow-y: auto;
          background: rgba(8, 8, 16, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          scrollbar-width: thin;
          scrollbar-color: #2A2A30 transparent;
        }
      `}</style>
    </div>
  )
}
