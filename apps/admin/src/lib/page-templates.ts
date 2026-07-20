export type PageTemplate = {
  title: string;
  slug: string;
  description: string;
  content: string;
};

export const PAGE_TEMPLATES: Record<'privacy' | 'terms' | 'returns', PageTemplate> = {
  privacy: {
    title: 'Privacy Policy',
    slug: 'privacy',
    description: 'How customer information is collected, used, retained, and protected.',
    content: `<h2>Privacy Policy</h2><p><strong>Last updated:</strong> Replace with the publication date.</p><p>This policy explains how this store collects, uses, and protects personal information when customers browse the website, create an account, or place an order.</p><h3>Information we collect</h3><ul><li>Contact and delivery information provided during checkout.</li><li>Order, payment status, and customer-support history.</li><li>Technical information required for security and reliable operation.</li></ul><h3>How information is used</h3><p>Information is used to fulfil orders, provide customer support, prevent fraud, comply with legal obligations, and improve the shopping experience.</p><h3>Payments</h3><p>Payments are processed by the configured payment provider. The store does not receive or store complete card details.</p><h3>Sharing and retention</h3><p>Information may be shared with service providers that operate payments, delivery, email, hosting, and analytics. Data is retained only for as long as required for the purposes described here or by applicable law.</p><h3>Your choices</h3><p>Customers may request access, correction, or deletion of eligible personal information by contacting <a href="mailto:support@crabtile.com">support@crabtile.com</a>.</p><h3>Contact</h3><p>Questions about this policy can be sent to <a href="mailto:privacy@crabtile.com">privacy@crabtile.com</a>.</p>`,
  },
  terms: {
    title: 'Terms & Conditions',
    slug: 'terms',
    description: 'Terms governing use of the storefront and purchases.',
    content: `<h2>Terms &amp; Conditions</h2><p><strong>Last updated:</strong> Replace with the publication date.</p><p>These terms apply to use of this storefront and to orders placed through it. By placing an order, the customer agrees to these terms.</p><h3>Products and pricing</h3><p>Product descriptions, availability, and prices may change. If a pricing or availability error affects an order, the store may cancel the affected item and issue the applicable refund.</p><h3>Orders</h3><p>An order is accepted when it is confirmed by the store. The store may decline or cancel orders affected by suspected fraud, inventory errors, payment failure, or delivery restrictions.</p><h3>Payment</h3><p>Online payments are processed by the configured payment provider. Cash-on-delivery availability, when offered, may depend on the delivery location and order value.</p><h3>Delivery</h3><p>Delivery dates are estimates. Customers are responsible for providing a complete and accurate delivery address.</p><h3>Returns and refunds</h3><p>Eligible returns and refunds are governed by the published Returns &amp; Refunds Policy.</p><h3>Liability</h3><p>Nothing in these terms excludes rights or remedies that cannot be excluded under applicable law.</p><h3>Contact</h3><p>Questions can be sent to <a href="mailto:support@crabtile.com">support@crabtile.com</a>.</p>`,
  },
  returns: {
    title: 'Returns & Refunds',
    slug: 'returns',
    description: 'Eligibility, process, and timing for returns and refunds.',
    content: `<h2>Returns &amp; Refunds</h2><p><strong>Last updated:</strong> Replace with the publication date.</p><h3>Return eligibility</h3><p>Replace this paragraph with the store's return window and product-specific eligibility rules. Returned products should be unused, in original condition, and include the original packaging and proof of purchase unless applicable law requires otherwise.</p><h3>Non-returnable items</h3><p>List any categories that cannot be returned for hygiene, safety, customization, or final-sale reasons.</p><h3>How to request a return</h3><p>Email <a href="mailto:returns@crabtile.com">returns@crabtile.com</a> with the order number, item, and reason for the request. Do not send an item until return instructions are provided.</p><h3>Refund timing</h3><p>Approved refunds are sent to the original payment method. Bank or payment-provider processing time may apply after the refund is issued.</p><h3>Damaged or incorrect items</h3><p>Contact <a href="mailto:orders@crabtile.com">orders@crabtile.com</a> promptly with the order number and clear photographs so the issue can be reviewed.</p>`,
  },
};
