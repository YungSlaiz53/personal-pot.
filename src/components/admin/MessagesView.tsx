import React from 'react';
import { Mail, Trash2, CheckCircle2, Clock, User, Reply } from 'lucide-react';
import { VaultMessage } from '../../types/vault';
import { formatTimeAgo } from '../../utils/formatters';
import { api } from '../../services/api';

interface MessagesViewProps {
  messages: VaultMessage[];
  onRefresh: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ messages, onRefresh }) => {
  const handleMarkRead = async (id: string) => {
    await api.admin.markMessageRead(id);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this inquiry message?')) return;
    await api.admin.deleteMessage(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="vault-panel rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#F5C518]" />
          <span>Visitor Inquiries & Collaboration Contacts</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Direct messages submitted by recruiters, employers, and clients through your public portfolio contact form.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="vault-panel rounded-2xl p-12 text-center text-slate-500 text-xs flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1E2533] flex items-center justify-center text-slate-400 mb-3">
            <Mail className="w-7 h-7" />
          </div>
          <p className="font-semibold text-slate-300">No visitor inquiries yet</p>
          <p className="text-slate-500 mt-1">Messages submitted from your public portfolio contact form will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`vault-panel rounded-2xl p-5 transition-all ${
                !msg.read ? 'border-[#F5C518]/40 bg-[#161B26]' : 'border-[#1E2533]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#0E121A] border border-[#232A3B] flex items-center justify-center text-[#F5C518] font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{msg.name}</span>
                      {!msg.read && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5C518] text-black font-extrabold uppercase">
                          New
                        </span>
                      )}
                    </h3>
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-xs text-[#F5C518] hover:underline"
                    >
                      {msg.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimeAgo(msg.createdAt)}
                  </span>
                  {!msg.read && (
                    <button
                      onClick={() => handleMarkRead(msg.id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-emerald-500/10"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-[#0E121A] border border-[#1E2533] rounded-xl p-3 text-xs">
                <div className="font-semibold text-slate-200 mb-1">Subject: {msg.subject}</div>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>

              <div className="mt-3 flex justify-end">
                <a
                  href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1E2533] hover:bg-[#2B3548] text-[#F5C518] text-xs font-semibold transition-colors"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
