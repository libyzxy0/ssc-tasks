import { Text } from '@/components/ui/text';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '@/lib/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type Tag = 'Official' | 'Update' | 'Community' | 'Urgent' | 'Event';

const ANNOUNCEMENT = {
  id: '1',
  title: 'General Assembly — August 15',
  body: `All officers are required to attend the monthly General Assembly on August 15, 2025, 9:00 AM at Function Hall A.

Please review the attached agenda beforehand and come prepared with your committee updates. Attendance is mandatory for all elected and appointed officers.

If you are unable to attend due to an emergency, please notify the Secretary General at least 24 hours before the event and provide a written excuse letter.

The agenda will cover the following:
• Q3 financial report presentation
• Program updates from each committee
• Election of new committee heads
• Open forum

Refreshments will be provided. See you there!`,
  date: 'August 5, 2025',
  time: '10:32 AM',
  tag: 'Urgent' as Tag,
  author: 'Maria Santos',
  initials: 'MS',
  role: 'SSC President',
  pinned: true,
};

const tagConfig: Record<Tag, { bg: string; text: string; dot: string }> = {
  Urgent:    { bg: 'bg-red-50 dark:bg-red-900',     text: 'text-red-500',     dot: 'bg-red-400' },
  Official:  { bg: 'bg-sky-50 dark:bg-sky-900',  text: 'text-sky-500',  dot: 'bg-sky-400' },
  Update:    { bg: 'bg-sky-50 dark:bg-sky-900',     text: 'text-sky-500',     dot: 'bg-sky-400' },
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

export default function AnnouncementDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  
  const item = ANNOUNCEMENT;
  const tag = tagConfig[item.tag];

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card px-5 pt-14 pb-3 border-b border-border">
        <View className="flex-row items-center gap-3">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-background items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color={colorScheme === 'dark' ? 'white' : '#1b1b1b'} className="mr-1" />
        </TouchableOpacity>

          <Text className="text-base font-bold text-gray-800 dark:text-white flex-1">Announcement</Text>
          {item.pinned && (
            <View className="flex-row items-center gap-1 bg-sky-400/10 border-sky-400 px-3 py-1.5 rounded-full">
              <Text className="text-xs">📌</Text>
              <Text className="text-xs font-semibold text-gray-500">Pinned</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">

        <View className="bg-card px-5 py-5 border-b ">
          <View className="flex-row items-center gap-3 mb-4">
            <Avatar initials={item.initials} size="lg" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900 dark:text-white">{item.author}</Text>
              <Text className="text-xs text-gray-400">{item.role}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                {item.date} · {item.time}
              </Text>
            </View>
            <TagBadge tag={item.tag} />
          </View>

          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">{item.title}</Text>
        </View>

        <View className="px-5 mt-4 gap-5">

          <View className="bg-card rounded-2xl p-5 border border-border">
            <Text className="text-sm text-gray-600 dark:text-white leading-7">{item.body}</Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}