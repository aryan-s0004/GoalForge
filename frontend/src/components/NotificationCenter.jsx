import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead } from '../lib/api';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      const list = res.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to retrieve team notifications center items');
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Poll for notifications every 8 seconds to show instant HR Escalation/Approval triggers
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to dismiss notification item', id);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => markNotificationRead(n.id)));
      fetchNotifications();
    } catch (err) {
      console.error('Failed to dismiss all notifications');
    }
  };

  return (
    <div className="relative">
      
      {/* Notification Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition focus:outline-none flex items-center justify-center"
      >
        <span className="text-sm">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 bg-rose-500 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Card */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-4 z-50 animate-rise max-h-[380px] overflow-y-auto space-y-3">
            
            {/* Dropdown Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Activity Feed</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-[11px]">
                No recent notifications.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/40">
                {notifications.map((n) => {
                  const typeIcon = n.type?.includes('ESCALATION') ? '⚠️' : '🔔';
                  return (
                    <div
                      key={n.id}
                      className={`py-3 first:pt-0 last:pb-0 space-y-1 transition ${!n.read ? 'opacity-100' : 'opacity-60'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs mt-0.5 shrink-0">{typeIcon}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-200 leading-tight">
                              {n.title || 'Notification Alert'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                        </div>
                        
                        {!n.read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-[10px] text-slate-500 hover:text-slate-300 shrink-0 font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="text-[8px] text-slate-500 font-mono text-right">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}
