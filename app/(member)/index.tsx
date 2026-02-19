import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollView, View, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect, useCallback } from 'react';
import { collection, collectionGroup, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';

// ─── Room Card ────────────────────────────────────────────────────────────────

const RoomCard = ({
  id,
  name,
  description,
  roomCode,
  memberCount,
  taskCount,
  completedTaskCount,
  onPress,
}: {
  id: string;
  name: string;
  description: string;
  roomCode: string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  onPress: () => void;
}) => {
  const pct = taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-card rounded-2xl p-4 mb-3 border border-border"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-base font-bold text-gray-800 dark:text-white">{name}</Text>
            <View className="bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
              <Text className="text-xs font-semibold text-blue-600 dark:text-blue-400">Member</Text>
            </View>
          </View>
          <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={2}>
            {description || 'No description'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </View>

      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center gap-1">
          <Ionicons name="people-outline" size={13} color="#6b7280" />
          <Text className="text-xs text-gray-500 dark:text-gray-400">{memberCount} members</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="checkmark-circle-outline" size={13} color="#6b7280" />
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {completedTaskCount}/{taskCount} tasks
          </Text>
        </View>
      </View>

      {taskCount > 0 && (
        <View className="mb-2">
          <View className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <View className="bg-primary rounded-full h-1.5" style={{ width: `${pct}%` }} />
          </View>
        </View>
      )}

      <Text className="text-xs text-gray-400">Code: {roomCode}</Text>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MemberHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [rooms, setRooms]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async () => {
    if (!user?.uid) return;
    try {
      // Step 1: Find all members subcollection docs where uid == current user
      // This gives us the rooms the user has actually joined
      const memberQuery = query(
        collectionGroup(db, 'members'),
        where('uid', '==', user.uid)
      );
      const memberSnap = await getDocs(memberQuery);

      if (memberSnap.empty) {
        setRooms([]);
        return;
      }

      // Step 2: For each matched member doc, the parent is the room
      // member doc path: rooms/{roomId}/members/{uid}
      const fetchedRooms = await Promise.all(
        memberSnap.docs.map(async (memberDoc) => {
          const roomRef = memberDoc.ref.parent.parent;
          if (!roomRef) return null;

          const roomId = roomRef.id;

          // Fetch all members of this room (just for count)
          const membersSnap = await getDocs(collection(db, 'rooms', roomId, 'members'));
          const memberCount = membersSnap.size;

          // Fetch all tasks of this room
          const tasksSnap = await getDocs(collection(db, 'rooms', roomId, 'tasks'));
          const taskCount = tasksSnap.size;
          const completedTaskCount = tasksSnap.docs.filter(
            (t) => t.data().completed === true
          ).length;

          // Fetch the room document for name, description, roomCode, etc.
          const roomSnap = await getDoc(roomRef);

          if (!roomSnap.exists()) return null;

          return {
            id: roomId,
            ...roomSnap.data(),
            memberCount,
            taskCount,
            completedTaskCount,
          };
        })
      );

      setRooms(fetchedRooms.filter(Boolean));
    } catch (e) {
      console.error('Error fetching rooms:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) fetchRooms();
  }, [fetchRooms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRooms();
  };

  const totalTasks     = rooms.reduce((a, r) => a + (r.taskCount || 0), 0);
  const completedTasks = rooms.reduce((a, r) => a + (r.completedTaskCount || 0), 0);

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <View className="bg-blue-500 dark:bg-blue-950 pt-14 pb-6 px-5">
          <Skeleton className="h-4 w-32 rounded-lg mb-1" />
          <Skeleton className="h-7 w-40 rounded-xl mb-1" />
          <Skeleton className="h-3 w-28 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-xl mt-4" />
        </View>
        <View className="p-5 gap-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Banner ─────────────────────────────────────────────────────── */}
        <View className="bg-blue-500 dark:bg-blue-950 pt-14 pb-6 px-5">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-blue-200 text-xs mb-0.5">Welcome back 👋</Text>
              <Text className="text-white text-xl font-bold">
                {user?.firstname ?? 'Member'}
              </Text>
              <Text className="text-blue-200 text-xs mt-0.5 capitalize">
                {user?.role ?? 'Member'}{user?.position ? ` · ${user.position}` : ''}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/(member)/join' as any)}
              >
                <View className="bg-white/20 rounded-full p-2">
                  <Ionicons name="add" size={22} color="white" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/settings')}
              >
                <View className="bg-white/20 rounded-full p-2">
                  <Ionicons name="settings-outline" size={22} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <View className="px-5 mt-5">

          {/* Stats row */}
          {rooms.length > 0 && (
            <View className="flex-row gap-2 mb-5">
              {[
                {
                  label: 'Rooms',
                  value: rooms.length,
                  icon: 'folder-outline',
                  color: '#6366f1',
                  bg: 'bg-indigo-50 dark:bg-indigo-950/50',
                },
                {
                  label: 'Total Tasks',
                  value: totalTasks,
                  icon: 'clipboard-outline',
                  color: '#f59e0b',
                  bg: 'bg-amber-50 dark:bg-amber-950/50',
                },
                {
                  label: 'Completed',
                  value: completedTasks,
                  icon: 'checkmark-circle-outline',
                  color: '#22c55e',
                  bg: 'bg-green-50 dark:bg-green-950/50',
                },
              ].map((s) => (
                <View key={s.label} className={`flex-1 ${s.bg} rounded-2xl p-3 items-center gap-1`}>
                  <Ionicons name={s.icon as any} size={18} color={s.color} />
                  <Text className="text-lg font-black text-gray-800 dark:text-white">{s.value}</Text>
                  <Text className="text-xs text-gray-400">{s.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Room list */}
          {rooms.length > 0 ? (
            <>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Your Rooms
              </Text>
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  {...room}
                  onPress={() => router.push(`/(member)/rooms/${room.id}` as any)}
                />
              ))}
            </>
          ) : (
            <View className="bg-card rounded-2xl p-10 border border-border items-center mt-4">
              <View className="bg-blue-100 dark:bg-blue-950/50 rounded-full p-5 mb-4">
                <Ionicons name="folder-open-outline" size={40} color="#3b82f6" />
              </View>
              <Text className="text-base font-bold text-gray-700 dark:text-gray-300 text-center">
                No rooms yet
              </Text>
              <Text className="text-xs text-gray-400 text-center mt-1 mb-5">
                Ask your admin for a room code to get started
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(member)/join' as any)}
                activeOpacity={0.7}
                className="bg-primary rounded-xl px-6 py-2.5"
              >
                <Text className="text-sm font-semibold text-white">Join a Room</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}