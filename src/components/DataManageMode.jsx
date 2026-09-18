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

// 2차 카테고리 한 줄. 훅을 컴포넌트 최상위에서 호출해 Rules of Hooks를 지킵니다.
function SecondaryRow({ primaryName, secName, secWeight, onWeightTap, onDelete }) {
  const tapHandler = useTapHandlers(
    () => {},
    () => onWeightTap(primaryName, secName)
  )
  return (
    <li className="secondary-row" onClick={tapHandler}>
