// import 'react-native-url-polyfill/auto'
// import { createClient } from '@supabase/supabase-js'
// import * as SecureStore from 'expo-secure-store'
// import { Platform } from 'react-native'

// // Replace with your Supabase project credentials
// const supabaseUrl = 'https://kesrywbeoglrvqrwpweh.supabase.co' // e.g., 'https://xxxxx.supabase.co'
// const supabaseAnonKey = 'sb_publishable_5Hxa_QIyj64IvrBeXMgJug__iDgDbaM'

// // Custom storage adapter for Expo SecureStore
// const ExpoSecureStoreAdapter = {
//   getItem: (key: string) => {
//     return SecureStore.getItemAsync(key)
//   },
//   setItem: (key: string, value: string) => {
//     SecureStore.setItemAsync(key, value)
//   },
//   removeItem: (key: string) => {
//     SecureStore.deleteItemAsync(key)
//   },
// }

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: false,
//   },
// })


import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseUrl = 'https://kesrywbeoglrvqrwpweh.supabase.co' // e.g., 'https://xxxxx.supabase.co'
const supabaseAnonKey = 'sb_publishable_5Hxa_QIyj64IvrBeXMgJug__iDgDbaM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});