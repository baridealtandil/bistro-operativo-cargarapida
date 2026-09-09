'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGastronomy } from '../context/GastronomyContext';
import { Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';

export const AiChatView: React.FC = () => {
  const { chatMessages, sendChatMessage } = useGastronomy();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    '¿Cuál es nuestro Prime Cost actual y cómo se desglosa?',
    '¿Qué cheques y servicios se vencen esta semana?',
    '¿Cuánto le debemos actualmente a los proveedores?',
    '¿Cuál es nuestro margen de utilidad neta estimada?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    setInputText('');
    setIsLoading(true);
    await sendChatMessage(text);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header del Chat */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-indigo-600 rounded-xl text-white shadow-lg">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Asistente Financiero & Administrativo IA</h3>
            <p className="text-[11px] text-slate-400">Consulta cualquier dato financiero, cheques o mermas en lenguaje natural</p>
          </div>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
          Conectado a Datos
        </span>
      </div>

      {/* Sugerencias Rápidas */}
      <div className="bg-slate-950/60 p-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700/80 whitespace-nowrap transition-all shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Historial de Mensajes */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`p-2 rounded-xl text-white shrink-0 ${
              msg.sender === 'user' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-lg'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div className={`text-[9px] text-right ${msg.sender === 'user' ? 'text-slate-900/70' : 'text-slate-500'}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-amber-400 italic bg-slate-950/80 p-3 rounded-xl border border-slate-800 w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            La IA está consultando la base de datos financiera...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Campo de Entrada de Texto */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Pregúntale cualquier dato a la IA (ej. ¿Cuánto gastamos en carne el mes pasado?)..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold p-3 rounded-xl shadow-lg transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
