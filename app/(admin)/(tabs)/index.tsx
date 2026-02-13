import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollView, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { db } from '@/FirebaseConfig'
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { useState, useEffect } from 'react';

// Helper function to format Firestore timestamp
const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper to get time ago text
const getTimeAgo = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const QUICK_ACTIONS = [
  { id: '1', label: 'Post Announcement', icon: 'newspaper-outline', route: '/admin/announcements/new', color: '#1d84e3' },
  { id: '2', label: 'Assign Task', icon: 'person-add-outline', route: '/(admin)/tasks/new', color: '#d33131' },
];

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
      <TouchableOpacity onPress={onAction}>
        <Text className="text-xs text-primary font-medium">{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const StatCard = ({
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) => (
  <View className="bg-card rounded-2xl p-3 mr-3 w-36 border border-border">
    <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{value}</Text>
    <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2" numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const AnnouncementCard = ({
  id,
  title,
  body,
  createdAt,
  tag,
  author,
  onEdit,
}: {
  id: string;
  title: string;
  body: string;
  createdAt: any;
  tag: string;
  author: string;
  onEdit: () => void;
}) => (
  <View className="bg-card rounded-2xl p-4 mb-3 border border-border">
    <View className="flex-row justify-between items-center mb-2">
      <View className="flex-row gap-2 items-center">
        <View className="bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
          <Text className="text-xs font-semibold text-primary">{tag}</Text>
        </View>
        <View className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
          <Text className="text-xs text-gray-500 dark:text-gray-400">{author}</Text>
        </View>
      </View>
      <Text className="text-xs text-gray-400">{formatDate(createdAt)}</Text>
    </View>
    <Text className="text-sm font-bold text-gray-800 dark:text-white mb-1">{title}</Text>
    <Text className="text-xs text-gray-500 leading-5 mb-3" numberOfLines={2}>
      {body}
    </Text>
    <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
      <Text className="text-xs text-primary font-medium">View Announcement →</Text>
    </TouchableOpacity>
  </View>
);

const QuickActionButton = ({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}) => {
  return (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    className="flex-1 bg-card border border-border rounded-xl p-3 items-center gap-1.5"
  >
    <Ionicons name={icon} size={26} color={color} />
    <Text className="text-xs text-gray-600 dark:text-gray-400 text-center">
      {label}
    </Text>
  </TouchableOpacity>
)
};

export default function AdminHomeScreen() {
  const router = useRouter();
  const auth = getAuth();
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [overview, setOverview] = useState([
    { id: '1', label: 'Announcements', value: '0' },
    { id: '2', label: 'Completed Tasks', value: '0 / 0' },
    { id: '3', label: 'Members', value: '0' },
    { id: '4', label: 'Admins', value: '0' },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const memberCount = users.length;
      const adminCount = users.filter((u: any) => u.role === 'admin').length;

      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
      const totalTasks = tasks.length;

      const announcementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const announcementsData = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(announcementsData);

      const notificationsQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationsData = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentActivity(notificationsData.filter((notif) => notif.userId === user?.uid));

      setOverview([
        { id: '1', label: 'Announcements', value: announcementsSnapshot.size.toString() },
        { id: '2', label: 'Completed Tasks', value: `${completedTasks} / ${totalTasks}` },
        { id: '3', label: 'Members', value: memberCount.toString() },
        { id: '4', label: 'Admins', value: adminCount.toString() },
      ]);

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleSignout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/signin');
    } catch (error) {
      console.error(error);
    }
  };

  if (!user || loading)
    return (
      <View className="flex-1 bg-background p-5 gap-4 mt-safe">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </View>
    );

  const completedTasks = parseInt(overview[1].value.split('/')[0].trim());
  const totalTasks = parseInt(overview[1].value.split('/')[1].trim());
  const taskCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-10"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="bg-red-500 dark:bg-red-950 pt-14 pb-6 px-5">
        <View className="flex-row justify-between items-start">
          <View>
            <View className="flex-row items-center gap-2 mb-0.5">
              <Text className="text-red-200 text-xs">Welcome back 👋</Text>
            </View>
            <Text className="text-white text-xl font-bold">
              {user?.firstname ?? 'Admin'}
            </Text>
            <Text className="text-red-200 text-xs mt-0.5">SSC Admin Dashboard</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View className="bg-white/20 rounded-xl p-3 mt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-white text-xs font-medium">Member Tasks Completed</Text>
            <Text className="text-white text-xs font-bold">
              {completedTasks}/{totalTasks} tasks
            </Text>
          </View>
          <View className="bg-white/30 rounded-full h-1.5">
            <View
              className="bg-white rounded-full h-1.5"
              style={{ width: `${taskCompletionPercentage}%` }}
            />
          </View>
        </View>
      </View>

      <View className="px-5 mt-5 gap-6">

        <View>
          <SectionHeader title="Quick Actions" />
          <View className="flex-row gap-2">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionButton
                key={action.id}
                label={action.label}
                icon={action.icon}
                color={action.color}
                onPress={() => router.push(action.route as any)}
              />
            ))}
          </View>
        </View>

        <View>
          <SectionHeader
            title="Overview"
            onAction={() => router.push('/admin/members')}
          />
          <FlatList
            data={overview}
            horizontal
            renderItem={({ item }) => <StatCard {...item} />}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View>
          <SectionHeader
            title="Announcements"
            actionLabel="See all"
            onAction={() => router.push('/admin/announcements')}
          />
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <AnnouncementCard
                key={a.id}
                id={a.id}
                title={a.title}
                body={a.body}
                createdAt={a.createdAt}
                tag={a.tag}
                author={a.author}
                onEdit={() => router.push(`/(admin)/announcements/${a.id}` as any)}
              />
            ))
          ) : (
            <View className="bg-card rounded-2xl p-4 border border-border">
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
                No announcements yet
              </Text>
            </View>
          )}
        </View>

        <View>
          <SectionHeader
            title="Notifications"
            actionLabel="See all"
            onAction={() => router.push('/admin/activity')}
          />
          <View className="bg-background rounded-2xl border border-border overflow-hidden">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <View
                  key={item.id}
                  className={`flex-row items-center px-4 py-3 gap-3 ${
                    index < recentActivity.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <Text className="flex-1 text-xs text-gray-600 dark:text-gray-400 leading-5">
                    {item.message}
                  </Text>
                  <Text className="text-xs text-gray-400 shrink-0">
                    {getTimeAgo(item.createdAt)}
                  </Text>
                </View>
              ))
            ) : (
              <View className="px-4 py-3">
                <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  No recent activity
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}