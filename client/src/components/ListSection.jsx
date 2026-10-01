// One component for Experience, Projects and Certificates.
// "fields" describes the inputs of one entry, e.g. [{ name: 'company', label: 'Company', required: true }]
const ListSection = ({ items, fields, emptyItem, onChange, addLabel }) => {
  const updateItem = (index, name, value) => {
    const updated = items.map((item, i) => (i === index ? { ...item, [name]: value } : item))
    onChange(updated)
  }

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index))

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    value={item[field.name]}
                    onChange={(e) => updateItem(index, field.name, e.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={item[field.name]}
                    placeholder={field.placeholder}
                    onChange={(e) => updateItem(index, field.name, e.target.value)}
                    className={inputClass}
                  />
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => removeItem(index)} className="mt-3 text-sm text-red-600 hover:underline">
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, { ...emptyItem }])}
        className="rounded-lg border border-dashed border-gray-400 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        + {addLabel}
      </button>
    </div>
  )
}

export default ListSection
