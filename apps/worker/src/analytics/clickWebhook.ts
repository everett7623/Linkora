import type { VisitQueueMessage } from '@linketry/shared';

export interface ClickWebhookData {
  click: {
    id: string;
    occurred_at: string;
    is_bot: boolean;
  };
  link: {
    id: string;
    slug: string;
    domain: string;
  };
}

export function buildClickWebhookData(
  message: VisitQueueMessage,
  visitId: string,
  occurredAt: string,
  isBot: boolean
): ClickWebhookData {
  return {
    click: {
      id: visitId,
      occurred_at: occurredAt,
      is_bot: isBot,
    },
    link: {
      id: message.link.id,
      slug: message.link.slug,
      domain: message.domain,
    },
  };
}
