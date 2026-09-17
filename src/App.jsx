import React, { useState, useCallback } from 'react'
import DataManageMode from './components/DataManageMode.jsx'
import PriorityMode from './components/PriorityMode.jsx'
import VisualizeMode from './components/VisualizeMode.jsx'
import * as store from './store/dataStore.js'

export default function App() {
  const [mode, setMode] = useState('manage')
  const [data, setData] = useState(store.getData())

  const refresh = useCallback(() => setData(store.getData()), [])

  const handleExport = () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data-export.json'
    a.click()
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      store.importJSON(reader.result)
      refresh()
    }
    reader.readAsText(file)
  }

  return (
    <div className="app">
      <header className="tabs">
        <button className={mode === 'manage' ? 'active' : ''} onClick={() => setMode('manage')}>관리</button>
        <button className={mode === 'priority' ? 'active' : ''} onClick={() => setMode('priority')}>우선순위</button>
        <button className={mode === 'visualize' ? 'active' : ''} onClick={() => setMode('visualize')}>시각화</button>
      </header>

      <main>
        {mode === 'manage' && <DataManageMode data={data} refresh={refresh} />}
        {mode === 'priority' && <PriorityMode data={data} refresh={refresh} />}
        {mode === 'visualize' && <VisualizeMode data={data} />}
      </main>

      <footer className="io-row">
        <button onClick={handleExport}>JSON 내보내기</button>
        <label className="import-label">
          JSON 가져오기
          <input type="file" accept="application/json" onChange={handleImport} hidden />
        </label>
      </footer>
    </div>
  )
}
