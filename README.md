# AI-Powered TRPG Game

An interactive text-based RPG game powered by OpenAI and Flux AI, built with Next.js 14 and TypeScript.

## 🎮 Features

- **AI Game Master**: OpenAI-powered dynamic storytelling and game progression
- **Visual Generation**: Real-time game scene visualization using Flux AI
- **Character Management**: Create and manage your unique characters
- **Multiple Game Modes**:
  - Dungeon Exploration
  - Town & Shop System
  - Labor System
  - Character Creation & Development

## 🛠 Tech Stack

### Core Technologies
- Next.js 14
- TypeScript
- MongoDB
- shadcn/ui
- Tailwind CSS

### AI Integration
- OpenAI API (Game Master)
- Flux AI (Image Generation)

### Authentication & Database
- NextAuth.js
- Auth0 Integration
- MongoDB

## 🏗 Project Structure

```
project/
├── app/
│   ├── api/         # API routes
│   ├── components/  # Reusable components
│   ├── models/      # MongoDB models
│   └── utils/       # Utility functions
├── lib/
│   ├── auth.ts      # Authentication configuration
│   └── db.ts        # Database configuration
└── public/          # Static assets
```

## 🚀 Getting Started

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```env
DATABASE_URL=your_mongodb_url
NEXTAUTH_SECRET=your_nextauth_secret
OPENAI_API_KEY=your_openai_api_key
FLUX_AI_API_KEY=your_flux_api_key
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

## 🎯 Current Features

- **Authentication System**: User registration and login using Auth0
- **Character System**: Create and manage game characters
- **Dungeon System**: Explore dungeons with AI-driven narratives
- **Town System**: Visit shops and interact with NPCs
- **Labor System**: Engage in work activities for rewards
- **Real-time Image Generation**: Dynamic scene visualization

## 📝 License

[MIT License](LICENSE)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Contact

[Your Contact Information]

---
Made with ❤️ and TypeScript