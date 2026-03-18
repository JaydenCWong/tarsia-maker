# Tarsia Maker — LaTeX Puzzle Generator

A modern, web-based tool for creating dynamic Tarsia-style geometric puzzles. This generator explicitly supports rendering advanced LaTeX mathematical notation directly onto the puzzle pieces, allowing educators to create rich math matching games!

## Features
- **Dynamic Geometric Grids:** Create interlocking Triangle and Hexagon puzzles.
- **Embedded LaTeX Support:** Wrap properties in `$ ... $` syntax (e.g., `$\sqrt{144}$`, `$\frac{1}{2}$`) to have them rendered crisply on the edges using KaTeX.
- **Robust PDF Export:** Generates sharp, vector-quality PDF documents that are print-ready.
- **Smart Rotation:** Uses advanced mapping to perfectly format LaTeX along diagonal shapes without falling back to basic ASCII text.
- **Data Persistence:** Keeps your questions and answers saved locally when switching puzzle shapes.

## Getting Started

### Prerequisites
Make sure you have Node.js and NPM installed.

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd tarsia_maker
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

## Tech Stack
- Frontend Framework: React (via Vite)
- UI Styling: Vanilla CSS (Dark Mode Design System)
- Math Engine: KaTeX
- PDF Engine: jsPDF + svg2pdf.js + html2canvas

## Future Work
- **Smart Text Formatting:** Implement automatic font size scaling and multi-line text wrapping depending on the length of the question/answer text to gracefully handle very long inputs on the puzzle edges.

## Deployment
This project is configured and ready to be deployed as a static site to Cloudflare Pages (or similar providers like Vercel/Netlify). The build output goes strictly into the `/dist` directory.
