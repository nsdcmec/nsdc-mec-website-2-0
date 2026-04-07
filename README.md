# NSDC MEC Website 2.0

Official repository for the National Students Data Corps (NSDC) MEC Chapter website. 

This project is a Server-Side Rendered (SSR) application built with Astro and SolidJS. It is designed to be configured almost entirely via a Postgres database. 

## Design Constraints & Architecture

The architecture was chosen to solve specific environmental constraints, primarily the difficulty and infrequency of deploying code to the college server.

1. **Database-Driven Configuration**: Because deployments are rare, content, theme colors, and page layouts are managed via the database. This allows the website to evolve without pushing new code.
2. **Server-Side Rendering (SSR)**: The server fetches data and renders the HTML before sending it to the client. There are no client-side loading spinners.
3. **SolidJS**: Used for interactive components (carousels, dropdowns) to keep JavaScript bundle sizes as small as possible.
4. **Google Forms Integration**: Event registrations and data collection use embedded Google Forms. This removes the need for custom form validation, rate limiting, and attendee database schemas.

## Core Mechanisms

### In-Memory Data Singleton
To prevent latency on page navigation, the Node server fetches all required tables (Events, Teams, Resources, Config) on startup and holds them in memory. Data access during rendering is immediate.

### Middleware HTML Caching
The `middleware.ts` file intercepts requests and caches the final rendered HTML strings. Subsequent visits are served from RAM with a `304 Not Modified` or `HIT` header, reducing CPU load.

### Cache Revalidation
When the database is updated, a POST request is sent to `/api/reset.ts?key=SECRET`. This clears the memory cache and refetches the database, updating the live site immediately without a server restart. This endpoint has a 10-second cooldown.

### HTML Injection (Intentional XSS)
Astro's `set:html` is used to inject raw HTML directly from the database for specific slots. 
* **Security Context**: The site has no user accounts, sessions, or sensitive user data. We accept the risk of XSS to allow maintainers to inject `<style>`, `<script>`, or `<iframe>` tags directly from the database when custom layouts are needed.

## Configuration Guide

The website's UI reacts dynamically to records in the database.

### Theme & Global Configurations
* **Themes**: CSS variables (like `--bg-0`, `--primary`) can be overridden dynamically using the `theme_colors` JSON in the `site_config` table.
* **Injection Slots**: You can inject HTML globally using `top_html` (dismissible top banner), `hero_slot` (under the hero section), or `footer_slot`.

### Home Page
The home page is constructed using keys in the `site_config` table:
* `hero` & `hero-main`: Controls the top section text and media (image, video, or animation variants like `data-stream`).
* `about`: Configures the established year, member counts, and quotes.
* `team-main`: Controls the video/image carousel highlighting core team members.

### Events Precedence
Events are calculated as `Upcoming`, `Happening`, or `Past` based on the current time versus their `start_date` and `end_date`.
1. **Report Precedence**: If `report_url` is populated, the event is marked as concluded. The main button changes to "Read Report", overriding registration links.
2. **Registration**: If no report exists and the event is Upcoming/Happening, the button uses the `link` field.
3. **Past Event**: If the event is in the past and has no report, the button is hidden and replaced with "Event Ended".

### Short Links & Routes
The `short_links` table generates custom URLs (e.g., `nsdcmec.com/register`).
* `redirect`: Standard 307 HTTP redirect.
* `iframe`: Embeds the target URL across the full viewport.
* `gform`: Same as iframe, but appends `embedded=true` to force Google Forms into an embeddable UI.
* `resource-page`: Generates a library page, organizing items by `resource_type`.

### Error Pages
* **404 Page**: Renders if a requested slug or event is not found.
* **500 Page**: If the database is unreachable (e.g., Neon Postgres cold starts), the server retries 3 times. If all retries fail, it renders a custom `500.astro` page featuring cycling quotes, keeping the user on a branded page rather than a browser error.

## Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd nsdc-mec-website-2-0
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:pass@host/db_name?sslmode=require"
   CACHE_RESET_KEY="your-secret-key"
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Deployment

The project uses Astro's `@astrojs/node` adapter in `standalone` mode. 

**Building and Starting:**
```bash
npm run build
npm run start
```

**College Server Deployment:**
When deploying to the college VPS, use the provided Docker Compose setup. 

## Design Decisions

### Why Astro?
The choice of Astro over alternatives like Next.js or Vanilla React is driven by the need for low overhead and rapid initial load times.
* **Zero JS by Default**: Astro removes all framework code from the final HTML unless explicitly requested. This means our standard content pages ship with zero JavaScript, making them incredibly lightweight.
* **Server-Side Rendering (SSR)**: Astro allows us to query our in-memory data store on the server and send a fully constructed HTML document to the browser. There are no client-side API requests or skeleton loading screens required.
* **Middleware Capabilities**: Astro's middleware API provides the exact hooks needed to implement our custom HTML caching layer, allowing the dynamic Node server to mimic the speed of a static file server.

### Why SolidJS?
While Astro handles the static HTML, certain components (like the event filtering system, dropdowns, and the team carousel) require client-side interactivity. We chose SolidJS for these "islands" instead of React or Vue.
* **No Virtual DOM**: SolidJS compiles its templates directly to real DOM nodes, skipping the memory-intensive Virtual DOM diffing process used by React.
* **Microscopic Bundle Sizes**: Because Solid relies on fine-grained reactivity (signals) rather than shipping a heavy framework runtime, the JavaScript sent to the browser is significantly smaller. In our application, interactive islands typically require less than 10kb of JavaScript.
* **Familiar Syntax**: SolidJS uses JSX, which keeps the development experience similar to React but yields much better performance metrics.
