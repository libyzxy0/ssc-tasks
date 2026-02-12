import React from "react";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Tabs } from "expo-router";
import { Platform } from "react-native";
import { NAV_THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: NAV_THEME[colorScheme]['colors']['primary'],
                headerShown: false,
                tabBarStyle: Platform.select({
                    ios: {
                        position: "absolute"
                    },
                    default: {
                        backgroundColor: NAV_THEME[colorScheme]['colors']['background']
                    }
                })
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons size={22} style={{ marginBottom: -3, color }} name={'home'} />
                    )
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: "Tasks",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons size={22} style={{ marginBottom: -3, color }} name={'rocket'} />
                    )
                }}
            />
            <Tabs.Screen
                name="announcements"
                options={{
                    title: "Announcements",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons size={22} style={{ marginBottom: -3, color }} name={'information-circle'} />
                    )
                }}
            />
            <Tabs.Screen
                name="manage"
                options={{
                    title: "Manage",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons size={22} style={{ marginBottom: -3, color }} name={'settings'} />
                    )
                }}
            />
        </Tabs>
    );
}