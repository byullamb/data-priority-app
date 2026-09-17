import React, { useRef } from 'react'
import * as store from '../store/dataStore.js'

export default function PriorityMode({ data, refresh }) {
  const leaves = store.getLeaves(data)
  const leafMap = Object.fromEntries(leaves.map(l => [l.key, l]))
  const order = store.getPriorityOrder()
  const touchStartY = useRef(null)

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (key) => (e) => {
    if (touchStartY.current === null) return
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const THRESHOLD = 40
    if (dy < -THRESHOLD) {
      store.moveInPriority(key, 'up')
      refresh()
    } else if (dy > THRESHOLD) {
      store.moveInPriority(key, 'down')
      refresh()
    }
    touchStartY.current = null
  }

  return (
    <div className="mode-panel">
      <p className="hint">항목을 위/아래로 스와이프해서 순위를 바꾸세요.</p>
      <ol className="priority-list">
        {order.map((key, idx) => {
          const leaf = leafMap[key]
          if (!leaf) return null
          return (
            <li
              key={key}
              className="priority-item"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd(key)}
            >
              <span className="rank">{idx + 1}</span>
              <span className="label">
                {leaf.secondary ? `${leaf.primary} > ${leaf.secondary}` : leaf.primary}
              </span>
              <div className="btn-fallback">
                <button onClick={() => { store.moveInPriority(key, 'up'); refresh() }}>▲</button>
                <button onClick={() => { store.moveInPriority(key, 'down'); refresh() }}>▼</button>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
