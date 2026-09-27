import { esClient } from '../config/elastic';

const INDEX_NAME = 'emails';

export async function initElasticIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: INDEX_NAME });
  if (!exists) {
    await esClient.indices.create({
      index: INDEX_NAME,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          userId: { type: 'keyword' },
          recipient: { type: 'text' },
          subject: { type: 'text' },
          body: { type: 'text' },
          senderEmail: { type: 'keyword' },
          status: { type: 'keyword' },
          scheduledAt: { type: 'date' },
          sentAt: { type: 'date' },
        },
      },
    });
  }
}

export async function indexEmailToElasticsearch(emailRecord: any): Promise<void> {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: emailRecord.id,
      document: emailRecord,
    });
  } catch (error) {
    console.error('Elasticsearch Indexing Error:', error);
  }
}