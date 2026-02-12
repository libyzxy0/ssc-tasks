import { Text } from '@/components/ui/text';
import { ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { db } from '@/FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in-progress' | 'done';

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type Task = {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string;
  createdAt: any;
  assignee: string;
  category: string;
  checklist: ChecklistItem[];
};

const priorityConfig: Record<Priority, { dot: string; text: string; bg: string; label: string }> = {
  high:   { dot: 'bg-red-400',    text: 'text-red-400',    bg: 'bg-red-50 dark:bg-red-900',    label: 'High' },
  medium: { dot: 'bg-yellow-400', text: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900', label: 'Medium' },
  low:    { dot: 'bg-green-400 dark:bg-green-900',  text: 'text-green-500',  bg: 'bg-green-50',  label: 'Low' },
};

const statusConfig: Record<Status, { text: string; bg: string; label: string }> = {
  'todo':        { text: 'text-gray-500',   bg: 'bg-gray-100 dark:bg-gray-800',   label: 'To Do' },
  'in-progress': { text: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900',  label: 'In Progress' },
  'done':        { text: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900',   label: 'Done' },
};

const Avatar = ({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' }) => (
  <View
    className={`bg-sky-100 dark:bg-sky-900 rounded-full items-center justify-center ${
      size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
    }`}
  >
    <Text
      className={`text-primary font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      {initials}
    </Text>
  </View>
);

const SectionLabel = ({ label }: { label: string }) => (
  <Text className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">
    {label}
  </Text>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-center justify-between py-3 border-b border-border">
    <View className="flex-row items-center gap-2">
      <Text className="text-sm text-gray-500">{label}</Text>
    </View>
    <Text className="text-sm font-medium text-gray-800 dark:text-white">{value}</Text>
  </View>
);

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  
  // Handle Firestore Timestamp
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!id || typeof id !== 'string') {
        setError('Invalid task ID');
        setLoading(false);
        return;
      }

      try {
        const taskDoc = await getDoc(doc(db, 'tasks', id));
        
        if (taskDoc.exists()) {
          setTask({
            id: taskDoc.id,
            ...taskDoc.data(),
          } as Task);
        } else {
          setError('Task not found');
        }
      } catch (err) {
        console.error('Error fetching task:', err);
        setError('Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#3b82f6' : '#2563eb'} />
        <Text className="text-gray-500 mt-4">Loading task...</Text>
      </View>
    );
  }

  if (error || !task) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-5">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-xl font-bold text-gray-900 dark:text-white mt-4">
          {error || 'Task not found'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const doneCount = task.checklist.filter((c) => c.completed).length;
  const totalCount = task.checklist.length;

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card px-5 pt-14 pb-4 border-b border-border">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-background items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color={colorScheme === 'dark' ? 'white' : '#1b1b1b'} className="mr-1" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-gray-800 dark:text-white flex-1">Task Details</Text>
        </View>

        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3">{task.name}</Text>
        <View className="flex-row gap-2 flex-wrap">
          <View className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${priority.bg}`}>
            <View className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            <Text className={`text-xs font-semibold ${priority.text}`}>{priority.label} Priority</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${status.bg}`}>
            <Text className={`text-xs font-semibold ${status.text}`}>{status.label}</Text>
          </View>
          <View className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-900">
            <Text className="text-xs font-semibold text-primary">{task.category}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <View className="px-5 mt-5 gap-6">

          <View className="bg-background rounded-2xl p-4 border border-border">
            <SectionLabel label="Description" />
            <Text className="text-sm text-gray-600 dark:text-gray-300 leading-6">{task.description}</Text>
          </View>

          <View className="bg-card rounded-2xl px-4 border border-border py-4">
            <SectionLabel label="Details" />
            <InfoRow label="Due Date" value={task.dueDate} />
            <InfoRow label="Created" value={formatDate(task.createdAt)} />
            <InfoRow label="Category" value={task.category} />
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-gray-500">Assigned To</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Avatar initials={getInitials(task.assignee)} size="sm" />
                <View>
                  <Text className="text-sm font-medium text-gray-800 dark:text-white">{task.assignee}</Text>
                </View>
              </View>
            </View>
          </View>

          {task.checklist.length > 0 && (
            <View className="bg-card rounded-2xl p-4 border border-border">
              <View className="flex-row justify-between items-center mb-3">
                <SectionLabel label="Checklist" />
                <Text className="text-xs text-gray-400 -mt-3">{doneCount}/{totalCount}</Text>
              </View>

              <View className="bg-border rounded-full h-1 mb-4">
                <View
                  className="bg-primary rounded-full h-1"
                  style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                />
              </View>

              <View className="gap-3">
                {task.checklist.map((item) => (
                  <View key={item.id} className="flex-row items-center gap-3">
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center shrink-0 ${
                        item.completed ? 'bg-green-400 border-green-400' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {item.completed && <Text className="text-white text-xs font-bold">✓</Text>}
                    </View>
                    <Text
                      className={`text-sm flex-1 ${
                        item.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}