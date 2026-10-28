import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootTabParamList, RootStackParamList } from '../types/navigation';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BookingScreen } from '../screens/booking/BookingScreen';
import { GymPassScreen } from '../screens/gym/GymPassScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { MyTicketsScreen } from '../screens/booking/MyTicketsScreen';
import { ClassesScreen } from '../screens/pt/ClassesScreen';
import { TrainersScreen } from '../screens/pt/TrainersScreen';
import { TournamentsScreen } from '../screens/tournaments/TournamentsScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#71717a',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          tabBarLabel: 'Đặt sân',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚽</Text>,
        }}
      />
      <Tab.Screen
        name="GymPass"
        component={GymPassScreen}
        options={{
          tabBarLabel: 'Gym Pass',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📱</Text>,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: 'Ví tiền',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>💳</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#09090b' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="MyTickets" component={MyTicketsScreen} />
      <Stack.Screen name="Classes" component={ClassesScreen} />
      <Stack.Screen name="Trainers" component={TrainersScreen} />
      <Stack.Screen name="Tournaments" component={TournamentsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
