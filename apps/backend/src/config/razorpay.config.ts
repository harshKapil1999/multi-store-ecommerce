import Razorpay from 'razorpay';

let instance: Razorpay | null = null;

// Initialize Razorpay instance lazily
export const getRazorpayInstance = (): Razorpay => {
    if (instance) return instance;

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error('Razorpay initialization failed: key_id and key_secret are mandatory. Check your .env file.');
    }

    instance = new Razorpay({
        key_id,
        key_secret,
    });

    return instance;
};

// Validate Razorpay configuration without throwing
export const validateRazorpayConfig = (): boolean => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        console.warn('⚠️ Razorpay credentials not configured in environment variables');
        return false;
    }
    return true;
};
