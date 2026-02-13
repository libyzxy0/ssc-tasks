import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Plus, X, AlertCircle, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { db } from '@/FirebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth'
import { NotificationTemplates, sendNotification } from '@/utils/notifications'
import DateTimePicker from '@react-native-community/datetimepicker';

type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in-progress' | 'done';

type TaskFormData = {
  name: string;
  description: string;
  priority: Priority;
  category: string;
  assignee: string;
  assigneeUid: string;
  dueDate: string;
  status: Status;
  checklist: ChecklistItem[];
};

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type TeamMember = {
  id: string;
  uid: string;
  name: string;
};

const CATEGORIES = [
  'Finance',
  'Administrative',
  'Communications',
  'Outreach',
  'Marketing',
  'Operations',
  'Events',
  'Other',
];

const FormField = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <View className="mb-5">
    <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </Text>
    {children}
    {error && (
      <View className="flex-row items-center gap-1.5 mt-2">
        <AlertCircle size={14} className="text-red-500" />
        <Text className="text-xs text-red-500">{error}</Text>
      </View>
    )}
  </View>
);

export default function CreateTaskScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#cccccc' : '#0c0c0c';
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    priority: 'medium',
    category: 'Administrative',
    assignee: '',
    assigneeUid: '',
    dueDate: '',
    status: 'todo',
    checklist: [],
  });

  const [checklistInput, setChecklistInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'member'));
        const querySnapshot = await getDocs(q);
        
        const members: TeamMember[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.data().uid || doc.id,
          name: doc.data().firstname + " " + doc.data().lastname || 'Unknown Member',
        }));

        members.sort((a, b) => a.name.localeCompare(b.name));
        setTeamMembers(members);
        
        if (members.length > 0 && !formData.assignee) {
          setFormData(prev => ({ 
            ...prev, 
            assignee: members[0].name,
            assigneeUid: members[0].uid 
          }));
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        Alert.alert('Error', 'Failed to load team members');
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = 'Task name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.assignee) newErrors.assignee = 'Please select a team member';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTask = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const newTask = await addDoc(collection(db, 'tasks'), {
        name: formData.name.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category: formData.category,
        assignee: formData.assignee,
        assigneeUid: formData.assigneeUid,
        dueDate: formData.dueDate,
        status: formData.status,
        checklist: formData.checklist,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const notifDetails = NotificationTemplates.taskAssigned(formData.name.trim(), user.firstname + " " + user.lastname);
      
      sendNotification(
        formData.assigneeUid,
        notifDetails.title,
        notifDetails.message,
        'task',
        newTask.id
      );

      router.back();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (field: keyof TaskFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAssigneeChange = (memberName: string) => {
    const selectedMember = teamMembers.find(m => m.name === memberName);
    if (selectedMember) {
      setFormData((prev) => ({
        ...prev,
        assignee: selectedMember.name,
        assigneeUid: selectedMember.uid,
      }));

      if (errors.assignee) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.assignee;
          return next;
        });
      }
    }
  };

  const addChecklistItem = () => {
    if (checklistInput.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: checklistInput,
        completed: false,
      };
      updateForm('checklist', [...formData.checklist, newItem]);
      setChecklistInput('');
    }
  };

  const removeChecklistItem = (id: string) => {
    updateForm('checklist', formData.checklist.filter((item) => item.id !== id));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-card px-5 pt-14 pb-6 border-b border-border">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Task
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color={iconColor} />
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-400">
            Add a new task to your team members
          </Text>
        </View>

        <View className="px-5 pt-6 pb-10">
          <FormField label="Task Name *" error={errors.name}>
            <Input
              placeholder="e.g., Submit Q3 Financial Report"
              value={formData.name}
              onChangeText={(value) => updateForm('name', value)}
            />
          </FormField>

          <FormField label="Description *" error={errors.description}>
            <Textarea
              placeholder="Describe what needs to be done..."
              value={formData.description}
              onChangeText={(value) => updateForm('description', value)}
              numberOfLines={4}
            />
          </FormField>

          <FormField label="Priority">
            <Select
              defaultValue={{ value: formData.priority, label: 'Medium' }}
              onValueChange={(option) =>
                option && updateForm('priority', option.value as Priority)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent insets={contentInsets}>
                <SelectGroup>
                  <SelectLabel>Priority</SelectLabel>
                  <SelectItem label="High" value="high">High</SelectItem>
                  <SelectItem label="Medium" value="medium">Medium</SelectItem>
                  <SelectItem label="Low" value="low">Low</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Category">
            <Select
              defaultValue={{ value: formData.category, label: formData.category }}
              onValueChange={(option) =>
                option && updateForm('category', option.value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent insets={contentInsets}>
                <SelectGroup>
                  <SelectLabel>Category</SelectLabel>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} label={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Assign To *" error={errors.assignee}>
            {loadingMembers ? (
              <View className="flex-row items-center justify-center bg-card border border-border rounded-lg px-4 py-3">
                <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#3b82f6' : '#2563eb'} />
                <Text className="text-gray-500 ml-2">Loading members...</Text>
              </View>
            ) : teamMembers.length === 0 ? (
              <View className="bg-card border border-border rounded-lg px-4 py-3">
                <Text className="text-gray-500 text-sm">No team members found</Text>
              </View>
            ) : (
              <Select
                defaultValue={
                  formData.assignee
                    ? { value: formData.assignee, label: formData.assignee }
                    : undefined
                }
                onValueChange={(option) =>
                  option && handleAssigneeChange(option.value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent insets={contentInsets}>
                  <SelectGroup>
                    <SelectLabel>Team Members</SelectLabel>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} label={member.name} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormField label="Due Date">
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center justify-between bg-card border border-border rounded-lg px-4 py-2.5 active:opacity-70"
            >
              <View className="flex-row items-center gap-2">
                <Calendar size={18} color={iconColor} />
                <Text className="text-gray-900 dark:text-white font-medium">
                  {formData.dueDate || 'Select due date'}
                </Text>
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setSelectedDate(date);
                    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    updateForm('dueDate', formatted);
                  }
                }}
              />
            )}
          </FormField>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Checklist Items
            </Text>
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Input
                  placeholder="Add a checklist item..."
                  value={checklistInput}
                  onChangeText={setChecklistInput}
                />
              </View>
              <TouchableOpacity
                onPress={addChecklistItem}
                disabled={!checklistInput.trim()}
                className={`py-2 px-3 rounded-lg items-center justify-center ${
                  checklistInput.trim() ? 'bg-primary' : 'bg-border'
                }`}
              >
                <Plus size={20} color={iconColor} />
              </TouchableOpacity>
            </View>

            {formData.checklist.length > 0 && (
              <View className="bg-card border border-border rounded-lg p-3">
                {formData.checklist.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row items-center gap-2 pl-2 pr-1 border-b py-2 border-border last:border-b-0"
                  >
                    <Text className="flex-1 text-gray-900 dark:text-white">
                      {item.text}
                    </Text>
                    <TouchableOpacity onPress={() => removeChecklistItem(item.id)} className="p-1">
                      <X size={18} color={iconColor} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {formData.checklist.length === 0 && (
              <Text className="text-xs text-gray-400">
                No checklist items yet. Add one to get started!
              </Text>
            )}
          </View>

          <View className="flex-row gap-3 mt-8">
            <View className="flex-1">
              <Button onPress={() => router.back()} variant="outline" disabled={isSubmitting}>
                <Text>Cancel</Text>
              </Button>
            </View>
            <View className="flex-1">
              <Button onPress={handleCreateTask} disabled={isSubmitting || loadingMembers}>
                <Text>{isSubmitting ? 'Creating...' : 'Create Task'}</Text>
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}