import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareText,
  Send,
  Sparkles,
  Bot,
  User,
  Wrench,
  Table as TableIcon,
  Trash2,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useBIStore } from '../store/useBIStore';
import { translations } from '../i18n';

export const ChatAgentPage: React.FC = () => {
  const {
    chatMessages,
    isChatLoading,
    chatError,
    sendChatMessage,
    clearChat,
    language,
    cleanedData,
    loadDemoData,
  } = useBIStore();

  const t = translations[language];
  const [inputText, setInputText] = useState('');
  const [expandedToolMsgId, setExpandedToolMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    t.chat.q1,
    t.chat.q2,
    t.chat.q3,
    t.chat.q4,
    t.chat.q5,
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isChatLoading) return;
    sendChatMessage(text.trim());
    setInputText('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const hasData = cleanedData.sales.length > 0;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t.chat.title}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Tool Calling
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.chat.subtitle}
          </p>
        </div>

        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t.chat.clearChat}</span>
        </button>
      </div>

      {/* Suggested Questions Chips */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-bold shrink-0 hidden sm:inline">
          {t.chat.suggestedQuestions}
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isChatLoading}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shrink-0 cursor-pointer text-xs font-medium"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-900/40 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 space-y-4">
        {!hasData && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
            <span>No data currently loaded. Answers will reflect an empty dataset.</span>
            <button
              onClick={loadDemoData}
              className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold cursor-pointer"
            >
              Load Demo Data
            </button>
          </div>
        )}

        {chatMessages.map(msg => {
          const isUser = msg.sender === 'user';
          const isToolExpanded = expandedToolMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble & Transparency Drawer */}
              <div className="space-y-2 max-w-xl">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm shadow-blue-600/20'
                      : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`text-[10px] block mt-1.5 opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Transparency Tool Call Display */}
                {msg.toolCall && (
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/30 overflow-hidden text-xs">
                    <button
                      onClick={() => setExpandedToolMsgId(isToolExpanded ? null : msg.id)}
                      className="w-full px-3 py-2 flex items-center justify-between text-indigo-800 dark:text-indigo-300 font-bold hover:bg-indigo-100/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{t.chat.toolInvoked}: <code className="font-mono">{msg.toolCall.name}()</code></span>
                      </div>
                      {isToolExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isToolExpanded && (
                      <div className="p-3 pt-0 border-t border-indigo-100 dark:border-indigo-900/40 space-y-2">
                        <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium pt-2">
                          {t.chat.toolResult}:
                        </div>
                        <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg overflow-x-auto font-mono text-[11px] max-h-48">
                          <pre>{JSON.stringify(msg.toolCall.result, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isChatLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>{t.chat.thinking}</span>
            </div>
          </div>
        )}

        {chatError && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
            {chatError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="shrink-0 flex items-center gap-2 bg-white dark:bg-slate-850 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
      >
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={t.chat.placeholder}
          disabled={isChatLoading}
          className="flex-1 px-3 py-2 text-sm bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isChatLoading}
          className={`p-3 rounded-xl text-white transition-all cursor-pointer ${
            !inputText.trim() || isChatLoading
              ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 active:scale-95'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
