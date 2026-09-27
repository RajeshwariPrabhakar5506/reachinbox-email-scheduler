import { Request, Response } from 'express';
import { esClient } from '../config/elastic';

export async function searchEmails(req: Request, res: Response) {
  const { query, userId } = req.query;

  try {
    const response = await esClient.search({
      index: 'emails',
      query: {
        bool: {
          must: [
            { match: { userId: userId as string } },
            {
              multi_match: {
                query: query as string,
                fields: ['recipient', 'subject', 'body', 'senderEmail'],
              },
            },
          ],
        },
      },
    });

    const hits = response.hits.hits.map((hit) => hit._source);
    return res.json({ results: hits });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}