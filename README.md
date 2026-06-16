# BigQuery Release Notes Explorer & X Share Hub

A premium web application built using **Python Flask** and **plain vanilla HTML, CSS, and JavaScript** that fetches, parses, and displays Google Cloud BigQuery release notes. It allows you to select specific updates and easily draft, customize, and share them on X (Twitter).

---

## 🌟 Key Features

1. **Live XML RSS Fetching**: Parses the official Google Cloud BigQuery release notes Atom feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`) in real-time.
2. **Granular Update Splitting**: Splits daily release aggregates into individual items (e.g., Features, Issues, Changes, Deprecated) so you can interact with them one by one.
3. **Interactive Search & Filtering**:
   - Filter updates by type (Features, Issues, Changes, Deprecated).
   - Search updates dynamically via keywords or release dates.
4. **Animated Refresh Mechanism**: Includes a refresh button that triggers a background fetch, shows a spinning loader, updates the "Last Updated" timestamp, and reports status via animated toast notifications.
5. **Interactive X (Twitter) Composer Sidebar**:
   - **Card Selection**: Clicking any update card highlights it and loads it into the composer.
   - **Mock X Post Preview**: Shows a real-time post template resembling an X (Twitter) dark-mode UI.
   - **Smart Auto-Drafting**: Pre-populates the text area with a clean template, including the date, type, core update text, hashtags (`#GoogleCloud #BigQuery`), and a source documentation link.
   - **Real-Time Character Tracker**: Tracks character limits dynamically up to X's 280-character limit with a visual progress bar. Shows alerts if the text goes over.
   - **Intent Integration**: Automatically redirects you to the official X Web Intent (`https://x.com/intent/tweet`) with your edited text populated.
   - **Quick Copy**: Click a button to copy the drafted post to your clipboard.
6. **Modern Dark-Mode Aesthetics**: Built with a dark blue-grey visual system, glassmorphism, responsive columns, and CSS animations.

---

## 📁 Project Structure

- **[app.py](file:///D:/agy-cli-projects/bigquery-release-notes/app.py)**: Python Flask server. Fetches XML feed, parses Atom tags, splits updates, and serves them via JSON API.
- **[templates/index.html](file:///D:/agy-cli-projects/bigquery-release-notes/templates/index.html)**: Semantic, responsive HTML structure.
- **[static/css/style.css](file:///D:/agy-cli-projects/bigquery-release-notes/static/css/style.css)**: Custom stylesheet with glassmorphic cards, custom animations, alerts, and X post mockups.
- **[static/js/app.js](file:///D:/agy-cli-projects/bigquery-release-notes/static/js/app.js)**: Frontend logic for API fetching, in-memory searching, card selection, and composer utilities.
- **[requirements.txt](file:///D:/agy-cli-projects/bigquery-release-notes/requirements.txt)**: Documentation of python dependencies.

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
python -m pip install -r requirements.txt
```

### 2. Start the Server
Run the Flask server:
```bash
python app.py
```

### 3. Open in Browser
Open your browser and navigate to:
[http://127.0.0.1:5000](http://127.0.0.1:5000)
