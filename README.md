# 🛡️ TrustVibe

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)

**TrustVibe** is a modern, full-stack web application designed to facilitate real-time store ratings and dynamic user engagement. It leverages a rigorous Role-Based Access Control (RBAC) mechanism to securely partition functionalities into dedicated interactive dashboards for Consumers, Store Owners, and System Administrators.

The application boasts a premium, high-fidelity UI constructed with **React and TailwindCSS**, powered securely by an **Express.js API** backend, with strict database relations managed via **Prisma ORM**.

---

## 🚀 Features & Role Capabilities

TrustVibe utilizes a Single Global Login architecture. When a user authenticates, they are securely intercepted by a gateway and inherently dynamically mapped directly to their specialized dashboard.

### 👑 System Administrator (`/admin`)
- **Bird's Eye Analytics:** Observe real-time statistics covering the Total Users, Registered Stores, and Total Aggregated Ratings across the entire ecosystem.
- **Universal Provisioning Engine:** Add and register new Normal Users, new independent Store Owners, or provision auxiliary System Admin accounts directly from the UI.
- **Dynamic Data Grid:** High-speed data tables to examine arrays of Normal Users or segregated Store Listings. 
- **Sort and Filter:** Powerful, native column sorting coupled with rapid fuzzy-searching to pinpoint members across the grid.
- **Deep Mutability:** Seamlessly **Edit** registered profiles, or **Delete** nested hierarchies universally across all member types via intuitive UI modals.

### 🏬 Store Owner (`/store`)
- **Direct Feedback Loop:** Provides enterprise owners a secure, isolated telemetry view of every single consumer participating with their store.
- **Automated Averages:** Dynamic algorithms natively calculate and update the total Average Rating of the store based strictly on consumer engagements in real-time.

### 🧑‍💻 Normal User (`/home`)
- **Interactive Store Catalogs:** Empathetic, modern UI cards generating a marketplace catalog showcasing all newly registered stores dynamically.
- **Live Search Mechanics:** Discover stores instantly filtering via Name or Regional Address logic.
- **Active Contribution:** Users engage via immersive, animated **1-to-5 star modal systems** allowing smooth rating drops—along with capabilities to seamlessly overwrite/adjust their previously submitted reviews on demand.

---

## 🛠⚙️ Tech Stack & Architecture

* **Frontend Framework:** `React 18` engineered with `Vite` bundling capabilities.
* **Component Styling:** Complete utility-first approach utilizing `TailwindCSS` stacked with `lucide-react` for premium iconography.
* **Backend Runtime:** Cleanly abstracted, modular `Express.js` routes running fully typed via `TypeScript (ts-node)`.
* **State Management:** Secure Sessioning using state-of-the-art JWT (`jsonwebtoken`) mapped over React `AuthContext` Providers.
* **Database Management:** Abstraction handled by `Prisma ORM` built perfectly scalable to bridge seamlessly between environments like MySQL, PostgreSQL, or SQLite.

---

## 🚦 Local Setup & Infrastructure

You can easily instantiate the entire TrustVibe ecosystem within minutes using the steps below. 

### Backend Initialization
1. Change into the backend directory:
   ```bash
   cd backend
   npm install
   ```
2. **Database Engine Note**: TrustVibe ships natively with SQLite fallback activated for instant-deployment zero-configuration testing. However, the schema inherently supports robust providers like **MySQL/PostgreSQL**. To activate MySQL:
   - Execute `docker-compose up -d` in the root folder to boot a clean local MySQL container.
   - Jump into `backend/prisma/schema.prisma` and actively flip `provider = "sqlite"` into `provider = "mysql"`.
   - Dive into `backend/.env` and replace it with: `DATABASE_URL="mysql://root:root@localhost:3306/trustvibe"`.
   - Run `npx prisma db push` to synchronize.
3. **Database Pre-seeding**: Populate dynamic testing data securely safely:
   ```bash
   node prisma/seed.js
   ```
4. **Boot Backend Development Server**:
   ```bash
   npm run dev
   ```

### Frontend Initialization
1. Change into the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. **Boot Frontend Development Server:**
   ```bash
   npm run dev
   ```
3. Your fully functional platform is now actively hosted at **http://localhost:5175**!

---

## 🗄️ Interactive Database Visualizer

Because TrustVibe incorporates Prisma as its driving force, it ships with a powerful zero-query localized Graphical DB explorer natively!

To interface and verify backend datastore entries directly through the web:
```bash
npx prisma studio
```
This maps directly to **http://localhost:5555**, allowing you point-and-click traversal of all relational architecture cleanly.

---

## 🛡️ Administrative Seed Credentials

Below are the base keys securely pre-supplied in the global seeder specifically for instantaneous feature evaluation purposes!

**System Administrator Login:**
- **Email:** `admin@trustvibe.com`
- **Password:** `Admin@123`

**Normal User Logins:**
- **Email:** `tannikhil473@gmail.com`
- **Password:** `Nikhi@15`
- **Email:** `nikhil@gmail.com`
- **Password:** `Nikhi@12345`