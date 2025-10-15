import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Icons from 'lucide-react-native';
import { BlueprintNotification } from '@/types/blueprint';
import { COLORS } from '@/constants/colors';

export interface Props {
  notifications: BlueprintNotification[];
  onMarkAsRead: (id: string) => void;
  visible: boolean;
  onClose: () => void;
}

export default function BlueprintNotifications({ notifications, onMarkAsRead, visible, onClose }: Props) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_added':
        return <Icons.PlusCircle color={COLORS.teal} size={20} />;
      case 'project_completed':
        return <Icons.CheckCircle color={COLORS.darkTeal} size={20} />;
      case 'plan_modified':
        return <Icons.Edit color={COLORS.gold} size={20} />;
      case 'tech_update':
        return <Icons.Wrench color={COLORS.teal} size={20} />;
      case 'user_update':
        return <Icons.User color={COLORS.cream} size={20} />;
      default:
        return <Icons.Bell color={COLORS.darkGold} size={20} />;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <ScrollView style={styles.container}>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[styles.notification, !notification.read && styles.unread]}
            onPress={() => onMarkAsRead(notification.id)}
          >
            <View style={styles.iconWrapper}>
              {getNotificationIcon(notification.type)}
            </View>
            <View style={styles.content}>
              <Text style={styles.message}>{notification.message}</Text>
              <View style={styles.meta}>
                <Text style={styles.date}>{formatDate(notification.created_at)}</Text>
                <Text style={styles.user}>
                  {notification.user_role === 'tech' ? 'Tech' : 'Owner'}: {notification.user_name}
                </Text>
              </View>
            </View>
            {!notification.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notification: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
    backgroundColor: COLORS.white,
  },
  unread: {
    backgroundColor: COLORS.cream,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  user: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.teal,
    marginLeft: 8,
    alignSelf: 'center',
  },
});
