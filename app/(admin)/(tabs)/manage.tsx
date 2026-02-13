import { useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/FirebaseConfig'

type Role = 'admin' | 'member'

type User = {
  uid: string
  firstname: string
  lastname: string
  email: string
  role: Role
  position: string
  photo_url: string | null
  signup_method: string
}

const ROLES: Role[] = ['admin', 'member']

export default function AdminManage() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      users.filter(
        (u) =>
          u.firstname?.toLowerCase().includes(q) ||
          u.lastname?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.position?.toLowerCase().includes(q)
      )
    )
  }, [search, users])

  async function fetchUsers() {
    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const data = snapshot.docs.map((d) => d.data() as User)
      setUsers(data)
      setFiltered(data)
    } catch {
      Alert.alert('Error', 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  function openModal(user: User) {
    setSelectedUser(user)
    setModalVisible(true)
  }

  function closeModal() {
    setModalVisible(false)
    setSelectedUser(null)
  }

  async function handleRoleChange(newRole: Role) {
    if (!selectedUser) return
    setRoleLoading(true)
    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), { role: newRole })
      const updated = { ...selectedUser, role: newRole }
      setUsers((prev) => prev.map((u) => (u.uid === selectedUser.uid ? updated : u)))
      setSelectedUser(updated)
    } catch {
      Alert.alert('Error', 'Failed to update role.')
    } finally {
      setRoleLoading(false)
    }
  }

  function confirmDelete(uid: string, name: string) {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete ${name}'s account? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', uid))
              setUsers((prev) => prev.filter((u) => u.uid !== uid))
              closeModal()
            } catch {
              Alert.alert('Error', 'Failed to delete account.')
            }
          },
        },
      ]
    )
  }

  const initials = (u: User) =>
    `${u.firstname?.[0] ?? ''}${u.lastname?.[0] ?? ''}`.toUpperCase()

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center gap-3">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-gray-500 text-sm">Loading users...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <View className="bg-card px-5 pt-14 pb-4 border-b border-border">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Manage</Text>
        </View>
        <Text className="text-xs text-gray-400">
          {users.length} accounts
        </Text>
      </View>
      
      <View className="px-4">
      <Input
        placeholder="Search name, email or position..."
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={setSearch}
        className="my-3"
      />
      </View>

      <ScrollView 
        contentContainerClassName="px-4 pb-8 gap-2.5"
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && (
          <Text className="text-center text-gray-400 mt-10 text-sm">No users found.</Text>
        )}
        {filtered.map((user) => (
          <TouchableOpacity
            activeOpacity={0.7}
            key={user.uid}
            className="flex-row items-center bg-white dark:bg-card rounded-xl p-3 border border-gray-200 dark:border-border gap-3"
            onPress={() => openModal(user)}
            activeOpacity={0.75}
          >
            <View className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-900/30 justify-center items-center">
              <Text className="text-[15px] font-bold text-indigo-700 dark:text-indigo-300">
                {initials(user)}
              </Text>
            </View>

            <View className="flex-1 gap-0.5">
              <Text className="text-[15px] font-semibold text-gray-900 dark:text-white">
                {user.firstname} {user.lastname}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">{user.email}</Text>
              {user.position ? (
                <Text className="text-xs text-gray-400 dark:text-gray-500">{user.position}</Text>
              ) : null}
            </View>

            <View 
              className="px-2.5 py-1 rounded-full"
            >
              <Text 
                className={`text-[11px] font-semibold capitalize px-3 rounded-full py-1 ${user.role === 'admin' ? 'bg-primary' : 'bg-border'}`}
              >
                {user.role}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white dark:bg-card rounded-t-[20px] p-6 gap-3">
            {selectedUser && (
              <>
                <View className="items-center gap-1 mb-2">
                  <View className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 justify-center items-center mb-2">
                    <Text className="text-[22px] font-bold text-indigo-700 dark:text-indigo-300">
                      {initials(selectedUser)}
                    </Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedUser.firstname} {selectedUser.lastname}
                  </Text>
                  <Text className="text-[13px] text-gray-500 dark:text-gray-400">
                    {selectedUser.email}
                  </Text>
                  {selectedUser.position ? (
                    <Text className="text-[13px] text-gray-400 dark:text-gray-500">
                      {selectedUser.position}
                    </Text>
                  ) : null}
                  <Text className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
                    Joined via {selectedUser.signup_method}
                  </Text>
                </View>

                <Text className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </Text>
                <View className="flex-row gap-2.5">
                  {ROLES.map((r) => (
                    <TouchableOpacity
                    activeOpacity={0.7}
                      key={r}
                      className={`flex-1 py-2.5 rounded-lg borde border-border items-center ${
                        selectedUser.role === r 
                          ? 'border-primary bg-primary' 
                          : 'border border-border'
                      }`}
                      onPress={() => handleRoleChange(r)}
                      disabled={roleLoading}
                    >
                      <Text 
                        className={`text-sm font-medium capitalize`}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                activeOpacity={0.7}
                  className="mt-1 py-3 rounded-lg bg-red-100 dark:bg-red-900/20 items-center"
                  onPress={() =>
                    confirmDelete(
                      selectedUser.uid,
                      `${selectedUser.firstname} ${selectedUser.lastname}`
                    )
                  }
                >
                  <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Delete Account
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                activeOpacity={0.7}
                  className="py-3 rounded-lg bg-border items-center"
                  onPress={closeModal}
                >
                  <Text className="text-sm font-semibold">
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}