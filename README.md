# WellnessGarden 🌸

**Your AI-powered spiritual companion for mental well-being.**

WellnessGarden is a unique mental health application that blends ancient wisdom with modern, evidence-based wellness techniques. At its heart is a sophisticated AI guide embodying the persona of **Lord Krishna**, offering compassionate and profound guidance rooted in the principles of Sanatana Dharma.

This is more than just a chatbot. It's a holistic toolkit designed to help users navigate their personal struggles (their "Kurukshetra"), understand their actions (Karma), and find inner peace (Shanti).

---

## ✨ Core Features

*   **The Divine Guide**: Converse with an AI persona of Lord Krishna, who provides wisdom and comfort based on sacred texts like the Bhagavad Gita.
*   **Hybrid Intelligence (RAG)**: The AI's responses are powered by a **Retrieval-Augmented Generation (RAG)** system. It synthesizes its innate wisdom with a rich, custom knowledge base that includes:
    *   Modern wellness concepts (`wellness-info.md`).
    *   Spiritual teachings from the Bhagavad Gita (`Bhagwad_Gita.csv`).
    *   Practical advice from mental health FAQs and community-sourced data.
*   **Journaling with AI Insights**: A private space for users to write journal entries and receive a single, profound insight from the AI to aid in self-reflection.
*   **Mood & Feeling Check-ins**: Quickly log your mood and current thoughts to receive a relevant, encouraging message.
*   **Integrated Wellness Toolkit**: The AI can recognize a user's problem and suggest practical, guided exercises for immediate relief, such as:
    *   `box-breathing` (for anxiety and stress)
    *   `5-4-3-2-1-grounding` (for feeling overwhelmed)
    *   `thought-challenging` (for negative thought patterns)
    *   And more.
*   **Local LLM Ready**: Includes built-in (though currently secondary) support for a local Ollama instance for offline or privacy-focused interactions.
*   **Secure & Private**: User data, including journal entries and mood logs, is securely managed using Supabase.

## ⚙️ How It Works: Architecture

WellnessGarden is built on a modern, decoupled architecture:

*   **Frontend**: A reactive web application built with **Vite** and **TypeScript**.
*   **AI Core (`src/lib/ai.ts`)**: Manages the interaction logic, prompt engineering, and communication with the AI models.
*   **RAG Engine (`src/lib/rag.ts`)**: Fetches, parses, and ranks contextual information from various local data files (`.md` and `.csv`) to provide the AI with relevant, domain-specific knowledge for its responses.
*   **AI Models**:
    *   **Primary**: Google Gemini Pro API.
    *   **Secondary/Local**: Ollama for local model inference.
*   **Backend (`src/lib/supabase.ts`)**: Supabase handles user authentication, database storage (profiles, journal entries, mood logs), and other backend services.

## 🚀 Getting Started

Follow these steps to get your local development environment running.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn
*   A **Google Gemini API Key**. You can get one from Google AI Studio.
*   A **Supabase** project for database and authentication.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd project-bolt-sb1-rk4qornl/project
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**

    Create a `.env` file in the root of the project directory (`/project`) and add your credentials.

    ```env
    # .env

    # Your Supabase Project URL
    VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co

    # Your Supabase Anon Key
    VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

    # Your Google Gemini API Key
    VITE_GEMINI_API_KEY=<your-gemini-api-key>

    # (Optional) URL for your local Ollama instance
    VITE_OLLAMA_URL=http://localhost:11434
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application should now be running on `http://localhost:5173`.

## 📂 Project Structure

```
src
├── components
│   └── data/         # CSV files for the RAG system
├── lib
│   ├── ai.ts         # Core AI logic, prompt generation, API calls
│   ├── rag.ts        # Retrieval-Augmented Generation engine
│   ├── supabase.ts   # Supabase client and type definitions
│   └── wellness-info.md # Markdown data for the RAG system
├── store
│   └── useMoodStore.ts # State management for user mood
└── ... (UI components, pages, etc.)
```

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, improvements, or bug fixes, please feel free to:

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

> "The wise grieve neither for the living nor for the dead. There was never a time when I did not exist, nor you, nor all these kings; nor in the future shall any of us cease to be." - Bhagavad Gita 2.11-12