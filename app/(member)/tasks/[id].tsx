import { Text } from '@/components/ui/text';
import { ScrollView, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { db } from '@/FirebaseConfig';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';

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
  assigneeUid: string;
  category: string;
  checklist: ChecklistItem[];
  progress?: number;
};

type UserDetails = {
  name: string;
  initials: string;
  role: string;
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

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  
  const [task, setTask] = useState<Task | null>(null);
  const [assigneeDetails, setAssigneeDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch task details from Firestore
  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Invalid task ID');
      router.back();
      return;
    }

    const taskRef = doc(db, 'tasks', id as string);
    const unsubscribe = onSnapshot(
      taskRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const taskData = {
            id: docSnap.id,
            ...docSnap.data(),
          } as Task;
          
          setTask(taskData);

          // Fetch assignee details
          if (taskData.assigneeUid) {
            try {
              const userRef = doc(db, 'users', taskData.assigneeUid);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                const userData = userSnap.data();
                const firstName = userData.firstname || '';
                const lastName = userData.lastname || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Unknown User';
                const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
                
                setAssigneeDetails({
                  name: fullName,
                  initials: initials,
                  role: userData.role === 'admin' ? 'Admin' : 'Member',
                });
              }
            } catch (error) {
              console.error('Error fetching assignee details:', error);
            }
          }
          
          setLoading(false);
        } else {
          Alert.alert('Error', 'Task not found');
          router.back();
        }
      },
      (error) => {
        console.error('Error fetching task:', error);
        Alert.alert('Error', 'Failed to load task details');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const toggleChecklistItem = async (itemId: string) => {
    if (!task) return;

    const updatedChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const completedCount = updatedChecklist.filter((item) => item.completed).length;
    const newProgress = updatedChecklist.length > 0 
      ? Math.round((completedCount / updatedChecklist.length) * 100) 
      : 0;

    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        checklist: updatedChecklist,
        progress: newProgress,
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
      Alert.alert('Error', 'Failed to update checklist item');
    }
  };

  // Mark task as complete
  const markAsComplete = async () => {
    if (!task) return;

    const newStatus: Status = task.status === 'done' ? 'todo' : 'done';
    setIsUpdating(true);

    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: newStatus,
        progress: newStatus === 'done' ? 100 : task.progress,
      });
      
      Alert.alert(
        'Success',
        newStatus === 'done' ? 'Task marked as complete!' : 'Task reopened',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    return timestamp;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center gap-3">
        <ActivityIndicator size="large" />
        <Text className="text-sm text-gray-400">Loading task details...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 bg-background items-center justify-center gap-3">
        <Text className="text-4xl">📋</Text>
        <Text className="text-base font-bold text-gray-700 dark:text-gray-300">Task not found</Text>
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
            <InfoRow label="Due Date" value={task.dueDate || 'Not set'} />
            <InfoRow label="Created" value={formatDate(task.createdAt)} />
            <InfoRow label="Category" value={task.category} />
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-gray-500">Assigned To</Text>
              </View>
              <View className="flex-row items-center gap-2">
                {assigneeDetails ? (
                  <>
                    <Avatar initials={assigneeDetails.initials} size="sm" />
                    <View>
                      <Text className="text-sm font-medium text-gray-800 dark:text-white">
                        {assigneeDetails.name}
                      </Text>
                      <Text className="text-xs text-gray-400 dark:text-gray-600">
                        {assigneeDetails.role}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text className="text-sm text-gray-400">Loading...</Text>
                )}
              </View>
            </View>
          </View>

          {task.checklist && task.checklist.length > 0 && (
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
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleChecklistItem(item.id)}
                    className="flex-row items-center gap-3"
                    activeOpacity={0.7}
                  >
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
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {task.progress !== undefined && task.status !== 'done' && (
            <View className="bg-card rounded-2xl p-4 border border-border">
              <SectionLabel label="Overall Progress" />
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600 dark:text-gray-300">
                  Task Completion
                </Text>
                <Text className="text-sm font-bold text-primary">{task.progress}%</Text>
              </View>
              <View className="bg-border rounded-full h-2">
                <View
                  className="bg-primary rounded-full h-2"
                  style={{ width: `${task.progress}%` }}
                />
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      <View className="bg-card px-5 py-4 border-t border-border">
        <TouchableOpacity 
          className={`rounded-2xl py-4 items-center ${
            task.status === 'done' ? 'bg-gray-400' : 'bg-primary'
          }`}
          activeOpacity={0.7}
          onPress={markAsComplete}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-sm">
              {task.status === 'done' ? 'Reopen Task' : 'Mark as Complete'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}