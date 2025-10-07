import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { ReferralCard, ReferralShare } from '@/types/referral';

export const useReferral = create(
  combine(
    {
      referralCard: null as ReferralCard | null,
      shares: [] as ReferralShare[],
    },
    (set, get) => ({

      initializeCard: () => {
        const currentYear = new Date().getFullYear();
        const expiryDate = new Date(currentYear, 11, 31);
        
        set({
          referralCard: {
            id: '1',
            userId: 'user-1',
            code: 'HUDSON-2025-ELITE',
            memberSince: '2024',
            tier: 'platinum',
            sharesRemaining: 5,
            maxShares: 5,
            expiryDate: expiryDate.toISOString(),
            isActive: true,
          },
        });
      },

      shareCard: (recipientName: string, recipientEmail?: string, recipientPhone?: string, shareMethod: 'email' | 'sms' = 'email') => {
        const { referralCard, shares } = get();
        
        if (!referralCard || referralCard.sharesRemaining <= 0) {
          return false;
        }

        const newShare: ReferralShare = {
          id: `share-${Date.now()}`,
          referralCardId: referralCard.id,
          recipientName,
          recipientEmail,
          recipientPhone,
          sharedDate: new Date().toISOString(),
          status: 'pending',
          shareMethod,
        };

        set({
          shares: [...shares, newShare],
          referralCard: {
            ...referralCard,
            sharesRemaining: referralCard.sharesRemaining - 1,
          },
        });

        return true;
      },

      getRemainingShares: () => {
        const { referralCard } = get();
        return referralCard?.sharesRemaining || 0;
      },
    })
  )
);
