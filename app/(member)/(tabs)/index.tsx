import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollView, View, FlatList, TouchableOpacity } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

const TASKS = [
  { id: '1', name: 'Submit Q3 Report', priority: 'high', due: 'Today', done: false },
  { id: '2', name: 'Review Budget Proposal', priority: 'medium', due: 'Tomorrow', done: false },
  { id: '3', name: 'Update Member Directory', priority: 'low', due: 'Aug 10', done: true },
  { id: '4', name: 'Prepare Meeting Agenda', priority: 'high', due: 'Aug 8', done: false },
  { id: '5', name: 'Send Newsletter Draft', priority: 'medium', due: 'Aug 12', done: false },
];

const ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'General Assembly Reminder',
    body: 'Monthly GA is scheduled for August 15. All officers are required to attend.',
    date: 'Aug 5',
    tag: 'Official',
  },
  {
    id: '2',
    title: 'New Portal Guidelines',
    body: 'Please review the updated submission guidelines posted in the shared drive.',
    date: 'Aug 3',
    tag: 'Update',
  },
  {
    id: '3',
    title: 'Welcome New Members!',
    body: '12 new members joined SSC this semester. Reach out and make them feel welcome.',
    date: 'Aug 1',
    tag: 'Community',
  },
];

const ACTIVITY = [
  { id: '1', text: 'Update Member Directory marked done', time: '2h ago' },
  { id: '2', text: 'Budget Proposal task was assigned to you', time: '5h ago' },
  { id: '3', text: 'New announcement posted by Admin', time: 'Yesterday' },
  { id: '4', text: 'Leadership Summit added to calendar', time: 'Aug 4' },
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

const TaskCard = ({ name, priority, due, done }: (typeof TASKS)[0]) => (
  <View className="bg-card rounded-2xl p-4 mr-3 w-44 border border-border">
    <View className="flex-row items-center gap-2 mb-2">
      <View
        className={`w-2 h-2 rounded-full ${
          done
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
          done
            ? 'text-gray-400'
            : priority === 'high'
            ? 'text-red-400'
            : priority === 'medium'
            ? 'text-yellow-500'
            : 'text-green-500'
        }`}
      >
        {done ? 'Done' : priority}
      </Text>
    </View>
    <Text
      className={`text-sm font-semibold mb-2 ${
        done ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-800 dark:text-white'
      }`}
      numberOfLines={2}
    >
      {name}
    </Text>
    <Text className="text-xs text-gray-400">Due {due}</Text>
  </View>
);

const AnnouncementCard = ({ title, body, date, tag }: (typeof ANNOUNCEMENTS)[0]) => (
  <View className="bg-card rounded-2xl p-4 mb-3 border border-border">
    <View className="flex-row justify-between items-center mb-2">
      <View className="bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
        <Text className="text-xs font-semibold text-primary">{tag}</Text>
      </View>
      <Text className="text-xs text-gray-400">{date}</Text>
    </View>
    <Text className="text-sm font-bold text-gray-800 dark:text-white mb-1">{title}</Text>
    <Text className="text-xs text-gray-500 leading-5" numberOfLines={2}>
      {body}
    </Text>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const auth = getAuth();
  const { user, setUser } = useAuth();

  const completedTasks = TASKS.filter((t) => t.done).length;
  const totalTasks = TASKS.length;

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
            <Text className="text-sky-200 text-xs mt-0.5">SSC Task Dashboard</Text>
          </View>
          <TouchableOpacity
            onPress={handleSignout}
            activeOpacity={0.7}
            className="bg-white/20 px-4 py-2 rounded-full border border-white/30"
          >
            <Text className="text-white text-xs font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white/20 rounded-xl p-3 mt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-white text-xs font-medium">Weekly Progress</Text>
            <Text className="text-white text-xs font-bold">
              {completedTasks}/{totalTasks} tasks
            </Text>
          </View>
          <View className="bg-white/30 rounded-full h-1.5">
            <View
              className="bg-white rounded-full h-1.5"
              style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
            />
          </View>
        </View>
      </View>

      <View className="px-5 mt-5 gap-6">
        <View>
          <SectionHeader
            title="Assigned Tasks"
            actionLabel="View All"
            onAction={() => router.push('/tasks')}
          />
          <FlatList
            data={TASKS}
            horizontal
            renderItem={({ item }) => <TaskCard {...item} />}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View>
          <SectionHeader
            title="Announcements"
            actionLabel="See All"
            onAction={() => router.push('/announcements')}
          />
          {ANNOUNCEMENTS.map((a) => (
            <AnnouncementCard key={a.id} {...a} />
          ))}
        </View>

        <View>
          <SectionHeader
            title="Recent Activity"
            actionLabel="History"
            onAction={() => router.push('/activity')}
          />
          <View className="bg-background rounded-2xl border border-border overflow-hidden">
            {ACTIVITY.map((item, index) => (
              <View
                key={item.id}
                className={`flex-row items-center px-4 py-3 gap-3 ${
                  index < ACTIVITY.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                <Text className="flex-1 text-xs text-gray-600 leading-5">{item.text}</Text>
                <Text className="text-xs text-gray-400 shrink-0">{item.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}