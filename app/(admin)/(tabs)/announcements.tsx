import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollView, View, TouchableOpacity, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NotificationTemplates, sendNotification } from '@/utils/notifications'

import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  getDocs,
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '@/FirebaseConfig';
import { useAuth } from '@/hooks/useAuth';

type Tag = 'Official' | 'Update' | 'Community' | 'Urgent' | 'Event';

type TeamMember = {
  id: string;
  uid: string;
  name: string;
};

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

const FILTERS = ['All', 'Pinned', 'Official', 'Urgent', 'Community', 'Event', 'Update'] as const;
type Filter = (typeof FILTERS)[number];

const tagConfig: Record<Tag, { bg: string; text: string; dot: string }> = {
  Urgent:    { bg: 'bg-red-50 dark:bg-red-900',     text: 'text-red-500',     dot: 'bg-red-400' },
  Official:  { bg: 'bg-primary/10 dark:bg-sky-900',  text: 'text-primary',  dot: 'bg-primary/90' },
  Update:    { bg: 'bg-primary/10 dark:bg-sky-900',  text: 'text-primary',  dot: 'bg-primary/90' },
  Community: { bg: 'bg-emerald-50 dark:bg-emerald-900', text: 'text-emerald-500', dot: 'bg-emerald-400' },
  Event:     { bg: 'bg-violet-50 dark:bg-violet-900',  text: 'text-violet-500',  dot: 'bg-violet-400' },
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Avatar = ({ initials }: { initials: string }) => (
  <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center shrink-0">
    <Text className="text-primary text-sm font-bold">{initials}</Text>
  </View>
);

const TagBadge = ({ tag }: { tag: Tag }) => {
  const c = tagConfig[tag];
  return (
    <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-md ${c.bg}`}>
      <View className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <Text className={`text-xs font-semibold ${c.text}`}>{tag}</Text>
    </View>
  );
};

const AnnouncementCard = ({
  item,
  onPress,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  item: Announcement;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const readCount = item.readBy?.length || 0;
  const readRate = item.views > 0 ? Math.round((readCount / item.views) * 100) : 0;

  return (
    <View className="mb-3">
      <Pressable
        onPress={onPress}
        className="rounded-2xl p-4 border active:opacity-75 bg-card border-border"
      >
        {item.pinned && (
          <View className="flex-row items-center gap-1 mb-2">
            <Text className="text-xs font-semibold text-gray-400">Pinned</Text>
          </View>
        )}

        <View className="flex-row items-start gap-3">
          <Avatar initials={item.initials} />

          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-0.5">
              <Text className="text-xs font-medium text-gray-500">{item.author}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-gray-400">{formatDate(item.createdAt)}</Text>
                <TouchableOpacity
                  onPress={() => setShowMenu(!showMenu)}
                  className="p-1"
                >
                  <Ionicons name="ellipsis-vertical" size={16} color="#cccccc" />
                </TouchableOpacity>
              </View>
            </View>

            <Text
              className="text-sm font-bold mb-1 text-gray-900 dark:text-white"
              numberOfLines={1}
            >
              {item.title}
            </Text>

            <Text className="text-xs text-gray-400 leading-5 mb-3" numberOfLines={2}>
              {item.body}
            </Text>

            <View className="flex-row items-center justify-between">
              <TagBadge tag={item.tag} />
              
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="eye-outline" size={16} color="#cccccc" />
                  <Text className="text-xs font-semibold text-gray-500">{item.views}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs">✓</Text>
                  <Text className="text-xs font-semibold text-gray-500">
                    {readCount} ({readRate}%)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {showMenu && (
        <View className="absolute right-4 top-16 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden">
          <TouchableOpacity
            onPress={() => {
              setShowMenu(false);
              onTogglePin();
            }}
            className="px-4 py-3 active:bg-gray-50 dark:active:bg-gray-800 border-b border-border"
          >
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {item.pinned ? 'Unpin' : 'Pin'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowMenu(false);
              onEdit();
            }}
            className="px-4 py-3 active:bg-gray-50 dark:active:bg-gray-800 border-b border-border"
          >
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-200">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowMenu(false);
              onDelete();
            }}
            className="px-4 py-3 active:bg-gray-50 dark:active:bg-gray-800"
          >
            <Text className="text-sm font-medium text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const CreateAnnouncementModal = ({
  visible,
  onClose,
  onSave,
  editItem,
  saving,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { title: string; body: string; tag: Tag }) => void;
  editItem?: Announcement | null;
  saving: boolean;
}) => {
  const [title, setTitle] = useState(editItem?.title || '');
  const [body, setBody] = useState(editItem?.body || '');
  const [selectedTag, setSelectedTag] = useState<Tag>(editItem?.tag || 'Official');

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setBody(editItem.body);
      setSelectedTag(editItem.tag);
    } else {
      setTitle('');
      setBody('');
      setSelectedTag('Official');
    }
  }, [editItem, visible]);

  const handleSave = () => {
    if (title.trim() && body.trim()) {
      onSave({ title, body, tag: selectedTag });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-card rounded-t-3xl p-5 pt-6 max-h-[90%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              {editItem ? 'Edit Announcement' : 'New Announcement'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={saving}>
              <Text className="text-gray-400 text-2xl">×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Title</Text>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="Announcement title..."
              editable={!saving}
            />

            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-4">Message</Text>
            <Textarea
              value={body}
              onChangeText={setBody}
              placeholder="Write your announcement..."
              numberOfLines={6}
              editable={!saving}
            />

            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 mt-4">Tag</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {(['Official', 'Urgent', 'Community', 'Event', 'Update'] as Tag[]).map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setSelectedTag(tag)}
                  disabled={saving}
                  className={`px-4 py-2 rounded-full border ${
                    selectedTag === tag
                      ? 'bg-primary border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selectedTag === tag ? 'text-white' : 'text-gray-500'
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
              onPress={onClose}
              variant="outline"
              disabled={saving}
              className="flex-1"
            >
              <Text className="text-sm font-bold text-gray-500">Cancel</Text>
            </Button>
            <Button
              onPress={handleSave}
              disabled={saving || !title.trim() || !body.trim()}
              className="flex-1"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-sm font-bold text-white">
                  {editItem ? 'Save Changes' : 'Publish'}
                </Text>
              )}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function AdminAnnouncementsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        const members: TeamMember[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          uid: doc.data().uid || doc.id, 
          name: doc.data().firstname + " " + doc.data().lastname || 'Unknown Member',
        }));

        members.sort((a, b) => a.name.localeCompare(b.name));

        setTeamMembers(members);
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, []);
  

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const announcementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      
      const sorted = announcementsData.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
      
      setAnnouncements(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalAnnouncements = announcements.length;
  const totalViews = announcements.reduce((sum, a) => sum + a.views, 0);
  const avgReadRate = announcements.length > 0 
    ? Math.round(
        announcements.reduce((sum, a) => {
          const rate = a.views > 0 ? (a.readBy?.length || 0) / a.views * 100 : 0;
          return sum + rate;
        }, 0) / announcements.length
      )
    : 0;

  const filtered = announcements.filter((a) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pinned') return a.pinned;
    return a.tag === activeFilter;
  });

  const handleSaveAnnouncement = async (data: { title: string; body: string; tag: Tag }) => {
    setSaving(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'announcements', editingItem.id), {
          title: data.title,
          body: data.body,
          tag: data.tag,
        });
      } else {
        const addedAnnouncement = await addDoc(collection(db, 'announcements'), {
          title: data.title,
          body: data.body,
          tag: data.tag,
          createdAt: serverTimestamp(),
          author: user?.firstname + ' ' + user?.lastname || 'Admin',
          authorId: user?.uid || '',
          initials: (user?.firstname + ' ' + user.lastname || 'A')
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          role: 'Admin',
          pinned: false,
          views: 0,
          readBy: [],
        });
        
        for(let i = 0; i < teamMembers.length;i++) {
          const notifDetails = NotificationTemplates.announcementPosted(data.title, teamMembers[i].uid === user?.uid ? 'You' : user?.firstname + ' ' + user?.lastname)
          sendNotification(
          teamMembers[i].uid,
          notifDetails.title, 
          notifDetails.message, 
          'announcement', 
          addedAnnouncement.id
        )
        }
      }
      setShowCreateModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving announcement:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: Announcement) => {
    setEditingItem(item);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const handleTogglePin = async (id: string) => {
    const announcement = announcements.find(a => a.id === id);
    if (announcement) {
      try {
        await updateDoc(doc(db, 'announcements', id), {
          pinned: !announcement.pinned,
        });
      } catch (error) {
        console.error('Error toggling pin:', error);
      }
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card px-5 pt-14 pb-4 border-b border-border">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingItem(null);
              setShowCreateModal(true);
            }}
            className="bg-primary rounded-full px-4 py-2"
          >
            <Text className="text-white text-xs font-bold">+ New</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-background rounded-xl p-3">
            <Text className="text-xs text-gray-400 mb-1">Total Posts</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">{totalAnnouncements}</Text>
          </View>
          <View className="flex-1 bg-background rounded-xl p-3">
            <Text className="text-xs text-gray-400 mb-1">Total Views</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">{totalViews}</Text>
          </View>
          <View className="flex-1 bg-background rounded-xl p-3">
            <Text className="text-xs text-gray-400 mb-1">Avg. Read</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">{avgReadRate}%</Text>
          </View>
        </View>
      </View>

      <View className="bg-card border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5 py-3 gap-2"
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full border ${
                activeFilter === f
                  ? 'bg-primary border-primary'
                  : 'bg-card border-border'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === f ? 'text-white' : 'text-gray-500'
                }`}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-4 pb-10"
      >
        {filtered.length === 0 ? (
          <View className="items-center py-20 gap-2">
            <Text className="text-4xl">📭</Text>
            <Text className="text-base font-bold text-gray-700 dark:text-gray-200">Nothing here</Text>
            <Text className="text-sm text-gray-400">No announcements in this category.</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              onPress={() => router.push(`/announcements/${item.id}`)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
              onTogglePin={() => handleTogglePin(item.id)}
            />
          ))
        )}
      </ScrollView>

      <CreateAnnouncementModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingItem(null);
        }}
        onSave={handleSaveAnnouncement}
        editItem={editingItem}
        saving={saving}
      />
    </View>
  );
}