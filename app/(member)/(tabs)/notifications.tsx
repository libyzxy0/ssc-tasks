import { Text } from '@/components/ui/text';
import { ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';
import { useAuth } from '@/hooks/useAuth';

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  read: boolean;
  type: string;
  actionId?: string;
  userId: string;
};

const formatTimeAgo = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const typeIcons: Record<string, string> = {
  task: 'rocket',
  announcement: 'information-circle-outline',
  calendar: 'calendar-outline',
  system: 'settings-outline',
  other: 'notification-outline'
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const allNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      const userNotifications = allNotifications
        .filter(notif => notif.userId === user.uid)
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
      
      setNotifications(userNotifications);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    const updates = unreadNotifs.map(n => 
      updateDoc(doc(db, 'notifications', n.id), { read: true })
    );
    await Promise.all(updates);
  };
  
  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    switch (notification.type) {
      case 'announcement':
        router.push(`/announcements/${notification.actionId}`);
        break;
      case 'task':
        router.push(`/tasks/${notification.actionId}`);
        break;
      default:
        console.error('Invalid type, dont redirect!');
        break;
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card px-5 pt-14 pb-4 border-b border-border">
        <View className="flex-row items-center gap-3 mb-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-background items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color={colorScheme === 'dark' ? 'white' : '#1b1b1b'} />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center gap-2">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">Notifications</Text>
            {unreadCount > 0 && (
              <View className="bg-green-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-[12px]">{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead}>
              <Text className="text-xs font-semibold text-primary">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity activeOpacity={0.7}
            onPress={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full border ${
              filter === 'all'
                ? 'bg-primary border-primary'
                : 'bg-card border-border'
            }`}
          >
            <Text className={`text-xs font-semibold ${
              filter === 'all' ? 'text-white' : 'text-gray-500'
            }`}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}
            onPress={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full border ${
              filter === 'unread'
                ? 'bg-primary border-primary'
                : 'bg-card border-border'
            }`}
          >
            <Text className={`text-xs font-semibold ${
              filter === 'unread' ? 'text-white' : 'text-gray-500'
            }`}>
              Unread
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-5">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
            activeOpacity={0.7}
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
              className={`bg-card rounded-2xl p-4 mb-3 border border-border ${
                !notification.read ? 'border-primary/20 bg-primary/10' : ''
              }`}
            >
              <View className="flex-row items-start gap-3">
                <Ionicons name={typeIcons[notification.type] || 'notification-outline'} size={24} color={colorScheme === 'dark' ? '#e9e9e9' : '#000000'} />
                
                <View className="flex-1">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="text-sm font-bold text-gray-900 dark:text-white flex-1">
                      {notification.title}
                    </Text>
                    {!notification.read && (
                      <View className="w-2 h-2 rounded-full bg-primary ml-2 mt-1" />
                    )}
                  </View>
                  
                  <Text className="text-xs text-gray-600 dark:text-gray-300 leading-5 mb-2">
                    {notification.message}
                  </Text>
                  
                  <Text className="text-xs text-gray-400">
                    {formatTimeAgo(notification.createdAt)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center py-20 gap-2">
            <Text className="text-4xl">🔔</Text>
            <Text className="text-base font-bold text-gray-700 dark:text-gray-200">
              {filter === 'unread' ? 'All caught up!' : 'No notifications'}
            </Text>
            <Text className="text-sm text-gray-400">
              {filter === 'unread' ? "You've read all your notifications" : 'No notifications yet'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}