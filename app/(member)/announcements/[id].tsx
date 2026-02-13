import { Text } from '@/components/ui/text';
import { ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
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

export default function AnnouncementDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        const docRef = doc(db, 'announcements', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Announcement;
          setAnnouncement(data);
          
          // Mark as read if not already
          if (user?.uid && !data.readBy?.includes(user.uid)) {
            await updateDoc(docRef, {
              readBy: arrayUnion(user.uid),
              views: increment(1)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching announcement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id, user?.uid]);

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

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card px-5 pt-14">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-background items-center justify-center"
          >
            <Ionicons name="chevron-back" size={20} color={colorScheme === 'dark' ? 'white' : '#1b1b1b'} className="mr-1" />
          </TouchableOpacity>

          <Text className="text-base font-bold text-gray-800 dark:text-white flex-1">Announcement</Text>
          {announcement.pinned && (
            <View className="flex-row items-center gap-1 bg-sky-400/10 border-sky-400 px-3 py-1.5 rounded-full">
              <Text className="text-xs">📌</Text>
              <Text className="text-xs font-semibold text-gray-500">Pinned</Text>
            </View>
          )}
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

          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">{announcement.title}</Text>
        </View>

        <View className="px-5 mt-4 gap-5">
          <View className="bg-card rounded-2xl p-5 border border-border">
            <Text className="text-sm text-gray-600 dark:text-white leading-7">{announcement.body}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}