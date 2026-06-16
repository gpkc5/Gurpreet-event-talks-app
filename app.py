import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_content(html_content):
    """
    Cleans HTML and extracts structured update list from the release notes content.
    Each entry typically has headings (e.g., Feature, Issue, Changed) and details.
    """
    # Regex to find <h3>Type</h3> followed by its details (up to the next <h3> or end)
    pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=(?:<h3>|$))', re.DOTALL | re.IGNORECASE)
    matches = pattern.findall(html_content)
    
    updates = []
    for match in matches:
        type_str = match[0].strip()
        body_html = match[1].strip()
        
        # Extract plain text for tweeting
        # Remove script and style elements
        clean_text = re.sub(r'<(script|style).*?>.*?</\1>', '', body_html, flags=re.DOTALL | re.IGNORECASE)
        # Strip HTML tags
        clean_text = re.sub(r'<[^>]+>', '', clean_text)
        # Unescape HTML entities (e.g., &amp; -> &, &quot; -> ")
        import html
        clean_text = html.unescape(clean_text)
        # Normalize whitespace
        clean_text = ' '.join(clean_text.split())
        
        # Ensure we don't have empty content
        if clean_text:
            updates.append({
                'type': type_str,
                'html': body_html,
                'text': clean_text
            })
            
    # If no <h3> headings found, return the whole content as a single 'Update'
    if not updates:
        import html
        clean_text = html.unescape(re.sub(r'<[^>]+>', '', html_content))
        clean_text = ' '.join(clean_text.split())
        updates.append({
            'type': 'Update',
            'html': html_content,
            'text': clean_text
        })
        
    return updates

def parse_iso_date(date_str):
    """Parses ISO date string and returns a formatted readable date."""
    try:
        # e.g., 2026-06-15T00:00:00-07:00
        # Split timezone offset if present
        clean_date = date_str[:10] # "YYYY-MM-DD"
        dt = datetime.strptime(clean_date, "%Y-%m-%d")
        return dt.strftime("%b %d, %Y")
    except Exception:
        return date_str

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        # Fetch RSS Feed
        req = urllib.request.Request(
            FEED_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BigQueryReleaseNotesHub/1.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        
        # Extract feed entries
        entries = []
        entry_tag = "{http://www.w3.org/2005/Atom}entry"
        
        for entry in root.findall(entry_tag):
            title = entry.find("{http://www.w3.org/2005/Atom}title").text
            updated_raw = entry.find("{http://www.w3.org/2005/Atom}updated").text
            link_node = entry.find("{http://www.w3.org/2005/Atom}link")
            link_href = link_node.attrib.get('href', '') if link_node is not None else ''
            content_node = entry.find("{http://www.w3.org/2005/Atom}content")
            content_html = content_node.text if content_node is not None else ''
            
            # Parse individual update items
            parsed_updates = clean_html_content(content_html)
            formatted_date = parse_iso_date(updated_raw)
            
            entries.append({
                'title': title,
                'date': formatted_date,
                'raw_date': updated_raw,
                'link': link_href,
                'updates': parsed_updates
            })
            
        return jsonify({
            'status': 'success',
            'count': len(entries),
            'data': entries
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
