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

// Weather and AQI State
let weatherData = null;
let aqiData = null;

// Initialize map
function initMap() {
    map = new mapboxgl.Map({
        container: 'map',
        style: {
            version: 8,
            name: 'Custom Green Style',
            sources: {
                'carto-positron': {
                    type: 'raster',
                    tiles: [
                        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
                    ],
                    tileSize: 256
                }
            },
            layers: [
                {
                    id: 'carto-tiles',
                    type: 'raster',
                    source: 'carto-positron',
                    minzoom: 0,
                    maxzoom: 22
                }
            ]
        },
        center: mysoreCenter,
        zoom: 15,
        maxBounds: mysoreBounds,
        minZoom: 15,
        pitch: 45, // Balanced tilt for comfortable 3D view
        bearing: 0,
        antialias: true, // Smoother 3D rendering
        maxPitch: 70 // Allow comfortable viewing angles
    });

    map.addControl(new mapboxgl.NavigationControl());

    // Enable map rotation using right click + drag
    map.dragRotate.enable();

    // Enable map pitch using touch gestures
    map.touchZoomRotate.enableRotation();
    map.touchPitch.enable();

    // Add custom styling once the map style is loaded
    map.on('load', () => {
        customizeMapStyle();
        add3DControls();
    });
}

// Add 3D control buttons
function add3DControls() {
    // Create 3D toggle button
    const toggle3DButton = document.createElement('button');
    toggle3DButton.className = 'mapboxgl-ctrl-icon toggle-3d-btn';
    toggle3DButton.innerHTML = '3D';
    toggle3DButton.title = 'Toggle 3D View';
    toggle3DButton.style.cssText = `
        background: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        padding: 8px 12px;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 0 0 2px rgba(0,0,0,.1);
        color: #2c3e50;
    `;

    let is3D = true;
    toggle3DButton.onclick = () => {
        if (is3D) {
            map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
            toggle3DButton.textContent = '2D';
            is3D = false;
        } else {
            map.easeTo({ pitch: 45, bearing: 0, duration: 1000 });
            toggle3DButton.textContent = '3D';
            is3D = true;
        }
    };

    // Create a custom control
    const toggle3DControl = document.createElement('div');
    toggle3DControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    toggle3DControl.appendChild(toggle3DButton);

    // Add to map
    const controlContainer = document.querySelector('.mapboxgl-ctrl-top-right');
    if (controlContainer) {
        controlContainer.appendChild(toggle3DControl);
    }

    // Create rotation buttons
    const rotationControl = document.createElement('div');
    rotationControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group rotation-control';
    rotationControl.style.cssText = 'margin-top: 10px;';

    const rotateLeftBtn = document.createElement('button');
    rotateLeftBtn.className = 'mapboxgl-ctrl-icon';
    rotateLeftBtn.innerHTML = '↶';
    rotateLeftBtn.title = 'Rotate Left';
    rotateLeftBtn.style.cssText = `
        background: white;
        border: none;
        cursor: pointer;
        padding: 8px;
        font-size: 18px;
        width: 29px;
        height: 29px;
    `;
    rotateLeftBtn.onclick = () => {
        map.easeTo({ bearing: map.getBearing() - 45, duration: 500 });
    };

    const rotateRightBtn = document.createElement('button');
    rotateRightBtn.className = 'mapboxgl-ctrl-icon';
    rotateRightBtn.innerHTML = '↷';
    rotateRightBtn.title = 'Rotate Right';
    rotateRightBtn.style.cssText = `
        background: white;
        border: none;
        cursor: pointer;
        padding: 8px;
        font-size: 18px;
        width: 29px;
        height: 29px;
        border-top: 1px solid #ddd;
    `;
    rotateRightBtn.onclick = () => {
        map.easeTo({ bearing: map.getBearing() + 45, duration: 500 });
    };

    rotationControl.appendChild(rotateLeftBtn);
    rotationControl.appendChild(rotateRightBtn);

    if (controlContainer) {
        controlContainer.appendChild(rotationControl);
    }

    // Add Weather and AQI buttons below rotation controls
    addWeatherAQIControls();
}

// Fetch weather data from OpenWeatherMap API
async function fetchWeatherData() {
    try {
        const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; // Users will need to replace this
        const lat = mysoreCenter[1];
        const lon = mysoreCenter[0];

        // Fetch current weather
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        );
        const weather = await weatherResponse.json();

        // Fetch air quality
        const aqiResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        const aqi = await aqiResponse.json();

        weatherData = {
            temp: Math.round(weather.main.temp),
            description: weather.weather[0].description,
            icon: weather.weather[0].icon
        };

        aqiData = {
            index: aqi.list[0].main.aqi,
            components: aqi.list[0].components
        };

        updateWeatherAQIDisplay();
    } catch (error) {
        console.error('Error fetching weather/AQI data:', error);
        // Set fallback data
        weatherData = { temp: '--', description: 'Unavailable', icon: '01d' };
        aqiData = { index: '--', components: {} };
        updateWeatherAQIDisplay();
    }
}

// Get AQI description based on index (1-5 scale)
function getAQIDescription(index) {
    const descriptions = {
        1: 'Good',
        2: 'Fair',
        3: 'Moderate',
        4: 'Poor',
        5: 'Very Poor'
    };
    return descriptions[index] || 'N/A';
}

// Get AQI color based on index
function getAQIColor(index) {
    const colors = {
        1: '#00e400',
        2: '#ffff00',
        3: '#ff7e00',
        4: '#ff0000',
        5: '#8f3f97'
    };
    return colors[index] || '#999';
}

// Add Weather and AQI control buttons
function addWeatherAQIControls() {
    const controlContainer = document.querySelector('.mapboxgl-ctrl-top-right');
    if (!controlContainer) return;

    // Create control group
    const weatherAQIControl = document.createElement('div');
    weatherAQIControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group weather-aqi-control';
    weatherAQIControl.style.cssText = 'margin-top: 10px;';

    // Weather Button
    const weatherBtn = document.createElement('button');
    weatherBtn.className = 'mapboxgl-ctrl-icon weather-btn';
    weatherBtn.id = 'weather-btn';
    weatherBtn.title = 'Current Weather';
    weatherBtn.style.cssText = `
        background: white;
        border: none;
        cursor: pointer;
        padding: 8px;
        width: 29px;
        height: 29px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        color: #2c3e50;
    `;
    weatherBtn.textContent = '--°';

    // AQI Button
    const aqiBtn = document.createElement('button');
    aqiBtn.className = 'mapboxgl-ctrl-icon aqi-btn';
    aqiBtn.id = 'aqi-btn';
    aqiBtn.title = 'Air Quality Index';
    aqiBtn.style.cssText = `
        background: white;
        border: none;
        cursor: pointer;
        padding: 8px;
        width: 29px;
        height: 29px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #2c3e50;
        border-top: 1px solid #ddd;
    `;
    aqiBtn.textContent = '--';

    weatherAQIControl.appendChild(weatherBtn);
    weatherAQIControl.appendChild(aqiBtn);
    controlContainer.appendChild(weatherAQIControl);

    // Fetch initial data
    fetchWeatherData();

    // Update every 10 minutes
    setInterval(fetchWeatherData, 10 * 60 * 1000);
}

// Update Weather and AQI display
function updateWeatherAQIDisplay() {
    const weatherBtn = document.getElementById('weather-btn');
    const aqiBtn = document.getElementById('aqi-btn');

    if (weatherBtn && weatherData) {
        weatherBtn.textContent = `${weatherData.temp}°`;
        weatherBtn.title = `Weather: ${weatherData.description}, ${weatherData.temp}°C`;
    }

    if (aqiBtn && aqiData) {
        const aqiColor = getAQIColor(aqiData.index);
        const aqiDesc = getAQIDescription(aqiData.index);
        aqiBtn.textContent = aqiDesc;
        aqiBtn.style.color = aqiColor;
        aqiBtn.title = `Air Quality: ${aqiDesc} (Index: ${aqiData.index})`;
    }
}

// Customize map style with enhanced design elements
function customizeMapStyle() {
    // No terrain - it was causing the brown color at lower zoom levels
    console.log('✓ Map style customization complete');
}

// Extract coordinates from Google Maps URL
async function extractCoordinates(url, placeName = 'Unknown') {
    if (!url) return null;

    try {
        // Only use !3d (latitude) and !4d (longitude) parameters
        // Example: !3d12.2919536!4d76.6406718
        console.log(`🔍 Extracting coordinates for: "${placeName}"`);
        console.log(`   URL: ${url}`);
        const latMatch = url.match(/!3d([-\d.]+)/);
        const lngMatch = url.match(/!4d([-\d.]+)/);

        if (latMatch && lngMatch) {
            const lat = parseFloat(latMatch[1]);
            const lng = parseFloat(lngMatch[1]);
            console.log(`✓ Extracted coordinates for "${placeName}": [${lng}, ${lat}]`);
            // Return as [longitude, latitude] for Mapbox
            return [lng, lat];
        }

        // If we couldn't extract !3d/!4d coordinates, log error for manual debugging
        console.error(`⚠️  Failed to extract !3d/!4d coordinates for "${placeName}"`);
        console.error(`    URL: ${url}`);
        return null;
    } catch (error) {
        console.error(`⚠️  Error extracting coordinates for "${placeName}":`, error);
        console.error(`    URL: ${url}`);
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

                    // Try to extract coordinates (only using !3d/!4d parameters)
                    let coords = await extractCoordinates(row.Link, placeName);

                    // If no coords from URL, skip this place - needs manual review
                    if (!coords) {
                        console.warn(`⚠️  Skipping "${placeName}" - needs manual review`);
                        failedGeocoding.push(placeName);
                        continue;
                    }

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
                        image: row['Image'] || row['Image URL'] || '',
                        coordinates: coords
                    };

                    allPlaces.push(place);

                    // Add markers progressively
                    if (allPlaces.length % 5 === 0) {
                        displayPlaces(allPlaces);
                        console.log(`✓ Loaded ${allPlaces.length}/${batch.length} places...`);
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

    // Create popup with just the name (compact size)
    const popup = new mapboxgl.Popup({
        offset: 15,
        closeButton: false,
        closeOnClick: false,
        maxWidth: '200px'
    })
        .setHTML(`
            <div class="popup-content" style="padding: 2px 4px;">
                <h3 style="margin: 0; font-size: 0.85rem; font-weight: 500;">${place.name}</h3>
            </div>
        `);

    // Create marker
    const marker = new mapboxgl.Marker(el)
        .setLngLat(place.coordinates)
        .setPopup(popup)
        .addTo(map);

    // Add hover effect with proper cleanup
    el.addEventListener('mouseenter', () => {
        // Close all other popups first
        markers.forEach(m => {
            if (m !== marker && m.getPopup().isOpen()) {
                m.togglePopup();
            }
        });
        // Open this popup
        if (!marker.getPopup().isOpen()) {
            marker.togglePopup();
        }
    });

    el.addEventListener('mouseleave', () => {
        // Close popup when mouse leaves
        if (marker.getPopup().isOpen()) {
            marker.togglePopup();
        }
    });

    // Add click handler to show full details
    el.addEventListener('click', (e) => {
        console.log('Marker clicked!', place.name);
        e.stopPropagation();
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
    console.log('showPlaceCard called with:', placeName);
    const place = allPlaces.find(p => p.name === placeName);
    if (!place) {
        console.error('Place not found:', placeName);
        return;
    }
    console.log('Place found:', place);

    // Populate card title
    document.getElementById('card-name').textContent = place.name;

    // Populate image
    const cardImage = document.getElementById('card-image');
    if (place.image && place.image.trim()) {
        cardImage.src = place.image;
        cardImage.alt = place.name;
        cardImage.style.display = 'block';
    } else {
        // Use a placeholder gradient if no image
        cardImage.style.display = 'none';
    }

    // Tags
    const tagsContainer = document.getElementById('card-tags');
    tagsContainer.innerHTML = place.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    // Info Grid Items
    const infoItems = [
        { id: 'timings-item', content: place.timings, textId: 'card-timings' },
        { id: 'price-item', content: place.price, textId: 'card-price' },
        { id: 'recommended-item', content: place.recommendedTime, textId: 'card-recommended' },
        { id: 'dietary-item', content: place.dietary, textId: 'card-dietary' }
    ];

    infoItems.forEach(item => {
        const element = document.getElementById(item.id);
        const textEl = document.getElementById(item.textId);
        if (item.content && item.content.trim()) {
            element.style.display = 'flex';
            textEl.textContent = item.content;
        } else {
            element.style.display = 'none';
        }
    });

    // Content sections
    const sections = [
        { id: 'must-try-section', content: place.mustTry, textId: 'card-must-try' },
        { id: 'note-section', content: place.note, textId: 'card-note' },
        { id: 'trivia-section', content: place.trivia, textId: 'card-trivia' }
    ];

    sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (section.content && section.content.trim()) {
            element.style.display = 'block';
            const contentEl = document.getElementById(section.textId);
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
    const placeCard = document.getElementById('place-card');
    if (!placeCard) {
        console.error('CARD ELEMENT NOT FOUND!');
        return;
    }
    placeCard.classList.remove('hidden');
    console.log('✅ Card shown for:', place.name);

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
