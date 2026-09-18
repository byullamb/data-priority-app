import React, { useState, useMemo, useRef, useEffect } from 'react'
import * as d3 from 'd3'
import * as store from '../store/dataStore.js'

function buildHierarchy(data, granularity) {
  const children = Object.entries(data.primaries).map(([primaryName, p]) => {
    const secNames = Object.keys(p.secondaries)
    if (granularity === 'primary' || secNames.length === 0) {
      const value = secNames.length === 0
        ? p.weight
        : secNames.reduce((sum, s) => sum + p.secondaries[s], 0)
      return { name: primaryName, value }
    }
    return {
      name: primaryName,
      children: secNames.map(s => ({ name: s, value: p.secondaries[s] }))
    }
  })
  return { name: 'root', children }
}

function TreeMapChart({ root, width, height }) {
  const layout = d3.treemap().size([width, height]).padding(2)
  const hierarchyRoot = d3.hierarchy(root).sum(d => d.value).sort((a, b) => b.value - a.value)
  layout(hierarchyRoot)
  const color = d3.scaleOrdinal(d3.schemeTableau10)
  return (
    <svg width={width} height={height}>
      {hierarchyRoot.leaves().map((leaf, i) => (
        <g key={i} transform={`translate(${leaf.x0},${leaf.y0})`}>
          <rect
            width={leaf.x1 - leaf.x0}
            height={leaf.y1 - leaf.y0}
            fill={color(leaf.parent.data.name)}
            stroke="#111"
          />
          <text x={4} y={16} fontSize={12} fill="#fff">{leaf.data.name}</text>
          <text x={4} y={30} fontSize={10} fill="#ddd">{leaf.data.value}</text>
        </g>
      ))}
    </svg>
  )
}

function CirclePackingChart({ root, width, height }) {
  const layout = d3.pack().size([width, height]).padding(4)
  const hierarchyRoot = d3.hierarchy(root).sum(d => d.value).sort((a, b) => b.value - a.value)
  layout(hierarchyRoot)
  const color = d3.scaleOrdinal(d3.schemeTableau10)
  return (
    <svg width={width} height={height}>
      {hierarchyRoot.descendants().filter(d => d.depth > 0).map((node, i) => (
        <g key={i} transform={`translate(${node.x},${node.y})`}>
          <circle
            r={node.r}
            fill={node.children ? 'none' : color(node.parent.data.name)}
            stroke={node.children ? '#666' : 'none'}
          />
          {!node.children && (
            <text textAnchor="middle" dy={4} fontSize={11} fill="#fff">{node.data.name}</text>
          )}
        </g>
      ))}
    </svg>
  )
}

function SunburstChart({ root, width, height }) {
  const radius = Math.min(width, height) / 2
  const hierarchyRoot = d3.hierarchy(root).sum(d => d.value).sort((a, b) => b.value - a.value)
  d3.partition().size([2 * Math.PI, radius])(hierarchyRoot)
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1)
  const color = d3.scaleOrdinal(d3.schemeTableau10)
  return (
    <svg width={width} height={height}>
      <g transform={`translate(${width / 2},${height / 2})`}>
        {hierarchyRoot.descendants().filter(d => d.depth > 0).map((node, i) => (
          <path
            key={i}
            d={arc(node)}
            fill={color(node.depth === 1 ? node.data.name : node.parent.data.name)}
            stroke="#111"
          />
        ))}
      </g>
    </svg>
  )
}

export default function VisualizeMode({ data }) {
  const [chartType, setChartType] = useState('treemap')
  const [granularity, setGranularity] = useState('secondary')
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: 320, height: 400 })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect
      setSize({ width, height: width })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const root = useMemo(() => buildHierarchy(data, granularity), [data, granularity])

  return (
    <div className="mode-panel">
      <div className="chart-controls">
        <select value={chartType} onChange={e => setChartType(e.target.value)}>
          <option value="treemap">Tree Map</option>
          <option value="circlepack">Circle Packing</option>
          <option value="sunburst">Sunburst</option>
        </select>
        <select value={granularity} onChange={e => setGranularity(e.target.value)}>
          <option value="secondary">2차로 세분화</option>
          <option value="primary">1차로 단순화</option>
        </select>
      </div>
      <div ref={containerRef} className="chart-container">
        {chartType === 'treemap' && <TreeMapChart root={root} width={size.width} height={size.height} />}
        {chartType === 'circlepack' && <CirclePackingChart root={root} width={size.width} height={size.height} />}
        {chartType === 'sunburst' && <SunburstChart root={root} width={size.width} height={size.height} />}
      </div>
    </div>
  )
}
