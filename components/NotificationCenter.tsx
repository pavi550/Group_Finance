
import React from 'react';
import { AppNotification } from '../types';
import { Bell, CheckCircle, Trash2, Clock, Info, HandCoins } from 'lucide-react';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: () => void;
  onClear: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onMarkRead, onClear }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Administrative Alerts</h2>
          <p className="text-slate-500 font-medium">Notifications of critical group financial activities.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onMarkRead}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <CheckCircle size={14} />
            Mark all read
          </button>
          <button 
            onClick={onClear}
            className="flex items-center gap-2 bg-white border border-red-100 px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 size={14} />
            Clear all
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-6 rounded-[2rem] border transition-all relative overflow-hidden group ${
                n.read ? 'bg-white border-slate-100 opacity-75' : 'bg-white border-blue-200 shadow-md ring-1 ring-blue-50'
              }`}
            >
              {!n.read && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
              )}
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                  n.type === 'LOAN_DISBURSED' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {n.type === 'LOAN_DISBURSED' ? <HandCoins size={24} /> : <Info size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {n.type.replace('_', ' ')}
                    </span>
                    {!n.read && (
                      <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-slate-900 font-bold text-lg leading-tight group-hover:text-blue-600 transition-colors">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Clock size={12} />
                    {new Date(n.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[2rem] p-16 text-center border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-400">No new alerts.</h3>
            <p className="text-sm text-slate-300 mt-2">Critical activity notifications will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
