import { useState } from 'react'

// Type a skill and press Enter (or click Add). Click x on a chip to remove it.
const SkillsInput = ({ skills, onChange }) => {
  const [text, setText] = useState('')

  const addSkill = () => {
    const skill = text.trim()
    if (!skill) return
    const alreadyAdded = skills.some((s) => s.toLowerCase() === skill.toLowerCase())
    if (!alreadyAdded) onChange([...skills, skill])
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault() // stop Enter from submitting the whole form
      addSkill()
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. React, Java, SQL"
          maxLength={40}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        <button
          type="button"
          onClick={addSkill}
          className="rounded-lg border border-slate-200 px-4 text-sm hover:bg-gray-50"
        >
          Add
        </button>
      </div>

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
              {skill}
              <button
                type="button"
                onClick={() => onChange(skills.filter((s) => s !== skill))}
                className="ml-1 text-blue-400 hover:text-red-600"
                aria-label={`Remove ${skill}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default SkillsInput
