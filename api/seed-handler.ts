import { seedDatabase } from './seed';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Simple security check - require a secret token
  const authHeader = req.headers.authorization;
  const seedToken = req.headers['x-seed-token'];
  
  if (seedToken !== process.env.SEED_TOKEN && authHeader !== `Bearer ${process.env.SEED_TOKEN}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const result = await seedDatabase();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
