export interface ReferralCard {
  id: string;
  userId: string;
  code: string;
  memberSince: string;
  tier: 'platinum' | 'gold' | 'silver';
  sharesRemaining: number;
  maxShares: number;
  expiryDate: string;
  isActive: boolean;
}

export interface ReferralShare {
  id: string;
  referralCardId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  sharedDate: string;
  status: 'pending' | 'accepted' | 'expired';
  shareMethod: 'email' | 'sms';
}
