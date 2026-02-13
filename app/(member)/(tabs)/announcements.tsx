import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ScrollView, View, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  arrayUnion,
  increment 
} from 'firebase/firestore';
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

const FILTERS = ['All', 'Unread', 'Pinned', 'Official', 'Urgent', 'Community', 'Event', 'Update'] as const;
type Filter = (typeof FILTERS)[number];

const tagConfig: Record<Tag, { bg: string; text: string; dot: string }> = {
  Urgent:    { bg: 'bg-red-50 dark:bg-red-900',     text: 'text-red-500',     dot: 'bg-red-400' },
  Official:  { bg: 'bg-primary/10 dark:bg-sky-900',  text: 'text-primary',  dot: 'bg-primary/90' },
  Update:    { bg: 'bg-primary/10 dark:bg-sky-900',  text: 'text-primary',  dot: 'bg-primary/90' },
  Community: { bg: 'bg-emerald-50 dark:bg-emerald-900', text: 'text-emerald-500', dot: 'bg-emerald-400' },
  Event:     { bg: 'bg-violet-50 dark:bg-violet-900',  text: 'text-violet-500',  dot: 'bg-violet-400' },
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

const AnnouncementCard = ({
  item,
  onPress,
  currentUserId,
}: {
  item: Announcement;
  onPress: () => void;
  currentUserId: string;
}) => {
  const isRead = item.readBy?.includes(currentUserId);
  
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl p-4 mb-3 border active:opacity-75 bg-card border-border"
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
            <Text className="text-xs text-gray-400">{formatDate(item.createdAt)}</Text>
          </View>

          <Text
            className={`text-sm font-bold mb-1 ${isRead ? 'text-gray-700 dark:text-gray-200' : 'text-gray-900 dark:text-white'}`}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <Text className="text-xs text-gray-400 leading-5 mb-3" numberOfLines={2}>
            {item.body}
          </Text>

          <View className="flex-row items-center gap-2">
            <TagBadge tag={item.tag} />
            {!isRead && (
              <View className="w-2 h-2 rounded-full bg-primary" />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = user?.uid || '';

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

  const unreadCount = announcements.filter(
    (a) => !a.readBy?.includes(currentUserId)
  ).length;

  const filtered = announcements.filter((a) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !a.readBy?.includes(currentUserId);
    if (activeFilter === 'Pinned') return a.pinned;
    return a.tag === activeFilter;
  });

  const markAllRead = async () => {
    const batch = announcements
      .filter(a => !a.readBy?.includes(currentUserId))
      .map(a => 
        updateDoc(doc(db, 'announcements', a.id), {
          readBy: arrayUnion(currentUserId)
        })
      );
    
    await Promise.all(batch);
  };

  const handlePress = async (id: string) => {
    const announcement = announcements.find(a => a.id === id);
    if (announcement && !announcement.readBy?.includes(currentUserId)) {
      await updateDoc(doc(db, 'announcements', id), {
        readBy: arrayUnion(currentUserId),
        views: increment(1)
      });
    }
    router.push(`/announcements/${id}`);
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
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</Text>
            {unreadCount > 0 && (
              <View className="bg-primary rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text className="text-xs font-semibold text-primary">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text className="text-xs text-gray-400">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up ✓'}
        </Text>
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
              onPress={() => handlePress(item.id)}
              currentUserId={currentUserId}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}