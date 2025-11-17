# Finlay Brewer International Landing Page

Landing page for Finlay Brewer International to generate leads for property buyers interested in Nice, France.

## Tech Stack

- **Node.js** - Server runtime
- **Express.js** - Web framework
- **EJS** - Template engine
- **HTML/CSS/JavaScript** - Frontend technologies

## Project Structure

```
├── public/
│   ├── css/          # Stylesheets
│   ├── js/           # JavaScript files
│   └── images/       # Image assets
├── views/
│   ├── partials/     # Reusable EJS components
│   └── index.ejs     # Main landing page template
├── routes/           # Route handlers
├── config/           # Configuration files
├── middleware/        # Custom middleware
├── server.js         # Main server file
└── package.json      # Dependencies

```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Development

- Run `npm start` for production mode
- Run `npm run dev` for development mode with auto-reload (nodemon)

## Managing Property Content

The landing page reads property data from `public/data/properties.json`. Each property entry controls both the hero carousel and the property grid.

### Adding a New Property

1. **Images**
   - Create a new folder under `public/images/Properties/`.
   - Add at least one image named `1.jpg`. This is the image that will be used everywhere.
   - (Optional) Add more numbered images for future use.

2. **Property Data**
   - Open `public/data/properties.json`.
   - Duplicate an existing object and update the fields:
     - `id`: unique string (e.g. `"property-12"`).
     - `title`: marketing headline.
     - `type`: e.g. `"villa"`, `"apartment"`, `"investment"`.
     - `price`: numeric value *without* currency symbols (e.g. `1350000`).
     - `location`: free text (e.g. `"Nice, France"`).
     - `area`, `lotSize`: surface in m² (use `null` if unknown).
     - `beds`, `baths`, `rooms`, `parking`: integers (use `null` if unknown).
     - `featured`: `true` to show the “Featured” badge.
     - `new`: `true` to show the “New” badge.
     - `hero`: `true` to include the property in the hero carousel.
     - `image`: path to the main image (e.g. `"/images/Properties/12/1.jpg"`).
     - `description`: full marketing copy.

3. **Save and Refresh**
   - Save the JSON file and reload the page. The new property will appear automatically.

> **Tip:** Keep the JSON ordered by price or priority so the most important listings appear first.


