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
        style: 'mapbox://styles/mapbox/light-v11',
        center: mysoreCenter,
        zoom: 12.223859479043945,
        maxBounds: mysoreBounds,
        minZoom: 12.223859479043945,
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
    // Terrain removed - was causing brown coloring

    // Enhance water bodies (lakes, rivers, ponds) with vibrant blue
    if (map.getLayer('water')) {
        map.setPaintProperty('water', 'fill-color', '#12B2C1');
        map.setPaintProperty('water', 'fill-opacity', 0.8);
    }

    // Add vibrant water outline
    if (map.getLayer('waterway')) {
        map.setPaintProperty('waterway', 'line-color', '#5aa8db');
        map.setPaintProperty('waterway', 'line-width', [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1.5,
            15, 3
        ]);
    }

    // Add color to national parks and nature reserves
    if (map.getLayer('national-park')) {
        map.setPaintProperty('national-park', 'fill-color', '#c8e6c8');
        map.setPaintProperty('national-park', 'fill-opacity', 0.5);
    }

    // Enhance parks and greenery with more vibrant greens
    if (map.getLayer('landuse')) {
        map.setPaintProperty('landuse', 'fill-color', [
            'match',
            ['get', 'class'],
            'park', '#6c8b08',
            'wood', '#5ab85a',
            'grass', '#c3ed8e',
            'garden', '#95e095',
            'cemetery', '#c3ed8e',
            'pitch', '#c3ed8e',
            'agriculture', '#c3ed8e',
            'scrub', '#60ab02',
            'forest', '#4aa04a',
            'residential', '#c3ed8e',
            'commercial', '#c3ed8e',
            'industrial', '#c3ed8e',
            '#c3ed8e' // default
        ]);
        map.setPaintProperty('landuse', 'fill-opacity', 0.85);
    }

    // Make the base land color use the green tone
    if (map.getLayer('land')) {
        map.setPaintProperty('land', 'background-color', '#c3ed8e');
    }

    // Add background color to the map canvas (if layer exists)
    if (map.getLayer('background')) {
        map.setPaintProperty('background', 'background-color', '#c3ed8e');
    }

    // Color different area types (residential, commercial, industrial)
    if (map.getLayer('landcover')) {
        map.setPaintProperty('landcover', 'fill-color', [
            'match',
            ['get', 'class'],
            'residential', '#c3ed8e',
            'commercial', '#c3ed8e',
            'industrial', '#c3ed8e',
            'retail', '#c3ed8e',
            'residential_area', '#c3ed8e',
            '#c3ed8e'
        ]);
        map.setPaintProperty('landcover', 'fill-opacity', 0);
    }

    // Add colors to different neighborhood types
    const neighborhoodLayer = map.getLayer('settlement-subdivision-label');
    if (neighborhoodLayer) {
        map.setPaintProperty('settlement-subdivision-label', 'text-color', '#5a4a7a');
        map.setPaintProperty('settlement-subdivision-label', 'text-halo-color', '#ffffff');
        map.setPaintProperty('settlement-subdivision-label', 'text-halo-width', 2);
    }

    // Style different road types with distinct colors
    const roadLayers = [
        'road-motorway-trunk',
        'road-primary',
        'road-secondary-tertiary',
        'road-street',
        'road-minor'
    ];

    roadLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            // Set road colors based on hierarchy
            if (layerId.includes('motorway') || layerId.includes('trunk')) {
                map.setPaintProperty(layerId, 'line-color', '#f9a825');
                map.setPaintProperty(layerId, 'line-width', [
                    'interpolate',
                    ['exponential', 1.5],
                    ['zoom'],
                    10, 1.5,
                    18, 8
                ]);
            } else if (layerId.includes('primary')) {
                map.setPaintProperty(layerId, 'line-color', '#fb8c00');
                map.setPaintProperty(layerId, 'line-width', [
                    'interpolate',
                    ['exponential', 1.5],
                    ['zoom'],
                    10, 1,
                    18, 6
                ]);
            } else if (layerId.includes('secondary') || layerId.includes('tertiary')) {
                map.setPaintProperty(layerId, 'line-color', '#e8a838');
                map.setPaintProperty(layerId, 'line-width', [
                    'interpolate',
                    ['exponential', 1.5],
                    ['zoom'],
                    10, 0.8,
                    18, 5
                ]);
            } else {
                map.setPaintProperty(layerId, 'line-color', '#d8d8d8');
                map.setPaintProperty(layerId, 'line-width', [
                    'interpolate',
                    ['exponential', 1.5],
                    ['zoom'],
                    10, 0.5,
                    18, 3
                ]);
            }
        }
    });

    // Enhance road labels
    const roadLabelLayers = [
        'road-label',
        'road-label-simple',
        'road-number-shield'
    ];

    roadLabelLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'text-color', '#2c3e50');
            map.setPaintProperty(layerId, 'text-halo-color', '#ffffff');
            map.setPaintProperty(layerId, 'text-halo-width', 2);
        }
    });

    // Enhance place labels (area names, neighborhoods)
    const placeLabelLayers = [
        'place-label',
        'place-label-city',
        'place-label-town',
        'place-label-village',
        'place-label-neighborhood'
    ];

    placeLabelLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'text-color', '#1a1a1a');
            map.setPaintProperty(layerId, 'text-halo-color', '#ffffff');
            map.setPaintProperty(layerId, 'text-halo-width', 2);
            map.setPaintProperty(layerId, 'text-halo-blur', 1);
        }
    });

    // Enhance POI (Points of Interest) labels
    if (map.getLayer('poi-label')) {
        map.setPaintProperty('poi-label', 'text-color', '#4a5568');
        map.setPaintProperty('poi-label', 'text-halo-color', '#ffffff');
        map.setPaintProperty('poi-label', 'text-halo-width', 1.5);
    }

    // Hide all buildings completely
    if (map.getLayer('building')) {
        map.setLayoutProperty('building', 'visibility', 'none');
    }

    // Remove 3D buildings layer if it exists
    if (map.getLayer('3d-buildings')) {
        map.removeLayer('3d-buildings');
    }

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

    // Check if this is Mysore Palace (exact match only, not museum or other places)
    const isMysoreePalace = place.name.toLowerCase() === 'mysore palace';

    if (isMysoreePalace) {
        // Use custom icon for Mysore Palace
        el.innerHTML = `
            <img src="mysore-palace-icon.png" alt="Mysore Palace" class="palace-icon" style="width: 60px; height: 60px; object-fit: contain;">
        `;
        el.style.cursor = 'pointer';

        // Add zoom-based scaling for the palace icon
        const updatePalaceIconSize = () => {
            const zoom = map.getZoom();
            const icon = el.querySelector('.palace-icon');
            if (icon) {
                // Scale based on zoom level - gets LARGER as you zoom in
                // At minZoom (12.22), size = 60px (clearly visible at initial view)
                // At zoom 14, size = 100px
                // At zoom 16, size = 140px
                // At zoom 18+, size = 180px
                let size;
                if (zoom <= 12.5) {
                    size = 60; // Initial zoom - clearly visible
                } else if (zoom <= 14) {
                    size = 60 + (zoom - 12.5) * 26.67; // 60-100px
                } else if (zoom <= 16) {
                    size = 100 + (zoom - 14) * 20; // 100-140px
                } else if (zoom <= 18) {
                    size = 140 + (zoom - 16) * 20; // 140-180px
                } else {
                    size = 180; // Max size
                }
                icon.style.width = `${size}px`;
                icon.style.height = `${size}px`;
            }
        };

        // Update size on zoom
        map.on('zoom', updatePalaceIconSize);

        // Initial size update
        setTimeout(updatePalaceIconSize, 100);
    } else {
        // Regular marker for other places
        el.innerHTML = `
            <svg width="30" height="40" viewBox="0 0 30 40">
                <path d="M15 0C9.5 0 5 4.5 5 10c0 8 10 20 10 20s10-12 10-20c0-5.5-4.5-10-10-10z" fill="#e74c3c"/>
                <circle cx="15" cy="10" r="4" fill="white"/>
            </svg>
        `;
        el.style.cursor = 'pointer';
    }

    // Create popup with just the name (compact size)
    const popup = new mapboxgl.Popup({
        offset: isMysoreePalace ? 30 : 15,
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

// Handle explore button click
function handleExploreClick() {
    const overlay = document.getElementById('landing-overlay');
    const header = document.querySelector('header');
    const filters = document.getElementById('map-filters');

    // Hide overlay
    overlay.classList.add('hidden');

    // Show header, filters, and map controls
    setTimeout(() => {
        header.classList.add('visible');
        filters.classList.add('visible');

        // Show map controls
        const mapControls = document.querySelector('.mapboxgl-ctrl-top-right');
        if (mapControls) {
            mapControls.classList.add('visible');
        }
    }, 100);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadPlaces();

    // Add explore button event listener
    const exploreBtn = document.getElementById('explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', handleExploreClick);
    }
});
