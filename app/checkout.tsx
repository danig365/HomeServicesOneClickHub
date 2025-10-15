import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useCart } from "@/hooks/cart-store";
import { useBookings } from "@/hooks/bookings-store";
import { router } from "expo-router";
import { CreditCard, Calendar, Clock } from "lucide-react-native";
import { COLORS } from "@/constants/colors";
import { useProperties } from "@/hooks/properties-store";

export default function CheckoutScreen() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { addBooking, addRecurringService } = useBookings();
  const totalPrice = getTotalPrice();
  const { getSelectedProperty } = useProperties();
  const selectedProperty = getSelectedProperty();
  const [address, setAddress] = useState(
    selectedProperty
      ? `${selectedProperty.address}, ${selectedProperty.city}, ${selectedProperty.state} ${selectedProperty.zipCode}`
      : ""
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<
    "monthly" | "quarterly" | "bi-annual" | "annual"
  >("monthly");

  const handlePlaceOrder = async () => {
    if (!date || !time) {
      Alert.alert(
        "Missing Information",
        "Please select a date and time for your service."
      );
      return;
    }

    if (!selectedProperty) {
      Alert.alert(
        "No Property Selected",
        "Please select a property before booking services."
      );
      return;
    }

    try {
      // Create bookings or recurring services for each item
      for (const item of items) {
        if (isRecurring) {
          // Create recurring service
          await addRecurringService({
            serviceId: item.service.id,
            serviceName: item.service.name,
            frequency: frequency,
            price: item.service.price,
            startDate: date,
            nextServiceDate: date,
            status: "active",
            autoRenew: true,
            propertyId: selectedProperty.id,
          });
        } else {
          // Create one-time bookings
          for (let i = 0; i < item.quantity; i++) {
            await addBooking({
              serviceId: item.service.id,
              serviceName: item.service.name,
              date: date,
              time: time,
              status: "upcoming",
              price: item.service.price,
              address: address,
              providerName: "Hudson Home Services",
              propertyId: selectedProperty.id,
            });
          }
        }
      }

      clearCart();

      Alert.alert(
        isRecurring ? "Recurring Service Set Up! 🎉" : "Order Confirmed! 🎉",
        isRecurring
          ? "Your recurring service has been set up successfully."
          : "Your services have been booked successfully. You will receive a confirmation email shortly.",
        [
          {
            text: "View Bookings",
            onPress: () => {
              router.replace("/(tabs)/bookings");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Booking failed:", error);
      Alert.alert(
        "Booking Failed",
        "There was an error booking your services. Please try again."
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Service Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Summary</Text>
        {items.map((item) => (
          <View key={item.service.id} style={styles.summaryItem}>
            <Text style={styles.summaryName}>{item.service.name}</Text>
            <Text style={styles.summaryDetails}>
              {item.quantity} x ${item.service.price} = $
              {item.service.price * item.quantity}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${totalPrice}</Text>
        </View>
      </View>

      {/* Property Information */}
      {selectedProperty && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Property</Text>
          <View style={styles.propertyCard}>
            <Text style={styles.propertyName}>{selectedProperty.name}</Text>
            <Text style={styles.propertyAddress}>
              {selectedProperty.address}, {selectedProperty.city}
            </Text>
          </View>
        </View>
      )}

      {/* Schedule Section */}
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

      {/* Service Type Section - RECURRING TOGGLE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Type</Text>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => {
            console.log("Toggle pressed, current state:", isRecurring);
            setIsRecurring(!isRecurring);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleLabel}>
              Make this a recurring service
            </Text>
            <Text style={styles.toggleSubtext}>
              Save time with automatic scheduling
            </Text>
          </View>
          <View style={[styles.toggle, isRecurring && styles.toggleActive]}>
            <View
              style={[styles.toggleDot, isRecurring && styles.toggleDotActive]}
            />
          </View>
        </TouchableOpacity>

        {/* Frequency Options - Only show when recurring is enabled */}
        {isRecurring && (
          <View style={styles.frequencyContainer}>
            <Text style={styles.frequencyLabel}>Frequency</Text>
            <View style={styles.frequencyButtons}>
              {[
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Every 3 Months" },
                { value: "bi-annual", label: "Every 6 Months" },
                { value: "annual", label: "Annually" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.frequencyButton,
                    frequency === option.value && styles.frequencyButtonActive,
                  ]}
                  onPress={() => setFrequency(option.value as any)}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      frequency === option.value &&
                        styles.frequencyButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Payment Section */}
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

      {/* Place Order Button */}
      <TouchableOpacity
        style={styles.placeOrderButton}
        onPress={handlePlaceOrder}
      >
        <Text style={styles.placeOrderText}>Place Order - ${totalPrice}</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        By placing this order, you agree to our Terms of Service and Privacy
        Policy.
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
    backgroundColor: "white",
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  summaryItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  summaryDetails: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.teal,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 8,
    fontSize: 16,
    color: "#111827",
  },
  placeOrderButton: {
    backgroundColor: COLORS.teal,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  placeOrderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  disclaimer: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  propertyCard: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: "#6B7280",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 70,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 13,
    color: "#6B7280",
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D1D5DB",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: COLORS.teal,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleDotActive: {
    transform: [{ translateX: 22 }],
  },
  frequencyContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  frequencyButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  frequencyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: "48%",
    alignItems: "center",
  },
  frequencyButtonActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  frequencyButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
});