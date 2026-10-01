// Edits one question of a mock test.
// For MCQs we remember the correct option by its position (correctIndex), so editing the
// option's text does not lose which one is correct. The page converts it to text when saving.
const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

const QuestionEditor = ({ index, question, onChange, onRemove }) => {
  const update = (changes) => onChange({ ...question, ...changes })

  const updateOption = (i, value) => update({ options: question.options.map((o, j) => (j === i ? value : o)) })

  const removeOption = (i) => {
    const options = question.options.filter((_, j) => j !== i)
    // keep the same option marked correct after removing one above it
    let correctIndex = question.correctIndex
    if (i === correctIndex) correctIndex = 0
    else if (i < correctIndex) correctIndex -= 1
    update({ options, correctIndex })
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Question {index + 1}</h3>
        <button type="button" onClick={onRemove} className="text-sm text-red-600 hover:underline">
          Remove
        </button>
      </div>

      <textarea
        rows={2}
        value={question.question}
        onChange={(e) => update({ question: e.target.value })}
        placeholder="Type the question"
        className={`mt-2 ${inputClass}`}
      />

      <div className="mt-3 grid grid-cols-2 gap-3 sm:w-80">
        <label className="text-xs font-medium text-gray-600">
          Type
          <select value={question.type} onChange={(e) => update({ type: e.target.value })} className={`mt-1 bg-white ${inputClass}`}>
            <option value="mcq">Multiple choice</option>
            <option value="short">Short answer</option>
          </select>
        </label>
        <label className="text-xs font-medium text-gray-600">
          Points
          <input type="number" min="1" max="10" value={question.points} onChange={(e) => update({ points: e.target.value })} className={`mt-1 ${inputClass}`} />
        </label>
      </div>

      {question.type === 'mcq' ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-600">Options (select the correct one)</p>
          {question.options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${index}`}
                checked={question.correctIndex === i}
                onChange={() => update({ correctIndex: i })}
                aria-label={`Option ${i + 1} is correct`}
              />
              <input value={option} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className={inputClass} />
              {question.options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} className="px-2 text-gray-400 hover:text-red-600" aria-label={`Remove option ${i + 1}`}>
                  &times;
                </button>
              )}
            </div>
          ))}
          {question.options.length < 6 && (
            <button type="button" onClick={() => update({ options: [...question.options, ''] })} className="text-sm text-blue-600 hover:underline">
              + Add option
            </button>
          )}
        </div>
      ) : (
        <label className="mt-3 block text-xs font-medium text-gray-600">
          Correct answer (checked ignoring capital letters and extra spaces)
          <input value={question.shortAnswer} onChange={(e) => update({ shortAnswer: e.target.value })} maxLength={200} className={`mt-1 ${inputClass}`} />
        </label>
      )}
    </div>
  )
}

export default QuestionEditor
