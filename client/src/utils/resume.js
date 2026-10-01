import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../services/api'

// Opens a resume from an API route that returns { url } (a short-lived signed link).
// The tab is opened first, because browsers block tabs opened after waiting for an API call.
export const openResume = async (apiPath) => {
  const newTab = window.open('', '_blank')
  try {
    const res = await api.get(apiPath)
    if (newTab) newTab.location.href = res.data.url
    else window.location.href = res.data.url
  } catch (error) {
    newTab?.close()
    toast.error(getErrorMessage(error))
  }
}
