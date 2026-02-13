import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollView, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { db } from '@/FirebaseConfig'
import { collection, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type Task = {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'todo' | 'in-progress' | 'done';
  assigneeUid: string;
  progress: number;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: any;
  tag: string;
  readBy: string[];
};

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

const SectionHeader = ({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <View className="flex-row justify-between items-center mb-3">
    <Text className="text-base font-bold text-gray-800 dark:text-white">{title}</Text>
    {actionLabel && (
      <TouchableOpacity activeOpacity={0.7} onPress={onAction}>
        <Text className="text-xs text-primary font-medium">{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const TaskCard = ({ name, priority, dueDate, status, progress }: Task) => (
  <View className="bg-card rounded-2xl p-4 mr-3 w-44 border border-border">
    <View className="flex-row items-center gap-2 mb-2">
      <View
        className={`w-2 h-2 rounded-full ${
          status === 'done'
            ? 'bg-gray-300'
            : priority === 'high'
            ? 'bg-red-400'
            : priority === 'medium'
            ? 'bg-yellow-400'
            : 'bg-green-400'
        }`}
      />
      <Text
        className={`text-xs font-semibold uppercase tracking-wide ${
          status === 'done'
            ? 'text-gray-400'
            : priority === 'high'
            ? 'text-red-400'
            : priority === 'medium'
            ? 'text-yellow-500'
            : 'text-green-500'
        }`}
      >
        {status === 'done' ? 'Done' : priority}
      </Text>
    </View>
    <Text
      className={`text-sm font-semibold mb-2 ${
        status === 'done' ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-800 dark:text-white'
      }`}
      numberOfLines={2}
    >
      {name}
    </Text>
    <Text className="text-xs text-gray-400">Due {dueDate}</Text>
    {progress > 0 && progress < 100 && (
      <View className="mt-2">
        <View className="bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <View
            className="bg-primary rounded-full h-1"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>
    )}
  </View>
);

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

const AnnouncementCard = ({ id, title, body, createdAt, tag, readBy, currentUserId }: Announcement & { currentUserId: string }) => {
  const router = useRouter();
  const isUnread = !readBy?.includes(currentUserId);
  
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => router.push(`/announcements/${id}`)}
      className="bg-card rounded-2xl p-4 mb-3 border border-border"
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
          <Text className="text-xs font-semibold text-primary">{tag}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-gray-400">{formatDate(createdAt)}</Text>
          {isUnread && (
            <View className="w-2 h-2 rounded-full bg-sky-500" />
          )}
        </View>
      </View>
      <Text className="text-sm font-bold text-gray-800 dark:text-white mb-1">{title}</Text>
      <Text className="text-xs text-gray-500 leading-5" numberOfLines={2}>
        {body}
      </Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const auth = getAuth();
  const { user, setUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const allTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      const userTasks = allTasks
        .filter(task => task.assigneeUid === user.uid)
        .slice(0, 5);
      
      setTasks(userTasks);
    });

    const unsubscribeAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const allAnnouncements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      
      const sortedAnnouncements = allAnnouncements
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        })
        .slice(0, 3);
      
      setAnnouncements(sortedAnnouncements);
      setLoading(false);
    });

    const unsubscribeNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
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
        })
        .slice(0, 4);
      
      setNotifications(userNotifications);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeAnnouncements();
      unsubscribeNotifications();
    };
  }, [user?.uid]);

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const unreadAnnouncements = announcements.filter(a => !a.readBy?.includes(user?.uid || '')).length;

  const handleSignout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/signin');
    } catch (error) {
      console.error(error);
    }
  };

  if (!user)
    return (
      <View className="flex-1 bg-gray-50 p-5 gap-4 mt-safe">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </View>
    );

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-10"
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-primary dark:bg-blue-800 pt-14 pb-6 px-5">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-sky-200 text-xs mb-0.5">Welcome back 👋</Text>
            <Text className="text-white text-xl font-bold">
              {user?.firstname ?? 'Officer'}
            </Text>
            <Text className="text-sky-200 text-xs mt-0.5">{user?.position || 'SSC Member'}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {totalTasks > 0 && (
          <View className="bg-white/20 rounded-xl p-3 mt-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-white text-xs font-medium">Task Progress</Text>
              <Text className="text-white text-xs font-bold">
                {completedTasks}/{totalTasks} tasks
              </Text>
            </View>
            <View className="bg-white/30 rounded-full h-1.5">
              <View
                className="bg-white rounded-full h-1.5"
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              />
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View className="px-5 mt-5 gap-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </View>
      ) : (
        <View className="px-5 mt-5 gap-6">
          {/* Tasks Section */}
          {tasks.length > 0 && (
            <View>
              <SectionHeader
                title="Your Tasks"
                actionLabel="View All"
                onAction={() => router.push('/tasks')}
              />
              <FlatList
                data={tasks}
                horizontal
                renderItem={({ item }) => <TaskCard {...item} />}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {/* Announcements Section */}
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-gray-800 dark:text-white">Announcements</Text>
                {unreadAnnouncements > 0 && (
                  <View className="bg-sky-500 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs font-bold">{unreadAnnouncements}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/announcements')}>
                <Text className="text-xs text-primary font-medium">See All</Text>
              </TouchableOpacity>
            </View>
            
            {announcements.length > 0 ? (
              announcements.map((a) => (
                <AnnouncementCard key={a.id} {...a} currentUserId={user?.uid || ''} />
              ))
            ) : (
              <View className="bg-card rounded-2xl p-8 border border-border items-center">
                <Text className="text-4xl mb-2">📭</Text>
                <Text className="text-sm text-gray-500">No announcements yet</Text>
              </View>
            )}
          </View>

          {/* Empty State for Tasks */}
          {tasks.length === 0 && (
            <View className="bg-card rounded-2xl p-8 border border-border items-center">
              <Text className="text-4xl mb-2">✅</Text>
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">No tasks assigned</Text>
              <Text className="text-xs text-gray-500">You're all caught up!</Text>
            </View>
          )}

          {/* Recent Notifications */}
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-gray-800 dark:text-white">Recent Notifications</Text>
                {notifications.filter(n => !n.read).length > 0 && (
                  <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {notifications.filter(n => !n.read).length}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/notifications')}>
                <Text className="text-xs text-primary font-medium">View All</Text>
              </TouchableOpacity>
            </View>
            
            {notifications.length > 0 ? (
              <View className="bg-card rounded-2xl border border-border overflow-hidden">
                {notifications.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push('/notifications')}
                    className={`flex-row items-start px-4 py-3 gap-3 ${
                      index < notifications.length - 1 ? 'border-b border-border/50' : ''
                    } ${!item.read ? 'bg-sky-50 dark:bg-sky-950' : ''}`}
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-800 dark:text-white mb-0.5">
                        {item.title}
                      </Text>
                      <Text className="text-xs text-gray-600 dark:text-gray-300 leading-5">
                        {item.message}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-xs text-gray-400 shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                      {!item.read && (
                        <View className="w-2 h-2 rounded-full bg-sky-500" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="bg-card rounded-2xl p-8 border border-border items-center">
                <Text className="text-4xl mb-2">🔔</Text>
                <Text className="text-sm text-gray-500">No notifications</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}