"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOOLTIP_SURFACE = {
  background: "rgba(15, 15, 20, 0.75)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow:
    "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
};

const EASE_SMOOTH = [0.22, 1, 0.36, 1];
const DURATION_SIZE = 0.52;
const DURATION_TEXT = 0.38;

const sizeTransition = {
  type: "tween",
  duration: DURATION_SIZE,
  ease: EASE_SMOOTH,
};

const textTransition = {
  type: "tween",
  duration: DURATION_TEXT,
  ease: EASE_SMOOTH,
};

const WIDTH_EXPANDED = "min(96vw, 1120px)";
const WIDTH_MINIMIZED = "min(92vw, 720px)";
const HEIGHT_EXPANDED = "clamp(158px, 28vh, 300px)";
const HEIGHT_MINIMIZED = "clamp(52px, 11vw, 76px)";

const SECTION_HEADERS = [
  "Standard East",
  "Standard West",
  "NE Corner",
  "NW Corner",
  "SE Corner",
  "SW Corner",
  "Park View East",
  "Park View West",
];

const ZERO_CAPS = [0, 0, 0, 0, 0, 0, 0, 0];

function normalizeCaps8(c) {
  if (!Array.isArray(c) || c.length !== 8) return ZERO_CAPS.slice();
  return c.map((x) => {
    const n = Number(x);
    return Number.isFinite(n) ? Math.round(n) : 0;
  });
}

/** Spine-less downward arrow (triangle only), centered under the panel */
function BottomArrow() {
  return (
    <div
      aria-hidden
      style={{
        width: 14,
        height: 8,
        marginTop: -1,
        background: "rgba(15, 15, 20, 0.75)",
        clipPath: "polygon(50% 100%, 0 0, 100% 0)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
      }}
    />
  );
}

export function TopHintBar({ containerWidth = 1024, caps }) {
  const [minimized, setMinimized] = useState(true);
  const safeCaps = useMemo(() => normalizeCaps8(caps), [caps]);
  const sections = useMemo(
    () => SECTION_HEADERS.map((header, i) => ({ header, value: safeCaps[i] })),
    [safeCaps]
  );

  const toggle = useCallback(() => {
    setMinimized((v) => !v);
  }, []);

  const headerFs =
    containerWidth >= 900 ? 17 : containerWidth >= 450 ? 16 : 15;
  const numFs =
    containerWidth >= 900 ? 56 : containerWidth >= 450 ? 48 : 40;
  const minimizedFs =
    containerWidth >= 900 ? 14 : containerWidth >= 450 ? 13 : 12;

  const divider = "1px solid rgba(255, 255, 255, 0.22)";

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <motion.div
        initial={false}
        animate={{
          width: minimized ? WIDTH_MINIMIZED : WIDTH_EXPANDED,
          height: minimized ? HEIGHT_MINIMIZED : HEIGHT_EXPANDED,
          paddingTop: minimized ? 8 : 8,
          paddingBottom: minimized ? 8 : 12,
          paddingLeft: minimized ? 16 : 14,
          paddingRight: minimized ? 16 : 14,
        }}
        transition={{
          ...sizeTransition,
          scale: { type: "tween", duration: 0.22, ease: EASE_SMOOTH },
        }}
        whileHover={minimized ? { scale: 1.025 } : undefined}
        style={{
          ...TOOLTIP_SURFACE,
          borderRadius: 14,
          pointerEvents: "auto",
          cursor: "pointer",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          transformOrigin: "center top",
        }}
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        aria-expanded={!minimized}
        aria-label={
          minimized
            ? "Expand Villa CAPS dashboard"
            : "Minimize Villa CAPS dashboard"
        }
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: minimized ? "center" : "stretch",
            justifyContent: minimized ? "center" : "flex-start",
            overflowX: "hidden",
            overflowY: minimized ? "hidden" : "auto",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {minimized ? (
              <motion.span
                key="min-label"
                initial={{ opacity: 0, y: 5, filter: "blur(6px)" }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  fontSize: minimizedFs,
                }}
                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                transition={textTransition}
                style={{
                  display: "block",
                  width: "100%",
                  color: "#ffffff",
                  fontFamily: "var(--font-twk-issey), sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  lineHeight: 1.35,
                  textAlign: "center",
                }}
              >
                Click to view current Villa CAPS
              </motion.span>
            ) : (
              <motion.div
                key="caps-grid"
                initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={textTransition}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  width: "100%",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {sections.map((row, i) => (
                  <div
                    key={row.header}
                    style={{
                      flex: "1 1 0",
                      minWidth: 0,
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      paddingTop: 6,
                      paddingLeft: 10,
                      paddingRight: 10,
                      borderLeft: i === 0 ? "none" : divider,
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        fontFamily: "var(--font-twk-issey), sans-serif",
                        fontSize: headerFs,
                        fontWeight: 700,
                        color: "rgba(255, 255, 255, 0.95)",
                        letterSpacing: "0.03em",
                        lineHeight: 1.15,
                        textAlign: "center",
                      }}
                    >
                      {row.header}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minHeight: 0,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-twk-issey), sans-serif",
                          fontSize: numFs,
                          fontWeight: 700,
                          color: "#ffffff",
                          letterSpacing: "0.02em",
                          lineHeight: 1,
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {row.value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <BottomArrow />
    </div>
  );
}

export default TopHintBar;
