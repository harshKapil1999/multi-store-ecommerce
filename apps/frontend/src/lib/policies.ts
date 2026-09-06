import { DEFAULT_COMMERCE_SETTINGS, type CommerceSettings } from '@repo/types';
export const POLICY_TITLES: Record<string, string> = {
  'about-us': 'About Crabtile', contact: 'Contact us', 'terms-and-conditions': 'Terms & conditions',
  'privacy-policy': 'Privacy policy', 'shipping-policy': 'Shipping & delivery', 'returns-refunds': 'Returns & refunds',
};
export function policySections(slug: string, input?: Partial<CommerceSettings>): { title: string; text: string }[] {
  const s = { ...DEFAULT_COMMERCE_SETTINGS, ...input };
  const contact = `Contact ${s.supportEmail}${s.supportPhone ? ` or ${s.supportPhone}` : ''}. Our business is based at ${s.businessAddress}.`;
  const policies: Record<string, { title: string; text: string }[]> = {
    'about-us': [
      { title: 'Welcome to Crabtile', text: `${s.businessName} is an online retail business based in Himachal Pradesh, India. Browse our collections, find product details, and place orders for delivery within India.` },
      { title: 'A clear shopping experience', text: 'Product listings show the available images, descriptions, options, prices and stock. Your account brings together your saved addresses, orders and delivery updates.' },
      { title: 'Here to help', text: contact },
    ],
    contact: [
      { title: 'Customer support', text: `For product questions, order changes, delivery assistance or returns, email ${s.supportEmail}. Include your order number if you have placed an order. Never send passwords, OTPs, UPI PINs or full card details.` },
      ...(s.grievanceName ? [{title: 'Grievance officer', text: `${s.grievanceName} · ${s.grievanceEmail || s.supportEmail}`}]: []),
      ...(s.gstin ? [{title: 'Tax registration', text: `GSTIN: ${s.gstin}`}]: []),
      { title: 'Business details', text: `${s.businessName} · ${s.businessAddress}${s.supportPhone ? ` · ${s.supportPhone}` : ''}` },
      { title: 'Order updates', text: 'Sign in using the email you used at checkout to see payment status, order history and tracking details. Carrier tracking appears once your parcel has been dispatched.' },
      { title: 'Complaints and privacy requests', text: `Write to ${s.supportEmail} with “Complaint” or “Privacy request” in the subject. We aim to acknowledge complaints within 48 hours and resolve them within one month. Return parcels only after we provide the correct return address and instructions.` },
    ],
    'terms-and-conditions': [
      { title: 'Who we are', text: `These terms apply to purchases from ${s.businessName} on this website. ${contact}` },
      { title: 'Eligibility and your account', text: 'You must be at least 18, or use the website under the supervision of a parent or legal guardian. Provide accurate contact and delivery information. Keep your login codes private. You are responsible for activity you authorize on your account.' },
      { title: 'Products and prices', text: 'Prices are displayed in Indian rupees. Displayed product prices include applicable taxes; shipping is shown separately before payment. Product colours may vary between screens. Review the specific description, size and option before ordering. We may correct genuine listing errors and will contact you before proceeding with an affected order.' },
      { title: 'Orders and payment', text: `Online payments are processed by Razorpay. An order awaiting payment is not a confirmed purchase. We confirm online orders after payment verification and stock checks.${s.codEnabled ? ' Cash-on-delivery orders are payable when delivered.' : ''} If we cannot fulfil a paid order, we will contact you and arrange a refund. We do not store full card details or UPI PINs.` },
      { title: 'Delivery, cancellation and returns', text: `We deliver within India, subject to courier serviceability. Contact support as soon as possible to request cancellation before dispatch. Once shipped, the return policy applies. Request eligible returns within ${s.returnDays} days of delivery. Read the shipping and return pages for the complete process and charges.` },
      { title: 'Fair use and consumer rights', text: 'Do not misuse the service, attempt unauthorized access, submit fraudulent orders or infringe intellectual property. Product and brand names identify the listed goods and do not by themselves imply endorsement or an official brand relationship. Nothing in these terms limits rights or remedies available under applicable Indian consumer law.' },
      { title: 'Changes and disputes', text: 'We may update these terms for future orders. The terms shown when your order was placed apply to that purchase. Indian law governs these terms. Contact customer support first for assistance; statutory consumer remedies remain available.' },
    ],
    'privacy-policy': [
      { title: 'What we collect', text: 'We collect the name, email address, phone number and delivery or billing address you provide, your ordered items, order history, payment references and payment status. Essential technical logs may contain request times, IP addresses and device or browser information. We also store your shopping bag, wishlist, theme preference and sign-in session in your browser.' },
      { title: 'Why we collect it', text: 'We use contact details to verify your sign-in, confirm purchases and answer support requests; addresses to deliver your orders; order and payment records to reconcile payments, process refunds and meet accounting obligations; and limited technical information to prevent abuse and operate the service reliably.' },
      { title: 'Payments and service providers', text: 'Razorpay processes payment details through its checkout. We receive payment references, status, method and limited contact information; we do not receive or store your full card number, CVV or UPI PIN. Necessary information is shared with delivery providers, email providers and our hosting, database and storage providers to perform their services. These providers may process data outside India under their service terms and applicable safeguards.' },
      { title: 'Marketing choices', text: 'Marketing subscriptions are optional and separate from checkout. We send product or promotional updates only when you opt in. You can withdraw marketing consent through the unsubscribe option or by contacting support. Transactional messages about sign-in, orders, deliveries or refunds may still be sent where needed to fulfil your request.' },
      { title: 'Storage and retention', text: 'We keep account and order data for as long as needed to fulfil orders, provide support, resolve disputes and meet legal or accounting requirements. Login codes expire after ten minutes and are stored as hashes. Signing out removes the active session from your browser. Browser storage used for your bag and wishlist can be cleared in your browser settings.' },
      { title: 'Your requests and choices', text: `Contact ${s.supportEmail} to request access, correction or deletion of your personal data, withdraw consent where applicable, or raise a privacy complaint. We may verify your identity before acting. Some transaction records may need to be retained to meet legal obligations. We do not sell your personal data.` },
      { title: 'Children and updates', text: 'This service is intended for adults. We do not knowingly solicit personal data from children without appropriate parental involvement. We may update this policy when our practices change and will display the current version here.' },
    ],
    'shipping-policy': [
      { title: 'Delivery area', text: 'We currently accept deliveries within India. Courier serviceability depends on your PIN code. If an address cannot be served, we will contact you and arrange cancellation and a refund of any payment received.' },
      { title: 'Shipping charges', text: `Standard shipping is ₹${s.shippingFee.toLocaleString('en-IN')}. Orders with a product subtotal of ₹${s.freeShippingThreshold.toLocaleString('en-IN')} or more qualify for free shipping. The applicable charge is displayed at checkout before you pay.` },
      { title: 'Dispatch and delivery estimates', text: `We aim to dispatch available products within ${s.processingDays} business days after confirmation. Estimated delivery is ${s.deliveryMinDays}–${s.deliveryMaxDays} business days after dispatch. These are estimates, not guaranteed dates; remote locations, holidays, weather or courier delays may require more time.` },
      { title: 'Tracking your parcel', text: 'Once dispatched, your order page shows the carrier and tracking reference. We also send order-status updates to your checkout email. If tracking does not update or your parcel appears delayed, contact support with your order number.' },
      { title: 'Address corrections and delivery issues', text: 'Check your address and phone number carefully before ordering. Contact us immediately for changes before dispatch. If delivery fails, contact support to arrange the next step. For a damaged, incorrect or missing item, keep the packaging and share photos so we can investigate.' },
    ],
    'returns-refunds': [
      { title: 'Requesting a return', text: `Email ${s.supportEmail} within ${s.returnDays} days of delivery with your order number, the item and reason for return. Items returned for a change of mind must be unused, unwashed and in their original condition with tags, accessories and packaging. Do not send a parcel until we confirm the return instructions.` },
      { title: 'Damaged, defective or incorrect items', text: 'Contact us promptly with your order number and photos of the product and packaging. We will investigate and offer an appropriate replacement or refund. We cover reasonable return shipping for items that are damaged, defective or sent incorrectly. Your statutory rights are unaffected.' },
      { title: 'Return shipping and inspection', text: 'For a change-of-mind return, the customer pays return shipping unless we agree otherwise. The original standard shipping charge is non-refundable for change-of-mind returns. We confirm the return address, eligibility and any charges before you send the item. We inspect returned items and explain any rejection.' },
      { title: 'Refund process', text: `Approved refunds are initiated within ${s.refundDays} business days after we receive and inspect the returned item, or approve a cancellation. Online payments are refunded to the original payment method. Your bank or payment provider may take additional time to credit the money. For cash-on-delivery refunds, support will agree a secure refund method with you; never share OTPs or PINs.` },
      { title: 'Cancellations and exchanges', text: 'Contact support as soon as possible to cancel before dispatch. We will confirm whether the order can still be stopped. For an exchange, contact us to check availability; a return and a separate new order may be required. If we cannot fulfil an order, the amount paid for the unfulfilled items and applicable shipping will be refunded.' },
    ],
  };
  return policies[slug] || [];
}
