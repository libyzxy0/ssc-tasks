import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollView, View, FlatList, TouchableOpacity } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import Octicons from '@expo/vector-icons/Octicons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '@/lib/theme';

const ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'General Assembly Reminder',
    body: 'Monthly GA is scheduled for August 15. All officers are required to attend.',
    date: 'Aug 5',
    tag: 'Official',
    audience: 'All Members',
  },
  {
    id: '2',
    title: 'New Portal Guidelines',
    body: 'Please review the updated submission guidelines posted in the shared drive.',
    date: 'Aug 3',
    tag: 'Update',
    audience: 'Officers',
  },
  {
    id: '3',
    title: 'Welcome New Members!',
    body: '12 new members joined SSC this semester. Reach out and make them feel welcome.',
    date: 'Aug 1',
    tag: 'Community',
    audience: 'All Members',
  },
];

const OVERVIEW = [
  { id: '1', label: 'Announcements', value: '14' },
  { id: '2', label: 'Completed Tasks', value: '8 / 24' },
  { id: '3', label: 'Members', value: '14' },
  { id: '4', label: 'Admins', value: '5' },
];

const ACTIVITY = [
  { id: '1', text: 'Budget Request approved by Treasurer Cruz', time: '1h ago' },
  { id: '2', text: 'New member registration: 3 accounts pending verification', time: '3h ago' },
  { id: '3', text: 'Room Reservation submitted by A. Cruz', time: '5h ago' },
  { id: '4', text: 'Announcement posted: General Assembly Reminder', time: 'Yesterday' },
  { id: '5', text: 'Officer nomination submitted for PRO position', time: 'Aug 4' },
];

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
  trend,
  trendUp,
}: (typeof OVERVIEW)[0]) => (
  <View className="bg-card rounded-2xl p-3 mr-3 w-36 border border-border">
    <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{value}</Text>
    <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2" numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const AnnouncementCard = ({
  title,
  body,
  date,
  tag,
  audience,
  onEdit,
}: (typeof ANNOUNCEMENTS)[0] & { onEdit: () => void }) => (
  <View className="bg-card rounded-2xl p-4 mb-3 border border-border">
    <View className="flex-row justify-between items-center mb-2">
      <View className="flex-row gap-2 items-center">
        <View className="bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
          <Text className="text-xs font-semibold text-primary">{tag}</Text>
        </View>
        <View className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
          <Text className="text-xs text-gray-500 dark:text-gray-400">{audience}</Text>
        </View>
      </View>
      <Text className="text-xs text-gray-400">{date}</Text>
    </View>
    <Text className="text-sm font-bold text-gray-800 dark:text-white mb-1">{title}</Text>
    <Text className="text-xs text-gray-500 leading-5 mb-3" numberOfLines={2}>
      {body}
    </Text>
    <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
      <Text className="text-xs text-primary font-medium">Edit Announcement →</Text>
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
            onPress={handleSignout}
            activeOpacity={0.7}
            className="bg-white/10 px-4 py-2 rounded-full border border-white/20"
          >
            <Text className="text-white text-xs font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
<View className="bg-white/20 rounded-xl p-3 mt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-white text-xs font-medium">Member Tasks Completed</Text>
            <Text className="text-white text-xs font-bold">
              {8}/{24} tasks
            </Text>
          </View>
          <View className="bg-white/30 rounded-full h-1.5">
            <View
              className="bg-white rounded-full h-1.5"
              style={{ width: `${(8 / 24) * 100}%` }}
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
            data={OVERVIEW}
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
          {ANNOUNCEMENTS.map((a) => (
            <AnnouncementCard
              key={a.id}
              {...a}
              onEdit={() => router.push(`/admin/announcements/${a.id}/edit` as any)}
            />
          ))}
        </View>

        <View>
          <SectionHeader
            title="Recent Activity"
            actionLabel="See all"
            onAction={() => router.push('/admin/activity')}
          />
          <View className="bg-background rounded-2xl border border-border overflow-hidden">
            {ACTIVITY.map((item, index) => (
              <View
                key={item.id}
                className={`flex-row items-center px-4 py-3 gap-3 ${
                  index < ACTIVITY.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                <Text className="flex-1 text-xs text-gray-600 dark:text-gray-400 leading-5">
                  {item.text}
                </Text>
                <Text className="text-xs text-gray-400 shrink-0">{item.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}