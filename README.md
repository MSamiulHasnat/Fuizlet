# Fuizlet

A Quizlet clone built with HTML, CSS, and JavaScript.

## Features

- 📚 Create and study flashcard sets
- 🧠 Learn mode with multiple-choice questions
- ✍️ Test mode with written answers
- 🎮 Match game with timer
- 📁 Organize sets into folders
- 👥 Groups for collaborative studying

## Quick Start (Local Mode)

Just open `index.html` in your browser. Data is saved locally in your browser.

## Cloud Mode (Multi-User)

To enable cloud sync and multi-user support:

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL in `supabase-schema.sql` in the Supabase SQL Editor
4. Copy your Project URL and anon key
5. Edit `js/supabase-config.js` and replace the placeholder values
6. Deploy to GitHub Pages (see below)

## Deploy to GitHub Pages

1. Create a GitHub repository
2. Push this code to the repository
3. Go to Settings → Pages
4. Set Source to "Deploy from a branch" and select `main`
5. Your site will be live at `https://yourusername.github.io/repository-name`

## Tech Stack

- HTML5
- CSS3 (vanilla, no frameworks)
- Vanilla JavaScript
- Supabase (optional, for cloud sync)

## License

MIT
