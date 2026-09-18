import React, { useState, useRef } from 'react'
import * as store from '../store/dataStore.js'

function useTapHandlers(onSingleTap, onDoubleTap, delay = 280) {
  const timer = useRef(null)
  return () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
      onDoubleTap()
    } else {
      timer.current = setTimeout(() => {
        timer.current = null
        onSingleTap()
      }, delay)
    }
  }
}

function WeightPrompt({ current, onSubmit, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <p>가중치 입력</p>
        <input
          autoFocus
          type="number"
          defaultValue={current}
          onKeyDown={e => {
            if (e.key === 'Enter') onSubmit(Number(e.target.value))
          }}
          id="weight-input"
        />
        <div className="modal-actions">
          <button onClick={() => onSubmit(Number(document.getElementById('weight-input').value))}>확인</button>
          <button onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  )
}

function SecondaryPrompt({ onSubmit, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <p>2차 카테고리 이름</p>
        <input
          autoFocus
          type="text"
          onKeyDown={e => {
            if (e.key === 'Enter' && e.target.value.trim()) onSubmit(e.target.value.trim())
          }}
          id="sec-input"
        />
        <div className="modal-actions">
          <button onClick={() => {
            const v = document.getElementById('sec-input').value.trim()
            if (v) onSubmit(v)
          }}>추가</button>
          <button onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  )
}

function RenamePrompt({ currentName, onSubmit, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <p>이름 수정</p>
        <input
          autoFocus
          type="text"
          defaultValue={currentName}
          onFocus={e => e.target.select()}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.target.value.trim()) onSubmit(e.target.value.trim())
          }}
          id="rename-input"
        />
        <div className="modal-actions">
          <button onClick={() => {
            const v = document.getElementById('rename-input').value.trim()
            if (v) onSubmit(v)
          }}>저장</button>
          <button onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  )
}

// 2차 카테고리 한 줄. 훅을 컴포넌트 최상위에서 호출해 Rules of Hooks를 지킵니다.
function SecondaryRow({ primaryName, secName, secWeight, onWeightTap, onDelete, onRename }) {
  const tapHandler = useTapHandlers(
    () => {},
    () => onWeightTap(primaryName, secName)
  )
  return (
    <li className="secondary-row" onClick={tapHandler}>
      <span>{secName}</span>
      <span className="weight-badge">{secWeight}</span>
      <button
        className="edit-btn"
        onClick={e => { e.stopPropagation(); onRename(primaryName, secName) }}
      >수정</button>
      <button
        className="delete-btn"
        onClick={e => { e.stopPropagation(); onDelete(primaryName, secName) }}
      >삭제</button>
    </li>
  )
}

// 1차 카테고리 한 줄. 마찬가지로 훅을 최상위에서 호출합니다.
function PrimaryRow({ primaryName, p, onAddSecondary, onWeightTap, onDeletePrimary, onDeleteSecondary, onRenamePrimary, onRenameSecondary }) {
  const hasSecondaries = Object.keys(p.secondaries).length > 0
  const tapHandler = useTapHandlers(
    () => onAddSecondary(primaryName),
    () => onWeightTap(primaryName, null)
  )
  return (
    <li>
      <div className={`primary-row ${hasSecondaries ? 'inactive-weight' : ''}`} onClick={tapHandler}>
        <span>{primaryName}</span>
        <span className="weight-badge">{hasSecondaries ? '—' : p.weight}</span>
        <button
          className="edit-btn"
          onClick={e => { e.stopPropagation(); onRenamePrimary(primaryName) }}
        >수정</button>
        <button
          className="delete-btn"
          onClick={e => { e.stopPropagation(); onDeletePrimary(primaryName) }}
        >삭제</button>
      </div>
      {hasSecondaries && (
        <ul className="secondary-list">
          {Object.entries(p.secondaries).map(([secName, secWeight]) => (
            <SecondaryRow
              key={secName}
              primaryName={primaryName}
              secName={secName}
              secWeight={secWeight}
              onWeightTap={onWeightTap}
              onDelete={onDeleteSecondary}
              onRename={onRenameSecondary}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function DataManageMode({ data, refresh }) {
  const [newPrimaryName, setNewPrimaryName] = useState('')
  const [weightTarget, setWeightTarget] = useState(null) // { primary, secondary }
  const [secondaryTarget, setSecondaryTarget] = useState(null) // primaryName
  const [renameTarget, setRenameTarget] = useState(null) // { primary, secondary|null, currentName }

  const handleAddPrimary = () => {
    const name = newPrimaryName.trim()
    if (!name) return
    store.addPrimary(name)
    setNewPrimaryName('')
    refresh()
  }

  const handleDeletePrimary = (primaryName) => {
    store.deletePrimary(primaryName)
    refresh()
  }

  const handleDeleteSecondary = (primaryName, secName) => {
    store.deleteSecondary(primaryName, secName)
    refresh()
  }

  const handleWeightTap = (primary, secondary) => {
    setWeightTarget({ primary, secondary })
  }

  const handleRenamePrimaryTap = (primaryName) => {
    setRenameTarget({ primary: primaryName, secondary: null, currentName: primaryName })
  }

  const handleRenameSecondaryTap = (primaryName, secName) => {
    setRenameTarget({ primary: primaryName, secondary: secName, currentName: secName })
  }

  return (
    <div className="mode-panel">
      <div className="add-row">
        <input
          placeholder="1차 카테고리 추가"
          value={newPrimaryName}
          onChange={e => setNewPrimaryName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddPrimary()}
        />
        <button onClick={handleAddPrimary}>추가</button>
      </div>

      <ul className="primary-list">
        {Object.entries(data.primaries).map(([primaryName, p]) => (
          <PrimaryRow
            key={primaryName}
            primaryName={primaryName}
            p={p}
            onAddSecondary={setSecondaryTarget}
            onWeightTap={handleWeightTap}
            onDeletePrimary={handleDeletePrimary}
            onDeleteSecondary={handleDeleteSecondary}
            onRenamePrimary={handleRenamePrimaryTap}
            onRenameSecondary={handleRenameSecondaryTap}
          />
        ))}
      </ul>

      {secondaryTarget && (
        <SecondaryPrompt
          onSubmit={(name) => {
            store.addSecondary(secondaryTarget, name)
            setSecondaryTarget(null)
            refresh()
          }}
          onCancel={() => setSecondaryTarget(null)}
        />
      )}

      {weightTarget && (
        <WeightPrompt
          current={
            weightTarget.secondary
              ? data.primaries[weightTarget.primary].secondaries[weightTarget.secondary]
              : data.primaries[weightTarget.primary].weight
          }
          onSubmit={(val) => {
            store.setWeight(weightTarget.primary, weightTarget.secondary, val)
            setWeightTarget(null)
            refresh()
          }}
          onCancel={() => setWeightTarget(null)}
        />
      )}

      {renameTarget && (
        <RenamePrompt
          currentName={renameTarget.currentName}
          onSubmit={(newName) => {
            if (renameTarget.secondary) {
              store.renameSecondary(renameTarget.primary, renameTarget.secondary, newName)
            } else {
              store.renamePrimary(renameTarget.primary, newName)
            }
            setRenameTarget(null)
            refresh()
          }}
          onCancel={() => setRenameTarget(null)}
        />
      )}
    </div>
  )
}
