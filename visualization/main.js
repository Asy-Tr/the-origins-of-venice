// load all GeoJSON files parallelly in order to speed up the process
function loadGeoJSONParallelly() {
    Promise.all(
        geojsonFiles.map(file =>
            fetch(('../geometries/' + file))
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load GeoJSON file ${file}: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    const mapId = parseInt(file.replace('.geojson', ''), 10);
                    const highlightAreaCodes = highlightConditions[mapId] || [];

                    const layers = L.geoJson(data, {
                        style: feature => {
                            if (highlightAreaCodes.some(([_, code]) => code === 0)) {
                                return {
                                    weight: 2,
                                    color: '#FF0000',
                                    fillOpacity: 0.5
                                };
                            }
                            if (highlightAreaCodes.some(([_, code]) => code === feature.properties.number)) {
                                return {
                                    weight: 2,
                                    color: '#FF0000',
                                    fillOpacity: 0.5
                                };
                            }
                            return {
                                weight: 2,
                                color: '#3388ff',
                                fillOpacity: 0.5
                            };
                        },
                        onEachFeature: (feature, layer) => {
                            layer.on({
                                mouseover: highlightLayer,
                                mouseout: resetHighlight,
                                click: () => {
                                    const popupContent = getFeatureInfo(mapId, feature.properties.number);
                                    layer.bindPopup(popupContent).openPopup();
                                }
                            });
                        }
                    });
                    return layers;
                })
                .catch(error => console.error(`Error loading GeoJSON file ${file}:`, error))
        )
    ).then(layers => {
        if (layers.length > 0) {
            combinedLayer = L.featureGroup(layers).addTo(map);
            map.fitBounds(combinedLayer.getBounds());
        } else {
            console.warn('No GeoJSON layers loaded.');
        }
    });
}

function getFeatureInfo(map_id, number) {
    const matchedConditions = highlightConditions[map_id] || [];

    // filter out the matched names
    const matchedNames = matchedConditions
        .filter(([, area_code,]) => area_code === number || area_code === 0) // Filter based on code
        .map(([name, , source]) => ({name, source})) // Extract both name and source
        .filter((item, index, self) => self.findIndex(i => i.name === item.name && i.source === item.source) === index); // Remove duplicates based on both name and source

    // show different information based on the current display mode
    if (matchedNames.length > 0) {
        if (based == "ownership") {
            return `
            <strong>Region Info</strong><br>
            map_id: ${map_id}<br>
            area_code: ${number}<br>
            <br>
            Matched Owner(s):<br>
            <ul>${matchedNames.map(({name, source}) => `<li>${name} (Source: ${source})</li>`).join('')}</ul>
        `;
        } else {
            return `
            <strong>region info</strong><br>
            map_id: ${map_id}<br>
            area_code: ${number}<br>
            <br>
            Matched Most Frenquently Appeared Items(s):<br>
            <ul>${matchedNames.map(({name, source}) => `<li>${name} (Source: ${source})</li>`).join('')}</ul>
        `;
        }
    } else {
        return `
        <strong>Region Info</strong><br>
        map_id: ${map_id}<br>
        area_code: ${number}<br>
    `;
    }
}

function highlightLayer(e) {
    const layer = e.target;

    // remember the original style
    if (!layer._originalStyle) {
        layer._originalStyle = {
            weight: layer.options.weight,
            color: layer.options.color,
            fillOpacity: layer.options.fillOpacity
        };
    }

    // highlight style
    layer.setStyle({
        weight: 2,
        color: '#000000',
        fillOpacity: 0.5
    });
}

function resetHighlight(e) {
    const layer = e.target;
    layer.setStyle(layer._originalStyle);
}

function updateMap() {
    fetch('http://127.0.0.1:5000/process-data', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            based: based,
            subtype: selectedSubtype,
            top: parseInt(displayNumber.innerText, 10),
            starting_time: selectedStartingTime
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const jsonData = data.data;

                sessionStorage.setItem('chartData', JSON.stringify(jsonData));

                window.open('statistic.html', '_blank');


                // update the highlight areas
                highlightConditions = {};
                Object.entries(jsonData).forEach(([name, entries]) => {
                    entries.forEach(({map_id, area_code, source}) => {
                        if (!highlightConditions[map_id]) {
                            highlightConditions[map_id] = [];
                        }
                        if (area_code !== null) {
                            highlightConditions[map_id].push([name, area_code, source]);
                        } else {
                            highlightConditions[map_id].push([name, 0, source]);
                        }
                    });
                });

                // remove the current combined GeoJSON layer
                if (combinedLayer) {
                    map.removeLayer(combinedLayer);
                }

                // reload new GeoJSON layers
                loadGeoJSONParallelly();
            } else {
                console.error("Backend error:", data.message);
            }
        })
        .catch(error => {
            console.error("Error fetching data from backend:", error);
        });
}


const geojsonFiles = [
    '24.geojson', '32.geojson', '35.geojson', '40.geojson', '44.geojson',
    '53.geojson', '63.geojson', '68.geojson', '78.geojson', '85.geojson',
    '90.geojson', '94.geojson', '98.geojson', '106.geojson', '114.geojson',
    '122.geojson', '127.geojson', '133.geojson', '143.geojson', '148.geojson',
    '156.geojson', '162.geojson', '169.geojson', '176.geojson', '184.geojson',
    '192.geojson'
];

const map = L.map('map', {
    crs: L.CRS.EPSG3857,
    zoom: 2,
    zoomControl: true,
    attributionControl: true // keep copyright info
});

const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// global variable to store the combined GeoJSON layer
let combinedLayer = null;

let highlightConditions = {};

let based = "ownership";

const ownershipSubmenu = document.getElementById('ownership-submenu');
const frequencySubmenu = document.getElementById('frequency-submenu');

let selectedSubtype;

let selectedStartingTime = 950

const displayNumberSlider = document.getElementById('display-number-slider');
const displayNumber = document.getElementById('display-number');

const timelineSlider = document.getElementById('timeline-slider');
const currentTimeRange = document.getElementById('current-time-range');

ownershipSubmenu.classList.add('active');

const baseRadios = document.getElementsByName('base');

osmLayer.addTo(map);
loadGeoJSONParallelly();
baseRadios.forEach(radio => {
    radio.addEventListener('change', function (e) {
        if (e.target.value === 'ownership') {
            based = "ownership";
            ownershipSubmenu.classList.add('active');
            frequencySubmenu.classList.remove('active');
        } else if (e.target.value === 'frequency') {
            based = "frequency"
            frequencySubmenu.classList.add('active');
            ownershipSubmenu.classList.remove('active');
        }
    });
});

document.getElementById('confirm').addEventListener('click', function () {
    if (based === "frequency")
        selectedSubtype = document.getElementById('frequency-select').value;

    else
        selectedSubtype = document.getElementById('ownership-select').value;
});

noUiSlider.create(displayNumberSlider, {
    start: [1],
    connect: [true, false],
    range: {
        min: 1,
        max: 20
    },
    step: 1,
    tooltips: false,
    format: {
        to: value => Math.round(value),
        from: value => Number(value)
    }
});

displayNumberSlider.noUiSlider.on('update', (values, handle) => {
    displayNumber.innerText = values[handle];
});

noUiSlider.create(timelineSlider, {
    start: [950],
    connect: [true, false],
    range: {
        min: 950,
        max: 1400
    },
    step: 50,
    tooltips: false,
    format: {
        to: value => Math.round(value),
        from: value => Number(value)
    }
});

timelineSlider.noUiSlider.on('update', function (values, handle) {
    selectedStartingTime = parseInt(values[handle]);
    const start = parseInt(values[handle]);
    const end = start + 50;
    currentTimeRange.innerText = `${start} - ${end}`;
});

document.getElementById('confirm').addEventListener('click', updateMap);

document.getElementById('layer1').addEventListener('change', function (e) {
    if (e.target.checked) {
        if (!map.hasLayer(osmLayer)) {
            map.addLayer(osmLayer);
        }
    } else {
        if (map.hasLayer(osmLayer)) {
            map.removeLayer(osmLayer);
        }
    }
});

document.getElementById('layer2').addEventListener('change', function (e) {
    if (e.target.checked) {
        if (combinedLayer) {
            map.addLayer(combinedLayer);
        }
    } else {
        if (combinedLayer) {
            map.removeLayer(combinedLayer);
        }
    }
});
