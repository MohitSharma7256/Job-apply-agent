import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useSocket';
import { Bell, CheckCircle, AlertCircle, Info, X, Check } from 'lucide-react';

const notificationConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800'
  }
};

export function NotificationCenter({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, clearNotifications, markNotificationRead, unreadNotificationsCount } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notification-center')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
  };

  const handleClearAll = () => {
    clearNotifications();
    setIsOpen(false);
  };

  return (
    <div className={`notification-center relative ${className}`}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <div>No notifications</div>
                <div className="text-sm">You're all caught up!</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const config = notificationConfig[notification.type] || notificationConfig.info;
                  const NotificationIcon = config.icon;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${config.bgColor}`}>
                          <NotificationIcon className={`w-4 h-4 ${config.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${config.titleColor}`}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </div>
                            </div>
                            {!notification.read && (
                              <div className="ml-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Notification Toast Component
export function NotificationToast({ notification, onClose, className = '' }) {
  const config = notificationConfig[notification.type] || notificationConfig.info;
  const NotificationIcon = config.icon;

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 shadow-lg ${className}`}>
      <div className="flex items-start space-x-3">
        <NotificationIcon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${config.titleColor}`}>
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Notification Container for toasts
export function NotificationContainer({ className = '' }) {
  const { notifications } = useNotifications();
  const [visibleToasts, setVisibleToasts] = useState(new Set());

  // Show new notifications as toasts
  useEffect(() => {
    const newNotifications = notifications.filter(n => !visibleToasts.has(n.id));
    
    newNotifications.forEach(notification => {
      setVisibleToasts(prev => new Set(prev).add(notification.id));
      
      // Remove toast after animation
      setTimeout(() => {
        setVisibleToasts(prev => {
          const newSet = new Set(prev);
          newSet.delete(notification.id);
          return newSet;
        });
      }, 6000);
    });
  }, [notifications, visibleToasts]);

  const activeToasts = notifications.filter(n => visibleToasts.has(n.id));

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {activeToasts.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => {
            setVisibleToasts(prev => {
              const newSet = new Set(prev);
              newSet.delete(notification.id);
              return newSet;
            });
          }}
          className="transform transition-all duration-300 ease-in-out"
        />
      ))}
    </div>
  );
}

// Compact Notification Badge
export function NotificationBadge({ className = '' }) {
  const { unreadNotificationsCount } = useNotifications();

  if (unreadNotificationsCount === 0) {
    return null;
  }

  return (
    <span className={`bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium ${className}`}>
      {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
    </span>
  );
}
