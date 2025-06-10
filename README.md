# Chromaverse: AI Art & Music Workshop
Chromaverse is a full-stack web application designed as a creative suite where users can generate unique AI-powered art and music from text prompts. It features a secure, user-specific environment and a personal gallery to save and revisit all creations.

(Note: You can replace this link with a screenshot of your own application!)

Features
Dual AI Generation Modes: Seamlessly switch between generating visual art and composing audio tunes.
User Authentication: Secure user registration and login system using JWT (JSON Web Tokens) for session management.
Personalized History Gallery: All user creations are automatically saved to their account and displayed in a personal, scrollable history panel.
Interactive UI: A modern, fully responsive 3-column dashboard built with React that provides an excellent user experience on both desktop and mobile devices.
Mock "Forgot Password": A functional UI and API endpoint demonstrating the workflow for password recovery.
RESTful API Backend: A robust backend built with Python and FastAPI to handle user data, AI model communication, and content delivery.
Technical Stack
Frontend: React.js JavaScript (ES6+) CSS3 (Grid, Flexbox) Vite
Backend: Python 3 FastAPI SQLAlchemy Uvicorn
Database: SQLite
AI Model APIs: Hugging Face Inference API Replicate API
Authentication: JWT (JSON Web Tokens) Passlib (bcrypt)
Version Control: Git GitHub
Local Setup & Installation
To run this project on your local machine, follow these steps.

Prerequisites
Python 3.8+
Node.js and npm
1. Clone the Repository
Bash

git clone https://github.com/ashita1512/Chromaverse.git
cd Chromaverse
2. Backend Setup
First, set up the Python backend server.

Bash

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install all required Python packages
pip install -r requirements.txt

# Create the .env file for your API keys
touch .env
Now, open the .env file and add your API keys:

HUGGINGFACE_API_KEY="hf_..."
REPLICATE_API_TOKEN="r8_..."
3. Frontend Setup
In a new, separate terminal, set up the React frontend.

Bash

# Navigate to the frontend directory
cd frontend

# Install all required Node packages
npm install
4. Running the Application
You need to have both servers running at the same time.

Terminal 1 (Backend): From the main Chromaverse directory, run:
Bash

uvicorn main:app --reload
Terminal 2 (Frontend): From the frontend directory, run:
Bash

npm run dev
The application will be available at http://localhost:5173.

Future Improvements
This project has a solid foundation. Future features planned in the GitHub Issues include:

Video Generation Module: Adding a third creative mode for text-to-video.
Production-Ready Password Reset: Integrating a real email service like SendGrid.
Enhanced Token Handling: Automatically logging out users when their session token expires.
