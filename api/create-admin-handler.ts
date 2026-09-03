import { createAdminUser } from './create-admin';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Security check - require a secret token
  const authHeader = req.headers.authorization;
  const adminToken = req.headers['x-admin-token'];
  
  if (adminToken !== process.env.ADMIN_TOKEN && authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    const result = await createAdminUser(email, password, name);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
