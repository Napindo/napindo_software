import { useEffect, useMemo, useState } from 'react'
import AddDataPage from './AddData'
import { useAppStore } from '../store/appStore'

const AddDataHub = () => {
  const { addDataDraft, clearAddDataDraft, setActivePage } = useAppStore()
  const [draft] = useState(() => addDataDraft)

  const handleBack = () => {
    setActivePage(draft?.returnPage ?? 'exhibitor')
  }

  useEffect(() => {
    if (addDataDraft) {
      clearAddDataDraft()
    }
  }, [addDataDraft, clearAddDataDraft])

  const initialRow = useMemo(() => draft?.row ?? null, [draft])
  const initialId = useMemo(() => draft?.id ?? null, [draft])

  return (
    <AddDataPage
      variant="exhibitor"
      onBack={handleBack}
      initialRow={initialRow}
      initialId={initialId}
      headerTitleOverride="Add Data"
    />
  )
}

export default AddDataHub
