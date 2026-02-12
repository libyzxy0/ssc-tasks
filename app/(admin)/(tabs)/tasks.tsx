import { Text } from '@/components/ui/text';
import { ScrollView, View, FlatList, TouchableOpacity, Pressable, Modal, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Plus, Trash2, Users, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { db } from '@/FirebaseConfig';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy, where, getDocs } from 'firebase/firestore';

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
  assigneeUid: string; // Added UID field
  category: string;
  progress: number;
};

type TeamMember = {
  id: string;
  uid: string; // Added UID field
  name: string;
};

const FILTERS = ['All', 'To Do', 'In Progress', 'Done'] as const;
const SORT_OPTIONS = ['Due Date', 'Priority', 'Assignee'] as const;

type Filter = (typeof FILTERS)[number];
type SortOption = (typeof SORT_OPTIONS)[number];

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

const AdminStatsBar = ({ tasks }: { tasks: Task[] }) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;

  return (
    <View className="flex-row gap-2 mb-5">
      {[
        { label: 'Total', value: total, bg: 'bg-gray-100 dark:bg-card', text: 'text-gray-700 dark:text-white' },
        { label: 'To Do', value: tasks.filter((t) => t.status === 'todo').length, bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-500' },
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

const AdminTaskCard = ({
  task,
  isSelected,
  onPress,
  onSelect,
  onAssignPress,
}: {
  task: Task;
  isSelected: boolean;
  onPress: () => void;
  onSelect: () => void;
  onAssignPress: () => void;
}) => {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#a3a3a3' : '#666666';
  const isDone = task.status === 'done';
  const catClass = categoryColors[task.category] ?? 'bg-card text-gray-500';

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl p-4 mb-3 border ${
        isSelected ? 'bg-primary/10 border-primary/20' : 'bg-card border-border'
      } active:opacity-80`}
    >
      <View className="flex-row items-start gap-3">
        <TouchableOpacity
          onPress={onSelect}
          className={`w-5 h-5 rounded-lg border-2 mt-0.5 items-center justify-center shrink-0 ${
            isSelected ? 'bg-primary border-primary' : 'border-gray-300'
          }`}
        >
          {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
        </TouchableOpacity>

        <View className="flex-1">
          <Text
            className={`text-sm font-bold mb-1 ${
              isDone ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-white'
            }`}
            numberOfLines={1}
          >
            {task.name}
          </Text>

          <Text className="text-xs text-gray-400 mb-3" numberOfLines={1}>
            {task.description}
          </Text>

          {task.status !== 'done' && (
            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">Progress</Text>
                <Text className="text-xs font-semibold text-gray-600">{task.progress ?? 0}%</Text>
              </View>
              <View className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <View
                  className="bg-primary rounded-full h-1.5"
                  style={{ width: `${task.progress ?? 0}%` }}
                />
              </View>
            </View>
          )}

          <View className="flex-row items-center gap-2 flex-wrap mb-3">
            <View className="flex-row items-center gap-1">
              <View className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
              <Text className={`text-xs font-medium capitalize ${priorityText[task.priority]}`}>
                {task.priority}
              </Text>
            </View>

            <Text className="text-gray-200">|</Text>

            <Text className="text-xs font-medium text-gray-400">
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

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {task.assignee?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <Text className="text-xs text-gray-600 dark:text-gray-400">{task.assignee}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              <View
                className={`px-2 py-1 rounded-lg ${
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

              <TouchableOpacity
                onPress={onAssignPress}
                className="p-1.5 rounded-lg"
              >
                <Users size={16} color={iconColor} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const AssigneeModal = ({
  visible,
  onClose,
  onSelect,
  currentAssignee,
  teamMembers,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (member: TeamMember) => void;
  currentAssignee: string;
  teamMembers: TeamMember[];
  loading: boolean;
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-background/50 justify-end">
        <View className="bg-card rounded-t-3xl p-5 max-h-96">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">Assign To</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-xl">✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-8 items-center gap-2">
              <ActivityIndicator size="small" />
              <Text className="text-sm text-gray-400">Loading members...</Text>
            </View>
          ) : teamMembers.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-sm text-gray-400">No team members found</Text>
            </View>
          ) : (
            <FlatList
              data={teamMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onSelect(item); onClose(); }}
                  className={`flex-row items-center gap-3 p-3 rounded-lg mb-2 ${
                    currentAssignee === item.name ? 'bg-primary/20' : 'bg-transparent'
                  }`}
                >
                  <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                    <Text className="text-white font-bold">{getInitials(item.name)}</Text>
                  </View>
                  <Text className="flex-1 font-semibold text-gray-900 dark:text-white">{item.name}</Text>
                  {currentAssignee === item.name && (
                    <Text className="text-primary text-lg">✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function AdminTasksScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#a3a3a3' : '#666666';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('Due Date');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [assigneeModalVisible, setAssigneeModalVisible] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState<Task | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // ── Fetch team members from Firebase ──────────────────────────────────────
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'member'));
        const querySnapshot = await getDocs(q);
        
        const members: TeamMember[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.data().uid || doc.id, // Use uid field or fallback to doc.id
          name: doc.data().firstname + " " + doc.data().lastname || 'Unknown Member',
        }));

        members.sort((a, b) => a.name.localeCompare(b.name));

        setTeamMembers(members);
      } catch (error) {
        console.error('Error fetching team members:', error);
        Alert.alert('Error', 'Failed to load team members');
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // ── Firestore real-time listener ──────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Task[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Task, 'id'>),
        }));
        setTasks(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore error:', error);
        Alert.alert('Error', 'Failed to load tasks.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Filtering & sorting ───────────────────────────────────────────────────
  const filtered =
    STATUS_MAP[activeFilter] === null
      ? tasks
      : tasks.filter((t) => t.status === STATUS_MAP[activeFilter]);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'Priority') {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    }
    if (sortBy === 'Assignee') return a.assignee.localeCompare(b.assignee);
    return 0;
  });

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleSelectTask = (id: string) => {
    const next = new Set(selectedTasks);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedTasks(next);
  };

  const toggleSelectAll = () => {
    setSelectedTasks(
      selectedTasks.size === filtered.length
        ? new Set()
        : new Set(filtered.map((t) => t.id))
    );
  };

  // ── Firestore mutations ───────────────────────────────────────────────────
  const deleteTasks = () => {
    if (selectedTasks.size === 0) return;
    Alert.alert(
      'Delete Tasks',
      `Delete ${selectedTasks.size} task(s)?`,
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                [...selectedTasks].map((id) => deleteDoc(doc(db, 'tasks', id)))
              );
              setSelectedTasks(new Set());
            } catch (e) {
              Alert.alert('Error', 'Failed to delete some tasks.');
            }
          },
        },
      ]
    );
  };

  // Updated to include assigneeUid when reassigning tasks in bulk
  const assignTasksTo = async (member: TeamMember) => {
    try {
      await Promise.all(
        [...selectedTasks].map((id) =>
          updateDoc(doc(db, 'tasks', id), { 
            assignee: member.name,
            assigneeUid: member.uid // Include UID
          })
        )
      );
      setSelectedTasks(new Set());
    } catch (e) {
      Alert.alert('Error', 'Failed to reassign tasks.');
    }
  };

  const handleAssignSingle = (task: Task) => {
    setSelectedTaskForAssign(task);
    setAssigneeModalVisible(true);
  };

  // Updated to include assigneeUid when reassigning a single task
  const handleAssignSingleSelect = async (member: TeamMember) => {
    if (!selectedTaskForAssign) return;
    try {
      await updateDoc(doc(db, 'tasks', selectedTaskForAssign.id), {
        assignee: member.name,
        assigneeUid: member.uid, // Include UID
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to reassign task.');
    }
  };

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progressPct = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card px-5 pt-14 pb-4 border-b border-border">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</Text>
          <TouchableOpacity
            onPress={() => router.push('/tasks/new')}
            className="p-2 bg-primary rounded-lg"
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-gray-400 mb-3">Manage team tasks and assignments</Text>
        <View className="bg-border rounded-full h-1 mt-3">
          <View
            className="bg-primary rounded-full h-1"
            style={{ width: `${progressPct}%` }}
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" />
          <Text className="text-sm text-gray-400">Loading tasks...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
          <View className="px-5 mt-5">
            <AdminStatsBar tasks={tasks} />

            {/* Filter + Sort */}
            <View className="flex-row gap-2 mb-5">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
                className="flex-1"
              >
                {FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setActiveFilter(f)}
                    className={`px-4 py-2 rounded-full border ${
                      activeFilter === f ? 'bg-primary border-primary' : 'bg-card border-border'
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
                          {' '}{tasks.filter((t) => t.status === STATUS_MAP[f]).length}
                        </Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View className="relative">
                <TouchableOpacity
                  onPress={() => setShowSortMenu(!showSortMenu)}
                  className="px-4 py-2 rounded-full border border-border bg-card flex-row items-center gap-1"
                >
                  <Settings size={16} color={iconColor} />
                  <Text className="text-sm font-semibold text-gray-500">Sort</Text>
                </TouchableOpacity>

                {showSortMenu && (
                  <View className="absolute top-12 right-0 bg-card border border-border rounded-lg z-10 w-40 shadow-lg">
                    {SORT_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => { setSortBy(option); setShowSortMenu(false); }}
                        className={`px-4 py-3 border-b border-border last:border-b-0 ${
                          sortBy === option ? 'bg-primary/10' : ''
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            sortBy === option ? 'font-bold text-primary' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Bulk action bar */}
            {selectedTasks.size > 0 && (
              <View className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity onPress={toggleSelectAll}>
                    <View className="w-5 h-5 rounded-lg bg-primary items-center justify-center">
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  </TouchableOpacity>
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    {selectedTasks.size} selected
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => { setSelectedTaskForAssign(null); setAssigneeModalVisible(true); }}
                    className="px-3 py-1 bg-primary rounded-lg"
                  >
                    <Text className="text-white text-xs font-semibold">Reassign</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={deleteTasks} className="px-3 py-1 bg-red-500 rounded-lg">
                    <Trash2 size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Task list */}
            {sorted.length === 0 ? (
              <View className="items-center py-16 gap-2">
                <Text className="text-4xl">📋</Text>
                <Text className="text-base font-bold text-gray-700 dark:text-gray-300">No tasks</Text>
                <Text className="text-sm text-gray-400">
                  {activeFilter === 'All'
                    ? 'Create a new task to get started.'
                    : `No ${activeFilter.toLowerCase()} tasks.`}
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={toggleSelectAll}
                  className="flex-row items-center gap-2 mb-3 p-2"
                >
                  <View
                    className={`w-5 h-5 rounded-lg border-2 items-center justify-center ${
                      selectedTasks.size === filtered.length
                        ? 'bg-primary border-primary'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedTasks.size === filtered.length && (
                      <Text className="text-white text-xs font-bold">✓</Text>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 font-semibold">
                    {selectedTasks.size === filtered.length ? 'Deselect all' : 'Select all'}
                  </Text>
                </TouchableOpacity>

                {sorted.map((task) => (
                  <AdminTaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTasks.has(task.id)}
                    onPress={() => router.push(`/tasks/${task.id}`)}
                    onSelect={() => toggleSelectTask(task.id)}
                    onAssignPress={() => handleAssignSingle(task)}
                  />
                ))}
              </>
            )}
          </View>
        </ScrollView>
      )}

      {/* Assignee modals */}
      <AssigneeModal
        visible={assigneeModalVisible && selectedTaskForAssign !== null}
        onClose={() => { setAssigneeModalVisible(false); setSelectedTaskForAssign(null); }}
        onSelect={handleAssignSingleSelect}
        currentAssignee={selectedTaskForAssign?.assignee ?? ''}
        teamMembers={teamMembers}
        loading={loadingMembers}
      />
      <AssigneeModal
        visible={assigneeModalVisible && selectedTaskForAssign === null && selectedTasks.size > 0}
        onClose={() => setAssigneeModalVisible(false)}
        onSelect={assignTasksTo}
        currentAssignee=""
        teamMembers={teamMembers}
        loading={loadingMembers}
      />
    </View>
  );
}