export interface PaymentDetails {
  method: 'card' | 'upi' | 'qr';
  amount: number;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  upiId?: string;
}

export interface PaymentResult {
    success: boolean;
    transactionId: string;
}

export const paymentService = {
  processPayment: async (details: PaymentDetails): Promise<PaymentResult> => {
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Basic Mock Validation
    if (details.method === 'card') {
        const cleanNum = details.cardNumber?.replace(/\s/g, '') || '';
        if (cleanNum.length !== 16 || isNaN(Number(cleanNum))) {
            throw new Error('Invalid card number. Please enter a valid 16-digit number.');
        }
        if (!details.expiry || details.expiry.length !== 5) {
             throw new Error('Invalid expiry date.');
        }
        if (!details.cvc || details.cvc.length !== 3) {
            throw new Error('Invalid CVC.');
        }
    }

    if (details.method === 'upi') {
        if (!details.upiId || !details.upiId.includes('@')) {
            throw new Error('Invalid UPI ID format (e.g., user@bank).');
        }
    }

    // Simulate random decline (for realism, kept very low probability for demo)
    if (Math.random() > 0.98) {
        throw new Error('Transaction declined by bank. Please try a different method.');
    }

    return {
      success: true,
      transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase()
    };
  }
};