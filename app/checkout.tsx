import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useCart } from '@/hooks/cart-store';
import { useBookings } from '@/hooks/bookings-store';
import { router } from 'expo-router';
import { MapPin, CreditCard, Calendar, Clock } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

export default function CheckoutScreen() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { addBooking } = useBookings();
  const totalPrice = getTotalPrice();
  
  const [address, setAddress] = useState('123 Main St, City, State 12345');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');

  const handlePlaceOrder = () => {
    if (!date || !time) {
      Alert.alert('Missing Information', 'Please select a date and time for your service.');
      return;
    }

    // Create bookings for each item
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addBooking({
          serviceId: item.service.id,
          serviceName: item.service.name,
          date: date,
          time: time,
          status: 'upcoming',
          price: item.service.price,
          address: address,
          providerName: 'TBD'
        });
      }
    });

    clearCart();
    
    Alert.alert(
      'Order Confirmed!',
      'Your services have been booked successfully. You will receive a confirmation email shortly.',
      [
        { 
          text: 'View Bookings', 
          onPress: () => {
            router.dismissAll();
            router.push('/(tabs)/bookings');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Summary</Text>
        {items.map((item) => (
          <View key={item.service.id} style={styles.summaryItem}>
            <Text style={styles.summaryName}>{item.service.name}</Text>
            <Text style={styles.summaryDetails}>
              {item.quantity} x ${item.service.price} = ${item.service.price * item.quantity}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${totalPrice}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Address</Text>
        <View style={styles.inputContainer}>
          <MapPin size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter service address"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>
        <View style={styles.inputContainer}>
          <Calendar size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="Select date (MM/DD/YYYY)"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={styles.inputContainer}>
          <Clock size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="Select time (e.g., 10:00 AM)"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.inputContainer}>
          <CreditCard size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="Card Number"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { paddingLeft: 12 }]}
            value={cardName}
            onChangeText={setCardName}
            placeholder="Cardholder Name"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
        <Text style={styles.placeOrderText}>Place Order - ${totalPrice}</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        By placing this order, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  summaryDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.teal,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  placeOrderButton: {
    backgroundColor: COLORS.accent.success,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
});