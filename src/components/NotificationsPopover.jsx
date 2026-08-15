import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Heart, MessageSquare, Mail, Check, Loader2 } from 'lucide-react';

export default function NotificationsPopover({ session }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (full_name, avatar_url)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    fetchNotifications();

    // Subscribe to real-time notification updates
    const channel = supabase
      .channel(`public:notifications:user_id=eq.${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, read: true }))
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
      case 'message':
        return <Mail className="h-3.5 w-3.5 text-[#006837]" />;
      default:
        return <Bell className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const getMessage = (notification) => {
    const actorName = notification.actor?.full_name || 'Someone';
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post.`;
      case 'comment':
        return `${actorName} commented on your post.`;
      case 'message':
        return `${actorName} sent you a message.`;
      default:
        return `${actorName} interacted with your account.`;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAllAsRead();
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#e4e6eb] bg-white shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h4 className="text-xs font-bold text-gray-800">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#006837] hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-[#006837]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 transition-colors ${
                    !n.read ? 'bg-green-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700 overflow-hidden">
                      {n.actor?.avatar_url ? (
                        <img
                          src={n.actor.avatar_url}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        n.actor?.full_name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-xs">
                      {getIcon(n.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 leading-snug">
                      {getMessage(n)}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(n.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
