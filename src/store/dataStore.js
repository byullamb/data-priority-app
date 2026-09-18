const STORAGE_KEY = 'data-priority-app:v1'

function loadRaw() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { primaries: {}, priorityOrder: [] }
  try {
    return JSON.parse(raw)
  } catch {
    return { primaries: {}, priorityOrder: [] }
  }
}

function saveRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// primaries: { [primaryName]: { weight: number, secondaries: { [secondaryName]: number } } }

export function getData() {
  return loadRaw()
}

export function addPrimary(name) {
  const data = loadRaw()
  if (!data.primaries[name]) {
    data.primaries[name] = { weight: 1, secondaries: {} }
    syncPriorityOrder(data)
    saveRaw(data)
  }
  return data
}

export function deletePrimary(name) {
  const data = loadRaw()
  delete data.primaries[name]
  syncPriorityOrder(data)
  saveRaw(data)
  return data
}

export function addSecondary(primaryName, secondaryName) {
  const data = loadRaw()
  const p = data.primaries[primaryName]
  if (!p) return data
  if (!(secondaryName in p.secondaries)) {
    p.secondaries[secondaryName] = 1 // 기본값
  }
  syncPriorityOrder(data)
  saveRaw(data)
  return data
}

export function deleteSecondary(primaryName, secondaryName) {
  const data = loadRaw()
  const p = data.primaries[primaryName]
  if (!p) return data
  delete p.secondaries[secondaryName]
  // 2차가 하나도 없으면 1차 가중치가 자동으로 복원됨 (별도 리셋 로직 불필요:
  // p.weight 값은 계속 저장되어 있었으므로 그대로 다시 활성화됨)
  syncPriorityOrder(data)
  saveRaw(data)
  return data
}

export function setWeight(primaryName, secondaryName, weight) {
  const data = loadRaw()
  const p = data.primaries[primaryName]
  if (!p) return data
  if (secondaryName) {
    p.secondaries[secondaryName] = weight
  } else {
    p.weight = weight
  }
  saveRaw(data)
  return data
}
export function renamePrimary(oldName, newName) {
  const data = loadRaw()
  const trimmed = newName.trim()
  if (!trimmed || trimmed === oldName) return data
  if (!(oldName in data.primaries)) return data
  if (trimmed in data.primaries) return data // 중복 이름 방지

  const rebuilt = {}
  for (const [key, value] of Object.entries(data.primaries)) {
    rebuilt[key === oldName ? trimmed : key] = value
  }
  data.primaries = rebuilt

  data.priorityOrder = data.priorityOrder.map(key => {
    if (key === oldName) return trimmed
    if (key.startsWith(`${oldName}>`)) return trimmed + key.slice(oldName.length)
    return key
  })

  saveRaw(data)
  return data
}

export function renameSecondary(primaryName, oldSecName, newSecName) {
  const data = loadRaw()
  const trimmed = newSecName.trim()
  const p = data.primaries[primaryName]
  if (!p) return data
  if (!trimmed || trimmed === oldSecName) return data
  if (!(oldSecName in p.secondaries)) return data
  if (trimmed in p.secondaries) return data // 중복 이름 방지

  const rebuilt = {}
  for (const [key, value] of Object.entries(p.secondaries)) {
    rebuilt[key === oldSecName ? trimmed : key] = value
  }
  p.secondaries = rebuilt

  const oldKey = `${primaryName}>${oldSecName}`
  const newKey = `${primaryName}>${trimmed}`
  data.priorityOrder = data.priorityOrder.map(key => key === oldKey ? newKey : key)

  saveRaw(data)
  return data
}

// 리프 = 실제로 유효한 항목 목록
// 2차가 있으면 (1차>2차)들이 리프, 없으면 1차 자체가 리프
export function getLeaves(data = loadRaw()) {
  const leaves = []
  for (const [primaryName, p] of Object.entries(data.primaries)) {
    const secNames = Object.keys(p.secondaries)
    if (secNames.length === 0) {
      leaves.push({ key: primaryName, primary: primaryName, secondary: null, weight: p.weight })
    } else {
      for (const secName of secNames) {
        leaves.push({
          key: `${primaryName}>${secName}`,
          primary: primaryName,
          secondary: secName,
          weight: p.secondaries[secName]
        })
      }
    }
  }
  return leaves
}

// priorityOrder는 leaf key 배열. 리프 구성이 바뀔 때마다 동기화 (새 항목 추가/삭제 반영)
function syncPriorityOrder(data) {
  const leafKeys = getLeaves(data).map(l => l.key)
  const existing = data.priorityOrder.filter(k => leafKeys.includes(k))
  const added = leafKeys.filter(k => !existing.includes(k))
  data.priorityOrder = [...existing, ...added]
}

export function getPriorityOrder() {
  const data = loadRaw()
  syncPriorityOrder(data)
  saveRaw(data)
  return data.priorityOrder
}

export function moveInPriority(key, direction) {
  const data = loadRaw()
  syncPriorityOrder(data)
  const idx = data.priorityOrder.indexOf(key)
  if (idx === -1) return data
  const swapWith = direction === 'up' ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= data.priorityOrder.length) return data
  ;[data.priorityOrder[idx], data.priorityOrder[swapWith]] =
    [data.priorityOrder[swapWith], data.priorityOrder[idx]]
  saveRaw(data)
  return data
}

export function exportJSON() {
  return JSON.stringify(loadRaw(), null, 2)
}

export function importJSON(jsonString) {
  const parsed = JSON.parse(jsonString)
  saveRaw(parsed)
  return parsed
}
