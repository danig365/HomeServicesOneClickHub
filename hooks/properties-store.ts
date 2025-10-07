import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Property, PropertyInsight, PropertyReminder } from '@/types/property';

const STORAGE_KEY = 'hudson_properties';

const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Main Residence',
    address: '123 Luxury Lane',
    city: 'Beverly Hills',
    state: 'CA',
    zipCode: '90210',
    type: 'primary',
    isPrimary: true,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    purchaseDate: '2020-05-15',
    squareFeet: 4500,
    bedrooms: 5,
    bathrooms: 4,
  },
  {
    id: '2',
    name: 'Beach House',
    address: '456 Ocean Drive',
    city: 'Malibu',
    state: 'CA',
    zipCode: '90265',
    type: 'vacation',
    isPrimary: false,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    purchaseDate: '2021-08-20',
    squareFeet: 3200,
    bedrooms: 4,
    bathrooms: 3,
  },
];

export const [PropertiesProvider, useProperties] = createContextHook(() => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProperties = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const selectedId = await AsyncStorage.getItem('selected_property_id');
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setProperties(parsed);
        if (selectedId) {
          setSelectedPropertyId(selectedId);
        } else {
          const primary = parsed.find((p: Property) => p.isPrimary);
          setSelectedPropertyId(primary?.id || parsed[0]?.id || null);
        }
      } else {
        setProperties(mockProperties);
        setSelectedPropertyId(mockProperties[0].id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockProperties));
        await AsyncStorage.setItem('selected_property_id', mockProperties[0].id);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
      setProperties(mockProperties);
      setSelectedPropertyId(mockProperties[0].id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const saveProperties = useCallback(async (newProperties: Property[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProperties));
      setProperties(newProperties);
    } catch (error) {
      console.error('Failed to save properties:', error);
    }
  }, []);

  const addProperty = useCallback(async (property: Omit<Property, 'id'>) => {
    const newProperty: Property = {
      ...property,
      id: Date.now().toString(),
    };
    
    let updatedProperties = [...properties, newProperty];
    
    if (newProperty.isPrimary) {
      updatedProperties = updatedProperties.map(p => 
        p.id === newProperty.id ? p : { ...p, isPrimary: false }
      );
    }
    
    await saveProperties(updatedProperties);
    return newProperty;
  }, [properties, saveProperties]);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    let updatedProperties = properties.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    
    if (updates.isPrimary) {
      updatedProperties = updatedProperties.map(p =>
        p.id === id ? p : { ...p, isPrimary: false }
      );
    }
    
    await saveProperties(updatedProperties);
  }, [properties, saveProperties]);

  const deleteProperty = useCallback(async (id: string) => {
    const updatedProperties = properties.filter(p => p.id !== id);
    
    if (updatedProperties.length > 0 && !updatedProperties.some(p => p.isPrimary)) {
      updatedProperties[0].isPrimary = true;
    }
    
    await saveProperties(updatedProperties);
    
    if (selectedPropertyId === id) {
      const newSelected = updatedProperties[0]?.id || null;
      setSelectedPropertyId(newSelected);
      if (newSelected) {
        await AsyncStorage.setItem('selected_property_id', newSelected);
      }
    }
  }, [properties, selectedPropertyId, saveProperties]);

  const selectProperty = useCallback(async (id: string) => {
    setSelectedPropertyId(id);
    try {
      await AsyncStorage.setItem('selected_property_id', id);
    } catch (error) {
      console.error('Failed to save selected property:', error);
    }
  }, []);

  const getSelectedProperty = useCallback(() => {
    return properties.find(p => p.id === selectedPropertyId) || properties[0] || null;
  }, [properties, selectedPropertyId]);

  const getPrimaryProperty = useCallback(() => {
    return properties.find(p => p.isPrimary) || properties[0] || null;
  }, [properties]);

  const addInsight = useCallback(async (propertyId: string, insight: Omit<PropertyInsight, 'id'>) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    const newInsight: PropertyInsight = {
      ...insight,
      id: Date.now().toString(),
    };

    const updatedInsights = [...(property.insights || []), newInsight];
    await updateProperty(propertyId, { insights: updatedInsights });
  }, [properties, updateProperty]);

  const updateInsight = useCallback(async (propertyId: string, insightId: string, updates: Partial<PropertyInsight>) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.insights) return;

    const updatedInsights = property.insights.map(insight =>
      insight.id === insightId ? { ...insight, ...updates } : insight
    );
    await updateProperty(propertyId, { insights: updatedInsights });
  }, [properties, updateProperty]);

  const deleteInsight = useCallback(async (propertyId: string, insightId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.insights) return;

    const updatedInsights = property.insights.filter(insight => insight.id !== insightId);
    await updateProperty(propertyId, { insights: updatedInsights });
  }, [properties, updateProperty]);

  const addReminder = useCallback(async (propertyId: string, reminder: Omit<PropertyReminder, 'id' | 'propertyId'>) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    const newReminder: PropertyReminder = {
      ...reminder,
      id: Date.now().toString(),
      propertyId,
    };

    const updatedReminders = [...(property.reminders || []), newReminder];
    await updateProperty(propertyId, { reminders: updatedReminders });
  }, [properties, updateProperty]);

  const updateReminder = useCallback(async (propertyId: string, reminderId: string, updates: Partial<PropertyReminder>) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.reminders) return;

    const updatedReminders = property.reminders.map(reminder =>
      reminder.id === reminderId ? { ...reminder, ...updates } : reminder
    );
    await updateProperty(propertyId, { reminders: updatedReminders });
  }, [properties, updateProperty]);

  const deleteReminder = useCallback(async (propertyId: string, reminderId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.reminders) return;

    const updatedReminders = property.reminders.filter(reminder => reminder.id !== reminderId);
    await updateProperty(propertyId, { reminders: updatedReminders });
  }, [properties, updateProperty]);

  const completeReminder = useCallback(async (propertyId: string, reminderId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.reminders) return;

    const reminder = property.reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const updates: Partial<PropertyReminder> = {
      completed: true,
      completedDate: new Date().toISOString(),
    };

    if (reminder.recurring && reminder.recurringInterval) {
      const nextDueDate = new Date(reminder.dueDate);
      nextDueDate.setDate(nextDueDate.getDate() + reminder.recurringInterval);
      
      const newReminder: PropertyReminder = {
        ...reminder,
        id: Date.now().toString(),
        dueDate: nextDueDate.toISOString(),
        completed: false,
        completedDate: undefined,
      };

      const updatedReminders = property.reminders.map(r =>
        r.id === reminderId ? { ...r, ...updates } : r
      ).concat(newReminder);
      
      await updateProperty(propertyId, { reminders: updatedReminders });
    } else {
      await updateReminder(propertyId, reminderId, updates);
    }
  }, [properties, updateProperty, updateReminder]);

  const getUpcomingReminders = useCallback((propertyId: string, days: number = 30) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.reminders) return [];

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return property.reminders
      .filter(r => !r.completed && new Date(r.dueDate) <= futureDate && new Date(r.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [properties]);

  const getOverdueReminders = useCallback((propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property || !property.reminders) return [];

    const now = new Date();
    return property.reminders
      .filter(r => !r.completed && new Date(r.dueDate) < now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [properties]);

  return useMemo(() => ({
    properties,
    selectedPropertyId,
    isLoading,
    addProperty,
    updateProperty,
    deleteProperty,
    selectProperty,
    getSelectedProperty,
    getPrimaryProperty,
    addInsight,
    updateInsight,
    deleteInsight,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    getUpcomingReminders,
    getOverdueReminders,
  }), [
    properties,
    selectedPropertyId,
    isLoading,
    addProperty,
    updateProperty,
    deleteProperty,
    selectProperty,
    getSelectedProperty,
    getPrimaryProperty,
    addInsight,
    updateInsight,
    deleteInsight,
    addReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    getUpcomingReminders,
    getOverdueReminders,
  ]);
});
