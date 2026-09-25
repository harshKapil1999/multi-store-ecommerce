import { createRepository, Entity } from '../db/repository';
import { NewsletterSubscriberTable } from '../db/schema';

export interface INewsletterSubscriber extends Entity {
  storeId: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  consentAt: Date;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}


export const NewsletterSubscriber = createRepository<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberTable);
