import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, UserRole, TechAssignment } from '@/types/user';

const USER_STORAGE_KEY = 'hudson_current_user';
const TECHS_STORAGE_KEY = 'hudson_techs';
const ASSIGNMENTS_STORAGE_KEY = 'hudson_tech_assignments';

const mockTechs: User[] = [
  {
    id: 'tech-1',
    name: 'John Smith',
    email: 'john@hudson.com',
    phone: '(555) 123-4567',
    role: 'tech',
    assignedProperties: ['1'],
  },
  {
    id: 'tech-2',
    name: 'Sarah Johnson',
    email: 'sarah@hudson.com',
    phone: '(555) 234-5678',
    role: 'tech',
    assignedProperties: ['2'],
  },
];

const mockAdmin: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@hudson.com',
  phone: '(555) 999-9999',
  role: 'admin',
};

export const [UserProvider, useUser] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [techs, setTechs] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<TechAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [storedUser, storedTechs, storedAssignments] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(TECHS_STORAGE_KEY),
        AsyncStorage.getItem(ASSIGNMENTS_STORAGE_KEY),
      ]);

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        setCurrentUser(mockAdmin);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockAdmin));
      }

      if (storedTechs) {
        setTechs(JSON.parse(storedTechs));
      } else {
        setTechs(mockTechs);
        await AsyncStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(mockTechs));
      }

      if (storedAssignments) {
        setAssignments(JSON.parse(storedAssignments));
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setCurrentUser(mockAdmin);
      setTechs(mockTechs);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const switchRole = useCallback(async (role: UserRole) => {
    let user: User;
    if (role === 'admin') {
      user = mockAdmin;
    } else if (role === 'tech') {
      user = mockTechs[0];
    } else {
      user = {
        id: 'homeowner-1',
        name: 'Homeowner',
        email: 'homeowner@example.com',
        phone: '(555) 000-0000',
        role: 'homeowner',
      };
    }
    setCurrentUser(user);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }, []);

  const assignTechToProperty = useCallback(async (techId: string, propertyId: string) => {
    const assignment: TechAssignment = {
      techId,
      propertyId,
      assignedDate: new Date().toISOString(),
      status: 'active',
    };

    const updatedAssignments = [...assignments, assignment];
    setAssignments(updatedAssignments);
    await AsyncStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updatedAssignments));

    const updatedTechs = techs.map(tech => {
      if (tech.id === techId) {
        return {
          ...tech,
          assignedProperties: [...(tech.assignedProperties || []), propertyId],
        };
      }
      return tech;
    });
    setTechs(updatedTechs);
    await AsyncStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(updatedTechs));
  }, [assignments, techs]);

  const unassignTechFromProperty = useCallback(async (techId: string, propertyId: string) => {
    const updatedAssignments = assignments.map(a =>
      a.techId === techId && a.propertyId === propertyId
        ? { ...a, status: 'inactive' as const }
        : a
    );
    setAssignments(updatedAssignments);
    await AsyncStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updatedAssignments));

    const updatedTechs = techs.map(tech => {
      if (tech.id === techId) {
        return {
          ...tech,
          assignedProperties: (tech.assignedProperties || []).filter(id => id !== propertyId),
        };
      }
      return tech;
    });
    setTechs(updatedTechs);
    await AsyncStorage.setItem(TECHS_STORAGE_KEY, JSON.stringify(updatedTechs));
  }, [assignments, techs]);

  const getTechsForProperty = useCallback((propertyId: string) => {
    return techs.filter(tech =>
      tech.assignedProperties?.includes(propertyId)
    );
  }, [techs]);

  const getPropertiesForTech = useCallback((techId: string) => {
    const tech = techs.find(t => t.id === techId);
    return tech?.assignedProperties || [];
  }, [techs]);

  return useMemo(() => ({
    currentUser,
    techs,
    assignments,
    isLoading,
    switchRole,
    assignTechToProperty,
    unassignTechFromProperty,
    getTechsForProperty,
    getPropertiesForTech,
  }), [
    currentUser,
    techs,
    assignments,
    isLoading,
    switchRole,
    assignTechToProperty,
    unassignTechFromProperty,
    getTechsForProperty,
    getPropertiesForTech,
  ]);
});
