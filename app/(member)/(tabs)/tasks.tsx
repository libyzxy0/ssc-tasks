import { Text } from '@/components/ui/text';
import { ScrollView, View, TouchableOpacity, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { db, auth } from '@/FirebaseConfig';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';

type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in-progress' | 'done';

type Task = {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string;
  assignee: string;
  assigneeUid: string;
  category: string;
  progress?: number;
};

const FILTERS = ['All', 'To Do', 'In Progress', 'Done'] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_MAP: Record<Filter, Status | null> = {
  All: null,
  'To Do': 'todo',
  'In Progress': 'in-progress',
  Done: 'done',
};

const priorityDot: Record<Priority, string> = {
  high: 'bg-red-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
};

const priorityText: Record<Priority, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-500',
  low: 'text-green-500',
};

const categoryColors: Record<string, string> = {
  Finance: 'bg-violet-50 dark:bg-violet-900 text-violet-500',
  Administrative: 'bg-sky-50 dark:bg-sky-900 text-sky-500',
  Communications: 'bg-pink-50 dark:bg-pink-900 text-pink-500',
  Outreach: 'bg-emerald-50 dark:bg-emerald-900 text-emerald-500',
  Marketing: 'bg-blue-50 dark:bg-blue-900 text-blue-500',
  Operations: 'bg-orange-50 dark:bg-orange-900 text-orange-500',
  Events: 'bg-purple-50 dark:bg-purple-900 text-purple-500',
  Other: 'bg-gray-50 dark:bg-gray-900 text-gray-500',
};

const StatsBar = ({ tasks }: { tasks: Task[] }) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;

  return (
    <View className="flex-row gap-2 mb-5">
      {[
        { label: 'Total', value: total, bg: 'bg-gray-100 dark:bg-card', text: 'text-gray-700 dark:text-white' },
        { label: 'To Do', value: todo, bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-500' },
        { label: 'Doing', value: inProgress, bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-500' },
        { label: 'Done', value: done, bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-600' },
      ].map((s) => (
        <View key={s.label} className={`flex-1 ${s.bg} rounded-2xl py-3 items-center`}>
          <Text className={`text-lg font-bold ${s.text}`}>{s.value}</Text>
          <Text className="text-xs text-gray-400 mt-0.5">{s.label}</Text>
        </View>
      ))}
    </View>
  );
};

const TaskCard = ({
  task,
  onPress,
  onToggleDone,
}: {
  task: Task;
  onPress: () => void;
  onToggleDone: () => void;
}) => {
  const isDone = task.status === 'done';
  const catClass = categoryColors[task.category] ?? 'bg-card text-gray-500';

  return (
    <Pressable
      onPress={onPress}
      className="bg-card rounded-2xl p-4 mb-3 border border-border active:opacity-80"
    >
      <View className="flex-row items-start gap-3">
        <TouchableOpacity
          onPress={onToggleDone}
          className={`w-5 h-5 rounded-full border-2 mt-0.5 items-center justify-center shrink-0 ${
            isDone ? 'bg-green-400 border-green-400' : 'border-gray-300'
          }`}
        >
          {isDone && <Text className="text-white text-xs font-bold">✓</Text>}
        </TouchableOpacity>

        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1 flex-wrap">
            <Text
              className={`text-sm font-bold flex-1 ${
                isDone ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-white'
              }`}
              numberOfLines={1}
            >
              {task.name}
            </Text>
          </View>

          <Text className="text-xs text-gray-400 mb-3" numberOfLines={1}>
            {task.description}
          </Text>

          {task.status !== 'done' && task.progress !== undefined && (
            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">Progress</Text>
                <Text className="text-xs font-semibold text-gray-600">{task.progress}%</Text>
              </View>
              <View className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <View
                  className="bg-primary rounded-full h-1.5"
                  style={{ width: `${task.progress}%` }}
                />
              </View>
            </View>
          )}

          <View className="flex-row items-center gap-2 flex-wrap">
            <View className="flex-row items-center gap-1">
              <View className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
              <Text className={`text-xs font-medium capitalize ${priorityText[task.priority]}`}>
                {task.priority}
              </Text>
            </View>

            <Text className="text-gray-200">|</Text>

            <Text
              className={`text-xs font-medium ${
                task.dueDate === 'Today' && !isDone ? 'text-red-400' : 'text-gray-400'
              }`}
            >
              {task.dueDate}
            </Text>

            {task.category && (
              <>
                <Text className="text-gray-200">|</Text>
                <View className={`px-2 py-0.5 rounded-md ${catClass}`}>
                  <Text className="text-xs font-semibold">{task.category}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View
          className={`px-2 py-1 rounded-lg shrink-0 ${
            task.status === 'done'
              ? 'bg-green-50 dark:bg-green-900'
              : task.status === 'in-progress'
              ? 'bg-yellow-50 dark:bg-yellow-900'
              : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              task.status === 'done'
                ? 'text-green-500'
                : task.status === 'in-progress'
                ? 'text-yellow-500'
                : 'text-gray-400'
            }`}
          >
            {task.status === 'in-progress' ? 'Doing' : task.status === 'done' ? 'Done' : 'To Do'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function TasksScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  // Fetch tasks assigned to the current user
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      Alert.alert('Error', 'You must be logged in to view tasks.');
      return;
    }

    const tasksRef = collection(db, 'tasks');
    // Query tasks where assigneeUid matches the current user's UID
    const q = query(tasksRef, where('assigneeUid', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks: Task[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Task, 'id'>),
        }));
        setTasks(fetchedTasks);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching tasks:', error);
        Alert.alert('Error', 'Failed to load your tasks.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const filtered =
    STATUS_MAP[activeFilter] === null
      ? tasks
      : tasks.filter((t) => t.status === STATUS_MAP[activeFilter]);

  const toggleDone = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus: Status = task.status === 'done' ? 'todo' : 'done';

    try {
      await updateDoc(doc(db, 'tasks', id), {
        status: newStatus,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status.');
    }
  };

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center gap-3">
        <ActivityIndicator size="large" />
        <Text className="text-sm text-gray-400">Loading your tasks...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card px-5 pt-14 pb-4 border-b border-border">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</Text>
        </View>
        <Text className="text-xs text-gray-400">
          {doneCount} of {totalCount} completed
        </Text>

        <View className="bg-border rounded-full h-1 mt-3">
          <View
            className="bg-primary rounded-full h-1"
            style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <View className="px-5 mt-5">
          <StatsBar tasks={tasks} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-5 -mx-1"
            contentContainerClassName="px-1 gap-2"
          >
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f)}
                className={`px-4 py-1 rounded-full border ${
                  activeFilter === f
                    ? 'bg-primary border-primary'
                    : 'bg-card border-border'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeFilter === f ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {f}
                  {f !== 'All' && STATUS_MAP[f] && (
                    <Text className="text-xs">
                      {' '}
                      {tasks.filter((t) => t.status === STATUS_MAP[f]).length}
                    </Text>
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filtered.length === 0 ? (
            <View className="items-center py-16 gap-2">
              <Text className="text-4xl">
                {activeFilter === 'Done' ? '🎉' : '📋'}
              </Text>
              <Text className="text-base font-bold text-gray-700 dark:text-gray-300">
                {activeFilter === 'All' ? 'No tasks assigned' : 'All clear!'}
              </Text>
              <Text className="text-sm text-gray-400">
                {activeFilter === 'All'
                  ? 'You have no tasks assigned to you yet.'
                  : `No tasks in this category.`}
              </Text>
            </View>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => router.push(`/tasks/${task.id}`)}
                onToggleDone={() => toggleDone(task.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}