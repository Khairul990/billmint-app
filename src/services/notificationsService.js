export const getNotifications = () => {
  const userId = localStorage.getItem('billqyro_real_user_id') || 'local-user';
  return JSON.parse(localStorage.getItem(`billqyro_notifications_${userId}`) || '[]');
};

export const addNotification = (title, message, type = 'info') => {
  const userId = localStorage.getItem('billqyro_real_user_id') || 'local-user';
  const notifs = getNotifications();
  const newNotif = {
    id: 'notif_' + Date.now() + Math.random().toString(36).substr(2, 9),
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };
  const updated = [newNotif, ...notifs];
  localStorage.setItem(`billqyro_notifications_${userId}`, JSON.stringify(updated));
  window.dispatchEvent(new Event('billqyro_notifications_updated'));
  return newNotif;
};

export const markNotificationAsRead = (id) => {
  const userId = localStorage.getItem('billqyro_real_user_id') || 'local-user';
  const notifs = getNotifications();
  const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(`billqyro_notifications_${userId}`, JSON.stringify(updated));
  window.dispatchEvent(new Event('billqyro_notifications_updated'));
};

export const clearAllNotifications = () => {
  const userId = localStorage.getItem('billqyro_real_user_id') || 'local-user';
  localStorage.setItem(`billqyro_notifications_${userId}`, '[]');
  window.dispatchEvent(new Event('billqyro_notifications_updated'));
};
