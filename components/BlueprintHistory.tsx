import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BlueprintHistory } from '@/types/blueprint';
import * as Icons from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface Props {
  history: BlueprintHistory[];
}

export default function BlueprintHistoryView({ history }: Props) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Icons.Plus size={16} color={COLORS.teal} />;
      case 'updated': return <Icons.Edit size={16} color={COLORS.gold} />;
      case 'deleted': return <Icons.Trash2 size={16} color={COLORS.accentColors.error} />;
      case 'item_added': return <Icons.PlusCircle size={16} color={COLORS.teal} />;
      case 'item_updated': return <Icons.Edit2 size={16} color={COLORS.gold} />;
      case 'item_completed': return <Icons.CheckCircle size={16} color={COLORS.accentColors.success} />;
      default: return <Icons.Activity size={16} color={COLORS.text.secondary} />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView style={styles.container}>
      {history.map((entry) => (
        <View key={entry.id} style={styles.historyItem}>
          <View style={styles.iconWrapper}>
            {getActionIcon(entry.action)}
          </View>
          <View style={styles.content}>
            <Text style={styles.description}>{entry.description}</Text>
            <View style={styles.meta}>
              <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
              <Text style={styles.user}>
                {entry.user_role === 'tech' ? 'Tech' : 'Owner'}: {entry.user_name}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.secondary,
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
  description: {
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
});
