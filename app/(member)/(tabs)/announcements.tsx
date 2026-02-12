import { Text } from '@/components/ui/text';
import { ScrollView, View, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

type Tag = 'Official' | 'Update' | 'Community' | 'Urgent' | 'Event';

type Announcement = {
  id: string;
  title: string;
  body: string;
  date: string;
  tag: Tag;
  author: string;
  initials: string;
  role: string;
  read: boolean;
  pinned?: boolean;
};

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'General Assembly — August 15',
    body: 'All officers are required to attend the monthly General Assembly on August 15, 2025, 9:00 AM at Function Hall A. Please review the attached agenda beforehand and come prepared with your committee updates.',
    date: 'Aug 5',
    tag: 'Urgent',
    author: 'Maria Santos',
    initials: 'MS',
    role: 'SSC President',
    read: false,
    pinned: true,
  },
  {
    id: '2',
    title: 'Updated Submission Guidelines',
    body: 'The submission guidelines for project proposals have been updated. Please review the new format in the shared drive before submitting your Q4 project proposals. Deadline for submission is August 20.',
    date: 'Aug 3',
    tag: 'Official',
    author: 'Carlo Reyes',
    initials: 'CR',
    role: 'Secretary General',
    read: false,
  },
  {
    id: '3',
    title: 'Welcome New Members!',
    body: '12 new members have officially joined SSC this semester. Please make them feel welcome and orient them on our ongoing programs. A formal welcome orientation will be scheduled soon.',
    date: 'Aug 1',
    tag: 'Community',
    author: 'Maria Santos',
    initials: 'MS',
    role: 'SSC President',
    read: true,
  },
  {
    id: '4',
    title: 'Community Outreach Drive Details',
    body: 'The Community Outreach Drive is set for August 18, 7:00 AM at Brgy. San Jose. Volunteers should wear the SSC shirt and bring their own packed lunch. Coordinate with the Outreach Committee for assignments.',
    date: 'Jul 30',
    tag: 'Event',
    author: 'Ana Lim',
    initials: 'AL',
    role: 'Outreach Head',
    read: true,
  },
  {
    id: '5',
    title: 'Finance Report Deadline Reminder',
    body: 'All committee heads are reminded to submit their financial liquidation reports no later than August 10. Late submissions will not be processed for the current fiscal period.',
    date: 'Jul 28',
    tag: 'Update',
    author: 'Carlo Reyes',
    initials: 'CR',
    role: 'Secretary General',
    read: true,
  },
];

const FILTERS = ['All', 'Unread', 'Pinned', 'Official', 'Urgent', 'Community', 'Event', 'Update'] as const;
type Filter = (typeof FILTERS)[number];

const tagConfig: Record<Tag, { bg: string; text: string; dot: string }> = {
  Urgent:    { bg: 'bg-red-50 dark:bg-red-900',     text: 'text-red-500',     dot: 'bg-red-400' },
  Official:  { bg: 'bg-sky-50 dark:bg-sky-900',  text: 'text-sky-500',  dot: 'bg-sky-400' },
  Update:    { bg: 'bg-sky-50 dark:bg-sky-900',     text: 'text-sky-500',     dot: 'bg-sky-400' },
  Community: { bg: 'bg-emerald-50 dark:bg-emerald-900', text: 'text-emerald-500', dot: 'bg-emerald-400' },
  Event:     { bg: 'bg-violet-50 dark:bg-violet-900',  text: 'text-violet-500',  dot: 'bg-violet-400' },
};

const Avatar = ({ initials }: { initials: string }) => (
  <View className="w-9 h-9 rounded-full bg-sky-100 items-center justify-center shrink-0">
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
}: {
  item: Announcement;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className="rounded-2xl p-4 mb-3 border active:opacity-75 bg-card border-border"
  >
    {item.pinned && (
      <View className="flex-row items-center gap-1 mb-2">
        <Text className="text-xs">📌</Text>
        <Text className="text-xs font-semibold text-gray-400">Pinned</Text>
      </View>
    )}

    <View className="flex-row items-start gap-3">
      <Avatar initials={item.initials} />

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-0.5">
          <Text className="text-xs font-medium text-gray-500">{item.author}</Text>
          <Text className="text-xs text-gray-400">{item.date}</Text>
        </View>

        <Text
          className={`text-sm font-bold mb-1 ${item.read ? 'text-gray-700 dark:text-gray-200' : 'text-gray-900 dark:text-white'}`}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <Text className="text-xs text-gray-400 leading-5 mb-3" numberOfLines={2}>
          {item.body}
        </Text>

        <View className="flex-row items-center gap-2">
          <TagBadge tag={item.tag} />
          {!item.read && (
            <View className="w-2 h-2 rounded-full bg-sky-500" />
          )}
        </View>
      </View>
    </View>
  </Pressable>
);

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);

  const unreadCount = announcements.filter((a) => !a.read).length;

  const filtered = announcements.filter((a) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Unread') return !a.read;
    if (activeFilter === 'Pinned') return a.pinned;
    return a.tag === activeFilter;
  });

  const markAllRead = () =>
    setAnnouncements((prev) => prev.map((a) => ({ ...a, read: true })));

  const handlePress = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    router.push(`/announcements/${id}`);
  };

  return (
    <View className="flex-1 bg-brackground">
      <View className="bg-card px-5 pt-14 pb-4 border-b border-border">
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</Text>
            {unreadCount > 0 && (
              <View className="bg-sky-500 rounded-full w-5 h-5 items-center justify-center">
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
                  ? 'bg-sky-400/50 border-sky-500'
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
            <Text className="text-base font-bold text-gray-700">Nothing here</Text>
            <Text className="text-sm text-gray-400">No announcements in this category.</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <AnnouncementCard
              key={item.id}
              item={item}
              onPress={() => handlePress(item.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}