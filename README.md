# ⚡️ Life OS: The Ultimate Productivity Sanctuary

Welcome to **Life OS** — a hyper-focused, beautifully designed productivity command center. Built with a stunning "Neo-Brutalist" design language, this application isn't just a place to check off tasks; it is a dynamic ecosystem designed to help you build the best version of yourself.

At the core of Life OS is an interactive, animated AI companion (inspired by the Eilik robot) that sits on your desk, breathes, dances, and actively monitors your focus sessions, transforming productivity from a tedious chore into a highly engaging, gamified experience.

---

## ✨ Features

Life OS is packed with powerful features seamlessly integrated into a single unified dashboard:

- **🤖 Interactive Focus Room (Pomodoro):** A stunning, distraction-free environment governed by your very own animated desk robot. The robot dynamically follows your cursor, reacts to your specific focus sessions, gets angry if you become distracted, and celebrates exuberantly when you complete your deep work.
- **✅ Intelligent Task Management:** More than just a standard to-do list. Organize, prioritize, and crush your daily objectives with immensely satisfying micro-interactions, distinct hover states, and clear visual feedback.
- **🌌 The Sanctuary:** Your personal digital zen-garden. A place reserved entirely to review your overarching goals, deeply reflect on your progress, and recenter yourself mentally before diving back into intense deep work.
- **📈 Advanced Analytics (The Control Center):** Visualize your productivity objectively. Track your cumulative focus hours over time, deeply analyze your task completion rates, and easily identify your peak performance states and optimal working hours.
- **🎨 "Retro-Digital Forge" Aesthetic:** A highly intentional Neo-Brutalist design language. Featuring thick borders, crisp offset drop-shadows, curated cream/charcoal color palettes, and fluid custom cursors to make tracking your life an absolute joy.

---

## 🔐 Authentication Ecosystem

Security and personalization are at the forefront of the app. We have deeply integrated **Clerk Authentication** to handle all user identity flawlessly:

- **Seamless Onboarding:** Authenticate securely in seconds using Google, GitHub, or traditional Email/Password login flows.
- **Protected Ecosystem:** The entire application (Dashboard, Tasks, Settings, Sanctuary) is strictly gated. Your productivity data remains entirely private, and unauthenticated users are seamlessly and beautifully redirected to our custom-designed sign-in portals.
- **Session Management:** Fluid transitions between active and idle states, ensuring you never lose your progress while staying secure over long focus sessions or breaks.

---

## 💻 Local Installation

Do you want to host Life OS on your own machine or contribute to the project? Follow these exact steps to get your local environment running perfectly in minutes.

### 1. Clone the Repository
Open your terminal and clone the repository to your local machine:
```bash
git clone https://github.com/your-username/life-os.git
cd life-os
```

### 2. Install Dependencies
Life OS is built on a modern JavaScript ecosystem within a monorepo structure. Run the following command to install all necessary packages across the entire workspace simultaneously:
```bash
npm install
```

### 3. Environment Variables Setup
You will need to securely connect the application to your authentication provider (Clerk) and your database. Navigate to the web application directory and duplicate the environment template:
```bash
cd apps/web
cp .env.example .env
```
Open the newly created `.env` file in your editor of choice and fill in your Clerk API Keys and Database URLs:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
DATABASE_URL=your_database_url
```

### 4. Fire Up the Development Server
With your environment variables configured, start the complete development server from the application directory:
```bash
npm run dev
```
Your Life OS is now alive! Open your browser and navigate to [http://localhost:3000](http://localhost:3000) and watch the robot wake up.

---

## 🛠 How to Customize

Life OS is fundamentally built to logically evolve with you. The design system is strictly tokenized, meaning you can radically change the look and feel of the entire application by modifying a central configuration:

- **Global Theming:** Head into `apps/web/src/app/globals.css`. You'll quickly find root CSS variables fundamentally controlling every aspect of the app (`--bg-1`, `--accent-mint`, `--text-0`). By simply changing these values, beautiful new custom color themes cascade safely across the entire ecosystem instantly.
- **Robot Behaviors:** The Eilik companion's physics and logic are fully exposed in the Pomodoro room dependencies. You can easily adjust its action interval triggers, speed up or slow down its animations, and introduce new custom "moods" simply by tweaking the React interval timers within `page.tsx`.
- **Feature Toggles:** Our component architecture relies on modular imports. If you want to disable an entire page or widget (like turning off Analytics), simply comment out the components inside the generic `AppShell` or router layout to instantly clean up your specific environment.

---

*“Discipline is the bridge between goals and accomplishment.” — Jim Rohn* 
*(Life OS is the vehicle that gets you across it.)*
