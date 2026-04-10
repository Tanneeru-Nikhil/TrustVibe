"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
// Middleware to authenticate
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, address } = req.body;
        if (!name || name.length < 20 || name.length > 60) {
            return res.status(400).json({ error: 'Name must be between 20 and 60 characters' });
        }
        if (!address || address.length > 400) {
            return res.status(400).json({ error: 'Address must be max 400 characters' });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return res.status(400).json({ error: 'Email in use' });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                address,
                role: 'NORMAL_USER'
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(400).json({ error: 'Invalid credentials' });
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match)
            return res.status(400).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
app.post('/api/auth/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const match = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!match)
            return res.status(400).json({ error: 'Invalid current password' });
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });
        res.json({ success: true, message: 'Password updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
// --- SYSTEM ADMIN ROUTES ---
app.get('/api/admin/dashboard', authenticate, async (req, res) => {
    if (req.user.role !== 'SYSTEM_ADMIN')
        return res.status(403).json({ error: 'Forbidden' });
    try {
        const totalUsers = await prisma.user.count({ where: { role: { not: 'STORE_OWNER' } } });
        const totalStores = await prisma.user.count({ where: { role: 'STORE_OWNER' } });
        const totalRatings = await prisma.rating.count();
        res.json({ totalUsers, totalStores, totalRatings });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
app.post('/api/admin/users', authenticate, async (req, res) => {
    if (req.user.role !== 'SYSTEM_ADMIN')
        return res.status(403).json({ error: 'Forbidden' });
    try {
        const { name, email, password, address, role } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return res.status(400).json({ error: 'Email in use' });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
app.put('/api/admin/users/:id', authenticate, async (req, res) => {
    if (req.user.role !== 'SYSTEM_ADMIN')
        return res.status(403).json({ error: 'Forbidden' });
    try {
        const id = req.params.id;
        const { name, email, address, role, password } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== id) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        const dataToUpdate = { name, email, address, role };
        // Only update password if provided
        if (password && password.trim() !== '') {
            dataToUpdate.password = await bcryptjs_1.default.hash(password, 10);
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate
        });
        res.json({ success: true, user: { id: updatedUser.id, name: updatedUser.name, role: updatedUser.role } });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
app.delete('/api/admin/users/:id', authenticate, async (req, res) => {
    if (req.user.role !== 'SYSTEM_ADMIN')
        return res.status(403).json({ error: 'Forbidden' });
    try {
        const id = req.params.id;
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
app.get('/api/admin/stores', authenticate, async (req, res) => {
    if (req.user.role !== 'SYSTEM_ADMIN')
        return res.status(403).json({ error: 'Forbidden' });
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
        const storesWithRating = stores.map((store) => {
            const sum = store.ratingsReceived.reduce((acc, r) => acc + r.value, 0);
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
app.get('/api/admin/users', authenticate, async (req, res) => {
    if (req.user.role !== 'SYSTEM_ADMIN')
        return res.status(403).json({ error: 'Forbidden' });
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
        const enrichedUsers = users.map((user) => {
            let result = { ...user };
            if (user.role === 'STORE_OWNER') {
                const sum = user.ratingsReceived.reduce((acc, r) => acc + r.value, 0);
                result.rating = user.ratingsReceived.length ? (sum / user.ratingsReceived.length).toFixed(2) : 'No rating';
            }
            delete result.ratingsReceived;
            return result;
        });
        res.json(enrichedUsers);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
// --- NORMAL USER ROUTES ---
app.get('/api/stores', authenticate, async (req, res) => {
    try {
        const { search } = req.query;
        const whereClause = { role: 'STORE_OWNER' };
        if (search) {
            whereClause.OR = [
                { name: { contains: search } },
                { address: { contains: search } }
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
        let myRatingsMap = {};
        if (req.user.role === 'NORMAL_USER') {
            const myRatings = await prisma.rating.findMany({
                where: { userId: req.user.id }
            });
            myRatingsMap = myRatings.reduce((acc, curr) => {
                acc[curr.storeId] = curr.value;
                return acc;
            }, {});
        }
        const storesWithRating = stores.map((store) => {
            const sum = store.ratingsReceived.reduce((acc, r) => acc + r.value, 0);
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
app.post('/api/ratings', authenticate, async (req, res) => {
    if (req.user.role !== 'NORMAL_USER')
        return res.status(403).json({ error: 'Forbidden' });
    try {
        const { storeId, value } = req.body;
        if (value < 1 || value > 5)
            return res.status(400).json({ error: 'Rating must be 1 to 5' });
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
        }
        else {
            await prisma.rating.create({
                data: {
                    value,
                    userId: req.user.id,
                    storeId
                }
            });
        }
        res.json({ success: true, message: 'Rating submitted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
// --- STORE OWNER ROUTES ---
app.get('/api/store-dashboard', authenticate, async (req, res) => {
    if (req.user.role !== 'STORE_OWNER')
        return res.status(403).json({ error: 'Forbidden' });
    try {
        const ratings = await prisma.rating.findMany({
            where: { storeId: req.user.id },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        const sum = ratings.reduce((acc, r) => acc + r.value, 0);
        const averageRating = ratings.length ? (sum / ratings.length).toFixed(2) : 'No rating';
        res.json({ averageRating, totalRatings: ratings.length, ratings });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
//# sourceMappingURL=index.js.map