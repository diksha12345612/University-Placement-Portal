import { useEffect, useRef, useState } from 'react'
import { Bot, RotateCcw, SendHorizontal, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const SUGGESTIONS = [
  'What is my resume score and what should I improve first?',
  'Which jobs am I eligible for right now?',
  'How did I do in my mock tests?',
  'Make me a 7-day plan to prepare for placements.',
]
const MAX_LENGTH = 1000

// The chat is saved in this browser only (per user), so it survives a page refresh.
// localStorage can be blocked, so every use is inside try/catch.
const storageKey = (userId) => `assistant-chat-${userId}`
const loadChat = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId))) || []
  } catch {
    return []
  }
}
const saveChat = (userId, messages) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(messages.slice(-40)))
  } catch {
    // not important
  }
}

const AiAssistant = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState(() => loadChat(user._id))
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sending])

  const send = async (content) => {
    const question = content.trim()
    if (!question || sending) return

    const updated = [...messages, { role: 'user', content: question }]
    setMessages(updated)
    setText('')
    setSending(true)
    try {
      const res = await api.post('/assistant/chat', { messages: updated })
      const withReply = [...updated, { role: 'assistant', content: res.data.reply }]
      setMessages(withReply)
      saveChat(user._id, withReply)
    } catch (error) {
      toast.error(getErrorMessage(error), { duration: 6000 })
      setMessages(messages) // take the unanswered question back out
      setText(question) // and put it back in the box so it is not lost
    } finally {
      setSending(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    saveChat(user._id, [])
  }

  const firstName = user.name.split(' ')[0]

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <Bot size={20} />
          </span>
          <div>
            <p className="font-display font-semibold">AI Placement Assistant</p>
            <p className="text-xs text-slate-500">Answers using your profile, scores and applications</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100">
            <RotateCcw size={14} /> New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/40 p-5">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-sm">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sparkles size={14} className="text-blue-600" /> AI Agent
          </p>
          Hello {firstName}! I am your AI Placement Assistant. Ask me anything about your resume, eligible jobs, mock test performance or how to improve your chances.
        </div>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-blue-200 bg-white px-3.5 py-1.5 text-sm text-blue-700 transition hover:bg-blue-50">
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="ml-auto max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-sm text-white">
              {m.content}
            </div>
          ) : (
            <div key={i} className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tl-sm bg-slate-100 p-4 text-sm leading-relaxed text-slate-800">
              {m.content}
            </div>
          ),
        )}

        {sending && (
          <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3" aria-label="Assistant is typing">
            {[0, 150, 300].map((delay) => (
              <span key={delay} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
        className="flex items-center gap-3 border-t border-slate-200 p-4"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_LENGTH}
          disabled={sending}
          placeholder="Ask about your resume, jobs or mock test performance..."
          aria-label="Your message"
          className="flex-1 rounded-full border border-slate-200 px-5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
          aria-label="Send"
        >
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  )
}

export default AiAssistant
