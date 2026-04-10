import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to authenticate
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, address } = req.body;
    
    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ error: 'Name must be between 20 and 60 characters' });
    }
    if (!address || address.length > 400) {
      return res.status(400).json({ error: 'Address must be max 400 characters' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        role: 'NORMAL_USER'
      }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.post('/api/auth/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid current password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// --- SYSTEM ADMIN ROUTES ---
app.get('/api/admin/dashboard', authenticate, async (req: Request, res: Response) => {
  if (req.user.role !== 'SYSTEM_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const totalUsers = await prisma.user.count({ where: { role: { not: 'STORE_OWNER' } } });
    const totalStores = await prisma.user.count({ where: { role: 'STORE_OWNER' } });
    const totalRatings = await prisma.rating.count();

    res.json({ totalUsers, totalStores, totalRatings });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.post('/api/admin/users', authenticate, async (req: Request, res: Response) => {
  if (req.user.role !== 'SYSTEM_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const { name, email, password, address, role } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        role: role || 'NORMAL_USER'
      }
    });

    res.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.put('/api/admin/users/:id', authenticate, async (req: Request, res: Response) => {
  if (req.user.role !== 'SYSTEM_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const id = req.params.id as string;
    const { name, email, address, role, password } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== id) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const dataToUpdate: any = { name, email, address, role };
    
    // Only update password if provided
    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    res.json({ success: true, user: { id: updatedUser.id, name: updatedUser.name, role: updatedUser.role } });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.delete('/api/admin/users/:id', authenticate, async (req: Request, res: Response) => {
  if (req.user.role !== 'SYSTEM_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const id = req.params.id as string;
    
    // First delete associated ratings as relations might prevent deletion
    await prisma.rating.deleteMany({
      where: {
        OR: [
          { userId: id },
          { storeId: id }
        ]
      }
    });

    await prisma.user.delete({ where: { id } });
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.get('/api/admin/stores', authenticate, async (req: Request, res: Response) => {
  if (req.user.role !== 'SYSTEM_ADMIN') return res.status(403).json({ error: 'Forbidden' });

  try {
    const stores = await prisma.user.findMany({
      where: { role: 'STORE_OWNER' },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        ratingsReceived: {
          select: { value: true }
        }
      }
    });

    const storesWithRating = stores.map((store: any) => {
      const sum = store.ratingsReceived.reduce((acc: number, r: any) => acc + r.value, 0);
      const avg = store.ratingsReceived.length ? (sum / store.ratingsReceived.length).toFixed(2) : 'No rating';
      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        rating: avg,
        ratingCount: store.ratingsReceived.length
      };
    });

    res.json(storesWithRating);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.get('/api/admin/users', authenticate, async (req: Request, res: Response) => {
  if (req.user.role !== 'SYSTEM_ADMIN') return res.status(403).json({ error: 'Forbidden' });

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        ratingsReceived: {
          select: { value: true }
        }
      }
    });

    const enrichedUsers = users.map((user: any) => {
      let result = { ...user };
      if (user.role === 'STORE_OWNER') {
        const sum = user.ratingsReceived.reduce((acc: number, r: any) => acc + r.value, 0);
        result.rating = user.ratingsReceived.length ? (sum / user.ratingsReceived.length).toFixed(2) : 'No rating';
      }
      delete result.ratingsReceived;
      return result;
    });

    res.json(enrichedUsers);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// --- NORMAL USER ROUTES ---
app.get('/api/stores', authenticate, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const whereClause: any = { role: 'STORE_OWNER' };
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { address: { contains: search as string } }
      ];
    }

    const stores = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        address: true,
        ratingsReceived: {
          select: { value: true }
        }
      }
    });

    let myRatingsMap: Record<string, number> = {};
    if (req.user.role === 'NORMAL_USER') {
      const myRatings = await prisma.rating.findMany({
        where: { userId: req.user.id }
      });
      myRatingsMap = myRatings.reduce((acc: Record<string, number>, curr: any) => {
        acc[curr.storeId] = curr.value;
        return acc;
      }, {});
    }

    const storesWithRating = stores.map((store: any) => {
      const sum = store.ratingsReceived.reduce((acc: number, r: any) => acc + r.value, 0);
      const avg = store.ratingsReceived.length ? (sum / store.ratingsReceived.length).toFixed(2) : 'No rating';
      return {
        id: store.id,
        name: store.name,
        address: store.address,
        overallRating: avg,
        ratingCount: store.ratingsReceived.length,
        myRating: myRatingsMap[store.id] || null
      };
    });

    res.json(storesWithRating);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.post('/api/ratings', authenticate, async (req: Request, res: Response) => {
  if (req.user.role !== 'NORMAL_USER') return res.status(403).json({ error: 'Forbidden' });

  try {
    const { storeId, value } = req.body;
    if (value < 1 || value > 5) return res.status(400).json({ error: 'Rating must be 1 to 5' });

    const store = await prisma.user.findUnique({ where: { id: storeId } });
    if (!store || store.role !== 'STORE_OWNER') {
       return res.status(404).json({ error: 'Store not found' });
    }

    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId: req.user.id,
          storeId: storeId
        }
      }
    });

    if (existingRating) {
      await prisma.rating.update({
        where: { id: existingRating.id },
        data: { value }
      });
    } else {
      await prisma.rating.create({
        data: {
          value,
          userId: req.user.id,
          storeId
        }
      });
    }

    res.json({ success: true, message: 'Rating submitted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// --- STORE OWNER ROUTES ---
app.get('/api/store-dashboard', authenticate, async (req: Request, res: Response) => {
  if (req.user.role !== 'STORE_OWNER') return res.status(403).json({ error: 'Forbidden' });

  try {
    const ratings = await prisma.rating.findMany({
      where: { storeId: req.user.id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const sum = ratings.reduce((acc: number, r: any) => acc + r.value, 0);
    const averageRating = ratings.length ? (sum / ratings.length).toFixed(2) : 'No rating';

    res.json({ averageRating, totalRatings: ratings.length, ratings });
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
