import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { Award, Mail, User, Shield, X, MessageSquare, Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useReferral } from '@/hooks/referral-store';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

export default function ReferralCardScreen() {
  const insets = useSafeAreaInsets();
  const { referralCard, shares, initializeCard, shareCard } = useReferral();
  const [showShareForm, setShowShareForm] = useState<boolean>(false);
  const [shareMethod, setShareMethod] = useState<'email' | 'sms'>('sms');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');

  useEffect(() => {
    if (!referralCard) {
      initializeCard();
    }
  }, [referralCard, initializeCard]);

  const handleShare = async () => {
    if (!recipientName.trim()) {
      Alert.alert('Error', 'Please enter recipient name');
      return;
    }

    if (shareMethod === 'email') {
      if (!recipientEmail.trim()) {
        Alert.alert('Error', 'Please enter email address');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
    } else {
      if (!recipientPhone.trim()) {
        Alert.alert('Error', 'Please enter phone number');
        return;
      }
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(recipientPhone.replace(/\s/g, ''))) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return;
      }
    }

    const success = shareCard(
      recipientName,
      shareMethod === 'email' ? recipientEmail : undefined,
      shareMethod === 'sms' ? recipientPhone : undefined,
      shareMethod
    );

    if (success) {
      Alert.alert(
        'Success',
        `Your exclusive Hudson referral has been sent to ${recipientName} via ${shareMethod === 'email' ? 'email' : 'text message'}!`,
        [{ text: 'OK', onPress: () => {
          setShowShareForm(false);
          setRecipientName('');
          setRecipientEmail('');
          setRecipientPhone('');
        }}]
      );
    } else {
      Alert.alert('Error', 'You have no shares remaining for this year');
    }
  };



  if (!referralCard) {
    return null;
  }

  const expiryDate = new Date(referralCard.expiryDate);
  const formattedExpiry = expiryDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Referral Card',
          headerStyle: { backgroundColor: COLORS.cream },
          headerTintColor: COLORS.text.primary,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.logoContainer}>
                <Shield size={32} color={COLORS.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.hudsonText}>HUDSON</Text>
              <Text style={styles.eliteText}>ELITE MEMBER</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.tierBadge}>
                <Award size={16} color={COLORS.gold} />
                <Text style={styles.tierText}>{referralCard.tier.toUpperCase()}</Text>
              </View>

              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>REFERRAL CODE</Text>
                <Text style={styles.codeText}>{referralCard.code}</Text>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>MEMBER SINCE</Text>
                  <Text style={styles.detailValue}>{referralCard.memberSince}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>VALID UNTIL</Text>
                  <Text style={styles.detailValue}>{formattedExpiry}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.sharesIndicator}>
                <Text style={styles.sharesText}>
                  {referralCard.sharesRemaining} of {referralCard.maxShares} shares remaining
                </Text>
              </View>
            </View>

            <View style={styles.cardPattern}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.patternLine} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Exclusive Benefits</Text>
          <Text style={styles.infoText}>
            Share the Hudson experience with up to 5 friends or family members this year. Your referral grants them priority access to our luxury home management services.
          </Text>
        </View>

        {referralCard.sharesRemaining > 0 && !showShareForm && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setShowShareForm(true)}
          >
            <MessageSquare size={20} color="white" />
            <Text style={styles.shareButtonText}>Share Your Card</Text>
          </TouchableOpacity>
        )}

        {showShareForm && (
          <View style={styles.shareForm}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Share Your Exclusive Card</Text>
              <TouchableOpacity onPress={() => setShowShareForm(false)}>
                <X size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[styles.methodButton, shareMethod === 'sms' && styles.methodButtonActive]}
                onPress={() => setShareMethod('sms')}
              >
                <MessageSquare size={20} color={shareMethod === 'sms' ? 'white' : COLORS.text.secondary} />
                <Text style={[styles.methodButtonText, shareMethod === 'sms' && styles.methodButtonTextActive]}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, shareMethod === 'email' && styles.methodButtonActive]}
                onPress={() => setShareMethod('email')}
              >
                <Mail size={20} color={shareMethod === 'email' ? 'white' : COLORS.text.secondary} />
                <Text style={[styles.methodButtonText, shareMethod === 'email' && styles.methodButtonTextActive]}>Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <User size={20} color={COLORS.text.secondary} />
              <TextInput
                style={styles.input}
                placeholder="Recipient Name"
                placeholderTextColor={COLORS.text.light}
                value={recipientName}
                onChangeText={setRecipientName}
              />
            </View>

            {shareMethod === 'email' ? (
              <View style={styles.inputContainer}>
                <Mail size={20} color={COLORS.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Recipient Email"
                  placeholderTextColor={COLORS.text.light}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Phone size={20} color={COLORS.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Recipient Phone Number"
                  placeholderTextColor={COLORS.text.light}
                  value={recipientPhone}
                  onChangeText={setRecipientPhone}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <TouchableOpacity style={styles.sendButton} onPress={handleShare}>
              <Text style={styles.sendButtonText}>Send Invitation</Text>
            </TouchableOpacity>
          </View>
        )}

        {shares.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Shared With</Text>
            {shares.map((share) => (
              <View key={share.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyIcon}>
                    {share.shareMethod === 'sms' ? (
                      <MessageSquare size={16} color={COLORS.teal} />
                    ) : (
                      <Mail size={16} color={COLORS.teal} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.historyName}>{share.recipientName}</Text>
                    <Text style={styles.historyEmail}>
                      {share.shareMethod === 'sms' ? share.recipientPhone : share.recipientEmail}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{share.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {referralCard.sharesRemaining === 0 && (
          <View style={styles.noSharesContainer}>
            <Award size={48} color={COLORS.gold} />
            <Text style={styles.noSharesTitle}>All Shares Used</Text>
            <Text style={styles.noSharesText}>
              You&apos;ve used all 5 of your exclusive shares for this year. Your card will refresh on January 1st.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContent: {
    padding: 24,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.darkTeal,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  hudsonText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 4,
    marginBottom: 4,
  },
  eliteText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gold,
    letterSpacing: 2,
  },
  cardBody: {
    marginBottom: 20,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  codeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
  },
  sharesIndicator: {
    alignItems: 'center',
  },
  sharesText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  cardPattern: {
    position: 'absolute',
    right: -20,
    top: 40,
    opacity: 0.05,
  },
  patternLine: {
    width: 100,
    height: 2,
    backgroundColor: 'white',
    marginVertical: 8,
    transform: [{ rotate: '45deg' }],
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.teal,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  shareForm: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cream,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  sendButton: {
    backgroundColor: COLORS.teal,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    borderWidth: 2,
    borderColor: COLORS.cream,
  },
  methodButtonActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  methodButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  methodButtonTextActive: {
    color: 'white',
  },
  historySection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cream,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  historyEmail: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  statusBadge: {
    backgroundColor: COLORS.cream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'capitalize',
  },
  noSharesContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  noSharesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  noSharesText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
