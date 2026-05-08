"use client";

import React, { useMemo } from 'react';

function safeClipId(plotId) {
  return String(plotId).replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Bbox center + font size so label fits inside polygon (clipping handles overflow). */
function getLabelLayout(pointsStr, label) {
  const parts = String(pointsStr || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const xs = [];
  const ys = [];
  for (const p of parts) {
    const [sx, sy] = p.split(",");
    const x = parseFloat(sx);
    const y = parseFloat(sy);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      xs.push(x);
      ys.push(y);
    }
  }
  if (!xs.length) return null;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  const short = Math.min(w, h);
  const len = Math.max(String(label).length, 1);
  // Large text, scaled down by width and digit count; clipPath keeps it inside polygon
  const byShort = short * 0.52;
  const byWidth = (w * 0.92) / (len * 0.58);
  const fontSize = Math.max(8, Math.min(byShort, byWidth, short * 0.75));
  return { cx, cy, fontSize };
}

export function VirtualizedPlots({ 
  plots, 
  viewBox, 
  currentZoom, 
  onPlotHover, 
  onPlotLeave,
  onPlotClick,
  activePlotId,
  matchedPlotIds, // optional Set<string> of plot ids matching filters
  hasActiveFilters = false
}) {
  // Determine which plots to highlight based on filters and hover state
  const highlightedIds = useMemo(() => {
    const highlighted = new Set();
    
    // Highlight filter matches when active
    if (hasActiveFilters && matchedPlotIds && matchedPlotIds.size > 0) {
      matchedPlotIds.forEach(id => highlighted.add(id));
    }
    
    // Always highlight the actively hovered/active plot
    if (activePlotId) {
      const activePlot = plots.find(p => p.id === activePlotId);
      if (activePlot) {
        highlighted.add(activePlotId);
        // If it's a canal, highlight all canal plots
        if (activePlot.plotType === 'canal') {
          plots.filter(p => p.plotType === 'canal').forEach(p => highlighted.add(p.id));
        }
      }
    }
    
    return highlighted;
  }, [activePlotId, plots, hasActiveFilters, matchedPlotIds]);

  const clipTargets = useMemo(
    () => plots.filter((p) => highlightedIds.has(p.id)),
    [plots, highlightedIds]
  );

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%' 
      }}
      onMouseLeave={onPlotLeave}
    >
      <defs>
        {clipTargets.map((plot) => (
          <clipPath key={`clip-${plot.id}`} id={`plot-clip-${safeClipId(plot.id)}`}>
            <polygon points={plot.points} />
          </clipPath>
        ))}
      </defs>
      {/* Layer 1: all polygon shapes */}
      <g>
        {plots.map((plot) => {
          const isHighlighted = highlightedIds.has(plot.id);
          const isHovered = activePlotId === plot.id;

          let fill = 'transparent';
          let opacity = 1;
          let stroke = 'rgba(255, 255, 255, 0.2)';
          let strokeWidth = 1;

          if (isHighlighted) {
            fill = plot.color;
            stroke = 'white';
            strokeWidth = 0.6;
          }

          if (isHovered) {
            fill = plot.color;
            opacity = 1;
            stroke = 'white';
            strokeWidth = 0.6;
          }

          return (
            <polygon
              key={plot.id}
              points={plot.points}
              style={{
                fill,
                stroke,
                strokeWidth,
                opacity,
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
              }}
              onMouseEnter={() => onPlotHover(plot)}
              onMouseLeave={onPlotLeave}
              onClick={(e) => onPlotClick && onPlotClick(plot, e)}
            />
          );
        })}
      </g>

      {/* Layer 2: villa-id labels, always painted above all polygons */}
      <g style={{ pointerEvents: 'none' }}>
        {clipTargets.map((plot) => {
          const label = String(plot.id);
          const layout = getLabelLayout(plot.points, label);
          if (!layout) return null;
          const labelFill =
            plot.sheetData?.availability === 'Blocked' ? '#000000' : '#ffffff';
          return (
            <text
              key={`label-${plot.id}`}
              x={layout.cx}
              y={layout.cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill={labelFill}
              fontWeight={700}
              fontSize={layout.fontSize}
              fontFamily="var(--font-twk-issey), system-ui, sans-serif"
              clipPath={`url(#plot-clip-${safeClipId(plot.id)})`}
              style={{ userSelect: 'none' }}
            >
              {label}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
