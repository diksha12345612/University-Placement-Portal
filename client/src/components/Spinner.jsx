const Spinner = ({ fullScreen = false }) => {
  const circle = (
    <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" role="status" aria-label="Loading" />
  )

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{circle}</div>
  }
  return <div className="flex justify-center py-10">{circle}</div>
}

export default Spinner
