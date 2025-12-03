// Mapbox Access Token - REPLACE WITH YOUR TOKEN
mapboxgl.accessToken = 'pk.eyJ1IjoiYWR2YWl0LTEzMDYiLCJhIjoiY21pcHljbXc2MDg1bzNkczhuMXhpZGdtNCJ9.Ekm3ZBRqYuKwAKwma8H3lA';

// State
let allPlaces = [];
let map;
let markers = [];
let currentFilter = 'all';

// Mysore coordinates and bounds
const mysoreCenter = [76.6394, 12.2958];
const mysoreBounds = [
    [76.4, 12.1],  // Southwest
    [76.8, 12.5]   // Northeast
];

// Initialize map
function initMap() {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: mysoreCenter,
        zoom: 12,
        maxBounds: mysoreBounds,
        minZoom: 10
    });

    map.addControl(new mapboxgl.NavigationControl());
}

// Extract coordinates from Google Maps URL
async function extractCoordinates(url) {
    if (!url) return null;

    try {
        // Handle different Google Maps URL formats

        // Format 1: Direct coordinates (https://maps.google.com/?q=12.345,76.789)
        const coordMatch = url.match(/q=([-\d.]+),([-\d.]+)/);
        if (coordMatch) {
            return [parseFloat(coordMatch[2]), parseFloat(coordMatch[1])];
        }

        // Format 2: Place URL with coordinates (https://www.google.com/maps/place/.../@12.345,76.789)
        const placeMatch = url.match(/@([-\d.]+),([-\d.]+)/);
        if (placeMatch) {
            return [parseFloat(placeMatch[2]), parseFloat(placeMatch[1])];
        }

        // Format 3: Short URL (https://maps.app.goo.gl/xyz or https://goo.gl/maps/xyz)
        // Return null so we can geocode by place name
        if (url.includes('goo.gl')) {
            return null; // Will geocode by place name
        }

        return null;
    } catch (error) {
        console.error('Error extracting coordinates:', error);
        return null;
    }
}

// Geocode place name using Mapbox Geocoding API
async function geocodePlaceName(placeName) {
    try {
        const query = encodeURIComponent(`${placeName}, Mysore, Karnataka, India`);
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxgl.accessToken}&limit=1&bbox=${mysoreBounds[0][0]},${mysoreBounds[0][1]},${mysoreBounds[1][0]},${mysoreBounds[1][1]}`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            return data.features[0].center;
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

// Parse CSV and load places
async function loadPlaces() {
    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: async function(results) {
                const data = results.data;

                console.log(`CSV parsed: ${data.length} total rows`);
                console.log('First row:', data[0]);
                console.log('Column names:', results.meta.fields);

                // Process places in batches for better performance
                let batch = [];
                let skippedCount = 0;

                for (const row of data) {
                    if (!row.Name || row.Name.trim() === '' || row.Name.trim().length < 2) {
                        skippedCount++;
                        continue;
                    }

                    // Check if it has a valid link
                    if (!row.Link || row.Link.trim() === '' || !row.Link.includes('http')) {
                        console.warn('No valid link for:', row.Name.trim());
                        skippedCount++;
                        continue;
                    }

                    batch.push(row);
                }

                console.log(`Processing ${batch.length} valid entries...`);

                // Process all places
                let failedGeocoding = [];

                for (let i = 0; i < batch.length; i++) {
                    const row = batch[i];
                    const placeName = row.Name.trim();

                    // Try to extract coordinates
                    let coords = await extractCoordinates(row.Link);

                    // If no coords, try geocoding by name
                    if (!coords) {
                        coords = await geocodePlaceName(placeName);
                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }

                    if (coords) {
                        const place = {
                            name: placeName,
                            note: row['Curators Note'] || '',
                            dietary: row['Dietary Preference'] || '',
                            link: row.Link || '',
                            mustTry: row['Must Try'] || '',
                            recommendedTime: row['Recommended Time'] || '',
                            tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : [],
                            price: row['Ticket Price'] || '',
                            timings: row.Timings || '',
                            trivia: row.Trivia || '',
                            coordinates: coords
                        };

                        allPlaces.push(place);

                        // Add markers progressively
                        if (allPlaces.length % 5 === 0) {
                            displayPlaces(allPlaces);
                            console.log(`✓ Loaded ${allPlaces.length}/${batch.length} places...`);
                        }
                    } else {
                        failedGeocoding.push(placeName);
                    }
                }

                console.log(`\n✓ Loaded ${allPlaces.length} places successfully`);
                console.log(`✗ Skipped ${skippedCount} entries (no valid link)`);
                if (failedGeocoding.length > 0) {
                    console.log(`⚠ Failed to geocode ${failedGeocoding.length} places:`);
                    failedGeocoding.forEach(name => console.log(`  - ${name}`));
                }
                displayPlaces(allPlaces);
                updateLastUpdated();
            }
        });
    } catch (error) {
        console.error('Error loading CSV:', error);
        document.getElementById('map').innerHTML = '<div class="loading">Error loading data. Please check console.</div>';
    }
}

// Create marker for a place
function createMarker(place) {
    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'marker';
    el.innerHTML = `
        <svg width="30" height="40" viewBox="0 0 30 40">
            <path d="M15 0C9.5 0 5 4.5 5 10c0 8 10 20 10 20s10-12 10-20c0-5.5-4.5-10-10-10z" fill="#e74c3c"/>
            <circle cx="15" cy="10" r="4" fill="white"/>
        </svg>
    `;
    el.style.cursor = 'pointer';

    // Create popup with just the name
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
            <div class="popup-content">
                <h3 style="margin: 0; font-size: 1rem;">${place.name}</h3>
            </div>
        `);

    // Create marker
    const marker = new mapboxgl.Marker(el)
        .setLngLat(place.coordinates)
        .setPopup(popup)
        .addTo(map);

    // Add hover effect
    el.addEventListener('mouseenter', () => {
        marker.togglePopup();
    });

    // Add click handler to show full details
    el.addEventListener('click', () => {
        showPlaceCard(place.name);
    });

    return marker;
}

// Display places on map
function displayPlaces(places) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Add new markers
    places.forEach(place => {
        const marker = createMarker(place);
        markers.push(marker);
    });
}

// Show place card
function showPlaceCard(placeName) {
    const place = allPlaces.find(p => p.name === placeName);
    if (!place) return;

    // Populate card
    document.getElementById('card-name').textContent = place.name;

    // Tags
    const tagsContainer = document.getElementById('card-tags');
    tagsContainer.innerHTML = place.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    // Content sections
    const sections = [
        { id: 'note-section', content: place.note },
        { id: 'must-try-section', content: place.mustTry },
        { id: 'timings-section', content: place.timings },
        { id: 'recommended-section', content: place.recommendedTime },
        { id: 'price-section', content: place.price },
        { id: 'trivia-section', content: place.trivia }
    ];

    sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (section.content && section.content.trim()) {
            element.style.display = 'block';
            const contentId = section.id.replace('-section', '');
            const contentEl = document.getElementById(`card-${contentId}`);
            const content = section.content;

            // Check if content is long (more than 300 characters)
            if (content.length > 300) {
                contentEl.innerHTML = content;
                contentEl.classList.add('truncated');

                // Add read more button if not already present
                let readMoreBtn = element.querySelector('.read-more-btn');
                if (!readMoreBtn) {
                    readMoreBtn = document.createElement('button');
                    readMoreBtn.className = 'read-more-btn';
                    readMoreBtn.textContent = 'Read more';
                    readMoreBtn.onclick = function() {
                        if (contentEl.classList.contains('truncated')) {
                            contentEl.classList.remove('truncated');
                            contentEl.classList.add('expanded');
                            this.textContent = 'Show less';
                        } else {
                            contentEl.classList.remove('expanded');
                            contentEl.classList.add('truncated');
                            this.textContent = 'Read more';
                        }
                    };
                    element.appendChild(readMoreBtn);
                }
            } else {
                contentEl.textContent = content;
                contentEl.classList.remove('truncated', 'expanded');
                // Remove read more button if exists
                const existingBtn = element.querySelector('.read-more-btn');
                if (existingBtn) existingBtn.remove();
            }
        } else {
            element.style.display = 'none';
        }
    });

    // Link
    document.getElementById('card-link').href = place.link;

    // Show card
    document.getElementById('place-card').classList.remove('hidden');

    // Fly to location
    map.flyTo({
        center: place.coordinates,
        zoom: 15,
        duration: 1000
    });
}

// Close place card
document.getElementById('close-card').addEventListener('click', () => {
    document.getElementById('place-card').classList.add('hidden');
});

// Filter places
function filterPlaces(category) {
    currentFilter = category;

    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });

    // Filter places
    let filtered;
    if (category === 'all') {
        filtered = allPlaces;
    } else {
        filtered = allPlaces.filter(place =>
            place.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
        );
    }

    displayPlaces(filtered);
}

// Set up event listeners
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        filterPlaces(btn.dataset.category);
    });
});

// Update last updated date
function updateLastUpdated() {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('last-updated').textContent = date;
}

// Make showPlaceCard available globally
window.showPlaceCard = showPlaceCard;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadPlaces();
});
