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
      return { name: primaryName, label: primaryName, value }
    }
    return {
      name: primaryName,
      children: secNames.map(s => ({
        name: s,
        label: `${primaryName} > ${s}`,
        value: p.secondaries[s]
      }))
    }
  })
  return { name: 'root', children }
}

// 주어진 폭 안에 들어가도록 라벨을 잘라 말줄임표를 붙인다 (대략적인 글자폭 추정).
function truncateLabel(label, maxWidth, fontSize) {
  if (maxWidth <= 0) return ''
  const avgCharWidth = fontSize * 0.62
  const maxChars = Math.max(0, Math.floor(maxWidth / avgCharWidth))
  if (maxChars === 0) return ''
  if (label.length <= maxChars) return label
  if (maxChars === 1) return label.slice(0, 1)
  return label.slice(0, maxChars - 1) + '…'
}

function TreeMapChart({ root, width, height }) {
  const layout = d3.treemap().size([width, height]).padding(2)
  const hierarchyRoot = d3.hierarchy(root).sum(d => d.value).sort((a, b) => b.value - a.value)
  layout(hierarchyRoot)
  const color = d3.scaleOrdinal(d3.schemeTableau10)
  return (
    <svg width={width} height={height}>
      {hierarchyRoot.leaves().map((leaf, i) => {
        const w = leaf.x1 - leaf.x0
        const h = leaf.y1 - leaf.y0
        const label = leaf.data.label || leaf.data.name
        // 칸 크기에 비례한 글자 크기 (너무 작거나 크지 않도록 clamp)
        const fontSize = Math.max(9, Math.min(26, Math.min(w, h) / 4.5))
        const valueFontSize = Math.max(8, fontSize - 4)
        const canShowLabel = w > 20 && h > 16
        const canShowValue = h > fontSize + valueFontSize + 10
        return (
          <g key={i} transform={`translate(${leaf.x0},${leaf.y0})`}>
            <rect width={w} height={h} fill={color(leaf.parent.data.name)} stroke="#111" />
            {canShowLabel && (
              <text x={6} y={fontSize + 4} fontSize={fontSize} fontWeight="600" fill="#fff">
                {truncateLabel(label, w - 10, fontSize)}
              </text>
            )}
            {canShowLabel && canShowValue && (
              <text x={6} y={fontSize + valueFontSize + 8} fontSize={valueFontSize} fill="#ddd">
                {leaf.data.value}
              </text>
            )}
          </g>
        )
      })}
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
      {hierarchyRoot.descendants().filter(d => d.depth > 0).map((node, i) => {
        const isLeaf = !node.children
        const label = node.data.label || node.data.name
        // 원 반지름에 비례한 글자 크기
        const fontSize = Math.max(9, Math.min(26, node.r / 2.2))
        return (
          <g key={i} transform={`translate(${node.x},${node.y})`}>
            <circle
              r={node.r}
              fill={node.children ? 'none' : color(node.parent.data.name)}
              stroke={node.children ? '#666' : 'none'}
            />
            {isLeaf && node.r > 12 && (
              <text textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fill="#fff">
                {truncateLabel(label, node.r * 1.8, fontSize)}
              </text>
            )}
          </g>
        )
      })}
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
  const nodes = hierarchyRoot.descendants().filter(d => d.depth > 0)

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${width / 2},${height / 2})`}>
        {nodes.map((node, i) => {
          const label = node.data.label || node.data.name
          const angle = node.x1 - node.x0
          const radialThickness = node.y1 - node.y0
          const midRadius = (node.y0 + node.y1) / 2
          const arcLength = angle * midRadius
          // 조각의 둘레 길이와 두께 중 작은 쪽에 비례한 글자 크기
          const fontSize = Math.max(8, Math.min(16, Math.min(arcLength, radialThickness) / 2.3))
          const [cx, cy] = arc.centroid(node)
          const midAngleDeg = ((node.x0 + node.x1) / 2) * 180 / Math.PI - 90
          const normalized = ((midAngleDeg % 360) + 360) % 360
          // 원의 왼쪽 절반에서는 글자가 거꾸로 보이지 않도록 180도 회전
          const rotateDeg = (normalized > 90 && normalized < 270) ? midAngleDeg + 180 : midAngleDeg
          const showLabel = arcLength > 14 && radialThickness > 14

          return (
            <g key={i}>
              <path
                d={arc(node)}
                fill={color(node.depth === 1 ? node.data.name : node.parent.data.name)}
                stroke="#111"
              />
              {showLabel && (
                <text
                  x={cx}
                  y={cy}
                  transform={`rotate(${rotateDeg}, ${cx}, ${cy})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fill="#fff"
                  style={{ pointerEvents: 'none' }}
                >
                  {truncateLabel(label, arcLength, fontSize)}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export default function VisualizeMode({ data }) {
  const [chartType, setChartType] = useState('treemap')
  const [granularity, setGranularity] = useState('secondary')
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: 320, height: 320 })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setSize({ width, height })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const root = useMemo(() => buildHierarchy(data, granularity), [data, granularity])

  return (
    <div className="mode-panel visualize-panel">
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
