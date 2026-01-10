
import React, { useState } from 'react';
import { MeetingNote, AuthUser } from '../types';
import { 
  MessageSquareText, 
  Plus, 
  Send, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  User,
  Calendar,
  AlertCircle,
  Megaphone,
  StickyNote
} from 'lucide-react';

interface MeetingNotesProps {
  notes: MeetingNote[];
  authUser: AuthUser;
  onAdd: (note: MeetingNote) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}

const MeetingNotes: React.FC<MeetingNotesProps> = ({ notes, authUser, onAdd, onPublish, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [content, setContent] = useState('');
  
  const isAdmin = authUser.role === 'ADMIN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      month,
      content: content.trim(),
      publishedAt: null,
      author: authUser.name,
      createdAt: new Date().toISOString()
    });

    setContent('');
    setIsAdding(false);
  };

  const displayedNotes = isAdmin 
    ? notes 
    : notes.filter(n => n.publishedAt !== null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Meeting Minutes</h2>
          <p className="text-slate-500 font-medium">Monthly updates, decisions, and group resolutions.</p>
        </div>
        {isAdmin && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 font-bold"
          >
            <Plus size={18} />
            Write Notes
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl overflow-hidden p-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <StickyNote size={24} />
            </div>
            <h3 className="text-xl font-bold">Compose Meeting Minutes</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Meeting Month</label>
                <input 
                  type="month" 
                  className="w-full p-4 rounded-2xl border-2 border-slate-50 focus:border-emerald-500 outline-none transition-all font-bold bg-slate-50/50"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest">Meeting Resolutions & Notes</label>
              <textarea 
                required
                className="w-full p-6 rounded-2xl border-2 border-slate-50 focus:border-emerald-500 outline-none transition-all min-h-[250px] font-medium leading-relaxed bg-slate-50/50"
                placeholder="List down important decisions, member attendance, and next steps..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Save as Draft
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {displayedNotes.length > 0 ? (
          displayedNotes.map((note) => (
            <div 
              key={note.id} 
              className={`bg-white rounded-[2rem] border-2 transition-all shadow-sm hover:shadow-md ${
                !note.publishedAt ? 'border-dashed border-slate-200' : 'border-slate-50'
              }`}
            >
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${note.publishedAt ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900">
                        {new Date(note.month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <User size={12} />
                          {note.author}
                        </span>
                        {note.publishedAt && (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} />
                            Published
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-2 shrink-0">
                      {!note.publishedAt && (
                        <button 
                          onClick={() => onPublish(note.id)}
                          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                        >
                          <Megaphone size={14} />
                          Publish & Notify
                        </button>
                      )}
                      <button 
                        onClick={() => onDelete(note.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <Clock size={12} />
                    Logged: {new Date(note.createdAt).toLocaleString()}
                  </div>
                  {note.publishedAt && (
                     <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                       Notified to all members
                     </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <MessageSquareText size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-400">No meeting notes recorded yet.</h3>
            <p className="text-sm text-slate-300 mt-1">Check back later for group updates and resolutions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingNotes;
