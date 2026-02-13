import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollView, View, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';
import { useAuth } from '@/hooks/useAuth';

type Tag = 'Official' | 'Update' | 'Community' | 'Urgent' | 'Event';

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: any;
  tag: Tag;
  author: string;
  authorId: string;
  initials: string;
  role: string;
  pinned?: boolean;
  views: number;
  readBy: string[];
};
const tagConfig: Record<Tag, { bg: string; text: string; dot: string }> = {
  Urgent:    { bg: 'bg-red-50 dark:bg-red-900',     text: 'text-red-500',     dot: 'bg-red-400' },
  Official:  { bg: 'bg-primary/10 dark:bg-sky-900',  text: 'text-primary',  dot: 'bg-primary/90' },
  Update:    { bg: 'bg-primary/10 dark:bg-sky-900',  text: 'text-primary',  dot: 'bg-primary/90' },
  Community: { bg: 'bg-emerald-50 dark:bg-emerald-900', text: 'text-emerald-500', dot: 'bg-emerald-400' },
  Event:     { bg: 'bg-violet-50 dark:bg-violet-900',  text: 'text-violet-500',  dot: 'bg-violet-400' },
};


const Avatar = ({
  initials,
  size = 'md',
}: {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizeClass =
    size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const textClass =
    size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <View className={`${sizeClass} rounded-full bg-indigo-100 items-center justify-center shrink-0`}>
      <Text className={`${textClass} font-bold text-indigo-500`}>{initials}</Text>
    </View>
  );
};

const TagBadge = ({ tag }: { tag: Tag }) => {
  const c = tagConfig[tag];
  return (
    <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${c.bg}`}>
      <View className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Text className={`text-xs font-semibold ${c.text}`}>{tag}</Text>
    </View>
  );
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatTime = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export default function AdminAnnouncementDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editTag, setEditTag] = useState<Tag>('Official');

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        const docRef = doc(db, 'announcements', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Announcement;
          setAnnouncement(data);
          setEditTitle(data.title);
          setEditBody(data.body);
          setEditTag(data.tag);
        }
      } catch (error) {
        console.error('Error fetching announcement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  const handleTogglePin = async () => {
    if (!announcement) return;
    
    try {
      await updateDoc(doc(db, 'announcements', announcement.id), {
        pinned: !announcement.pinned
      });
      setAnnouncement({ ...announcement, pinned: !announcement.pinned });
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!announcement || !editTitle.trim() || !editBody.trim()) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'announcements', announcement.id), {
        title: editTitle,
        body: editBody,
        tag: editTag,
      });
      setAnnouncement({ ...announcement, title: editTitle, body: editBody, tag: editTag });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating announcement:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!announcement) return;
    
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteDoc(doc(db, 'announcements', announcement.id));
              router.back();
            } catch (error) {
              console.error('Error deleting announcement:', error);
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!announcement) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-500">Announcement not found</Text>
      </View>
    );
  }

  const readRate = announcement.views > 0 
    ? Math.round((announcement.readBy?.length || 0) / announcement.views * 100) 
    : 0;

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card px-5 pt-14">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-background items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color={colorScheme === 'dark' ? 'white' : '#1b1b1b'} />
          </TouchableOpacity>

          <Text className="text-base font-bold text-gray-800 dark:text-white flex-1">Announcement</Text>
          
          <TouchableOpacity
            onPress={() => setShowEditModal(true)}
            className="w-9 h-9 rounded-full bg-background items-center justify-center"
          >
            <Ionicons name="pencil" size={18} color={colorScheme === 'dark' ? 'white' : '#1b1b1b'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <View className="bg-card px-5 py-5 border-b border-border">
          <View className="flex-row items-center gap-3 mb-4">
            <Avatar initials={announcement.initials} size="lg" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900 dark:text-white">{announcement.author}</Text>
              <Text className="text-xs text-gray-400">{announcement.role}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                {formatDate(announcement.createdAt)} · {formatTime(announcement.createdAt)}
              </Text>
            </View>
            <TagBadge tag={announcement.tag} />
          </View>

          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">{announcement.title}</Text>

          <View className="flex-row gap-2">
            {announcement.pinned && (
              <View className="flex-row items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
                <Text className="text-xs">📌</Text>
                <Text className="text-xs font-semibold text-gray-500">Pinned</Text>
              </View>
            )}
            <View className="flex-row items-center gap-1 bg-background px-2.5 py-1 rounded-full">
              <Text className="text-xs">👁️</Text>
              <Text className="text-xs font-semibold text-gray-500">{announcement.views} views</Text>
            </View>
            <View className="flex-row items-center gap-1 bg-background px-2.5 py-1 rounded-full">
              <Text className="text-xs">✓</Text>
              <Text className="text-xs font-semibold text-gray-500">
                {announcement.readBy?.length || 0} read ({readRate}%)
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5 mt-4 gap-3">
          <View className="bg-card rounded-2xl p-5 border border-border">
            <Text className="text-sm text-gray-600 dark:text-white leading-7">{announcement.body}</Text>
          </View>

          {/* Admin Actions */}
          <View className="flex-row gap-3">
            <Button
              onPress={handleTogglePin}
              variant="outline"
              className="flex-1"
            >
              <Text className="text-sm font-bold">
                {announcement.pinned ? '📌 Unpin' : '📌 Pin'}
              </Text>
            </Button>
            <Button
              onPress={handleDelete}
              variant="outline"
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text className="text-sm font-bold text-red-500">🗑️ Delete</Text>
              )}
            </Button>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-card rounded-t-3xl p-5 pt-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">Edit Announcement</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} disabled={saving}>
                <Text className="text-gray-400 text-2xl">×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Title</Text>
              <Input
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Announcement title..."
                editable={!saving}
              />

              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-4">Message</Text>
              <Textarea
                value={editBody}
                onChangeText={setEditBody}
                placeholder="Write your announcement..."
                numberOfLines={6}
                editable={!saving}
              />

              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-4">Tag</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {(['Official', 'Urgent', 'Community', 'Event', 'Update'] as Tag[]).map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setEditTag(tag)}
                    disabled={saving}
                    className={`px-4 py-2 rounded-full border ${
                      editTag === tag
                        ? 'bg-primary border-primary'
                        : 'bg-card border-border'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        editTag === tag ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row gap-3 mt-2">
              <Button
                onPress={() => setShowEditModal(false)}
                variant="outline"
                disabled={saving}
                className="flex-1"
              >
                <Text className="text-sm font-bold text-gray-500">Cancel</Text>
              </Button>
              <Button
                onPress={handleSaveEdit}
                disabled={saving || !editTitle.trim() || !editBody.trim()}
                className="flex-1"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-bold text-white">Save Changes</Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}