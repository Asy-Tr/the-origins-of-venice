var map = L.map('map', {
    crs: L.CRS.EPSG3857,
    zoom: 2,
    zoomControl: true,
    attributionControl: true // remain copyright info
});

var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
osmLayer.addTo(map);

// we temporarily hardcode the geojson files, can further be modified to a more elegant way
const geojsonFiles = [
    '24.geojson', '32.geojson', '35.geojson', '40.geojson', '44.geojson',
    '53.geojson', '63.geojson', '68.geojson', '78.geojson', '85.geojson',
    '90.geojson', '94.geojson', '98.geojson', '106.geojson', '114.geojson',
    '122.geojson', '127.geojson', '133.geojson', '143.geojson', '148.geojson',
    '156.geojson', '162.geojson', '169.geojson', '176.geojson', '184.geojson',
    '192.geojson'
];

let highlightConditions = {};

// global variable to store the combined GeoJSON layer
let combinedLayer = null;

// load all GeoJSON files parallelly in order to speed up the process
Promise.all(
    geojsonFiles.map(file =>
        fetch('../geometries/' + file)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Unable to load ${file}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // get corresponding map number from file name
                const mapNumber = parseInt(file.replace('.geojson', ''), 10);

                // create one single GeoJSON layer
                const layer = L.geoJson(data, {
                    style: feature => {
                        return {
                            weight: 2,
                            color: '#3388ff',
                            fillOpacity: 0.5
                        };
                    },
                    onEachFeature: (feature, layer) => {
                        layer.on({
                            mouseover: highlightFeature,
                            mouseout: resetHighlight,
                            click: () => {
                                const popupContent = getFeatureNameInfo(mapNumber, feature.properties.number);
                                layer.bindPopup(popupContent).openPopup();
                            }
                        });
                    }
                });
                return layer;
            })
            .catch(error => console.error(`Error loading GeoJSON file ${file}:`, error))
    )
).then(layers => {
    if (layers.length > 0) {
        // create a feature group from all GeoJSON layers
        combinedLayer = L.featureGroup(layers).addTo(map);

        // fit the bounds of the map to the combined layer
        map.fitBounds(combinedLayer.getBounds());
    } else {
        console.warn('failed to load any GeoJSON layers');
    }
});



// layer control
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


var timelineSlider = document.getElementById('timeline');
var currentTimeRange = document.getElementById('current-time');


let selectedStartingTime = 950

noUiSlider.create(timelineSlider, {
    start: [950], // initial value
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


const ownershipDisplayCountSlider = document.getElementById('ownership-display-count-slider');
const ownershipDisplayCount = document.getElementById('ownership-display-count');

noUiSlider.create(ownershipDisplayCountSlider, {
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

ownershipDisplayCountSlider.noUiSlider.on('update', (values, handle) => {
    ownershipDisplayCount.innerText = values[handle];
    console.log(ownershipDisplayCount.innerText);
});

const frequencyDisplayCountSlider = document.getElementById('frequency-display-count-slider');
const frequencyDisplayCount = document.getElementById('frequency-display-count');

noUiSlider.create(frequencyDisplayCountSlider, {
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

frequencyDisplayCountSlider.noUiSlider.on('update', (values, handle) => {
    frequencyDisplayCount.innerText = values[handle];
});


const ownershipSubmenu = document.getElementById('ownership-submenu');
const frequencySubmenu = document.getElementById('frequency-submenu');

ownershipSubmenu.classList.add('active');
let based = "ownership";
const displayModeRadios = document.getElementsByName('displayMode');
displayModeRadios.forEach(radio => {
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


let selectedSubtype;
document.getElementById('ownership-confirm').addEventListener('click', function () {
    selectedSubtype = document.getElementById('ownership-select').value;
});

document.getElementById('frequency-confirm').addEventListener('click', function () {
    selectedSubtype = document.getElementById('frequency-select').value;
});

document.getElementById('ownership-confirm').addEventListener('click', updateMapFromBackend)
document.getElementById('frequency-confirm').addEventListener('click', updateMapFromBackend);


function getFeatureNameInfo(map_number, number) {
    console.log(map_number);
    console.log(number);
    console.log(highlightConditions);

    const matchedConditions = highlightConditions[map_number] || [];
    console.log(matchedConditions);

    // filter out the matched names
    const matchedNames = matchedConditions
        .filter(([name, code, source]) => code === number || code === 0) // Filter based on code
        .map(([name, , source]) => ({name, source})) // Extract both name and source
        .filter((item, index, self) => self.findIndex(i => i.name === item.name && i.source === item.source) === index); // Remove duplicates based on both name and source

    // show different information based on the current display mode
    if (matchedNames.length > 0) {
        if (based == "ownership") {
            return `
            <strong>region info</strong><br>
            area_code: ${number}<br>
            map_code: ${map_number}<br>
            matched owner(s):<br>
            <ul>${matchedNames.map(({name, source}) => `<li>${name} (Source: ${source})</li>`).join('')}</ul>
        `;
        } else {
            return `
            <strong>region info</strong><br>
            area_code: ${number}<br>
            map_code: ${map_number}<br>
            matched most frenquently appeared items(s):<br>
            <ul>${matchedNames.map(({name, source}) => `<li>${name} (Source: ${source})</li>`).join('')}</ul>
        `;
        }
    } else {
        return `
        <strong>region info</strong><br>
        area_code: ${number}<br>
        map_code: ${map_number}<br>
    `;
    }

}


function highlightFeature(e) {
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
        weight: 5,
        color: '#000000',
        fillOpacity: 0.7
    });

}

function resetHighlight(e) {
    const layer = e.target;
    layer.setStyle(layer._originalStyle);

}


// dynamically update the map based on the selected options
function updateMapFromBackend() {
    let top;
    if (based === "frequency")
        top = parseInt(frequencyDisplayCount.innerText, 10);
    else
        top = parseInt(ownershipDisplayCount.innerText, 10);

    fetch('http://127.0.0.1:5000/process-data', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            based: based,
            subtype: selectedSubtype,
            top: top,
            starting_time: selectedStartingTime
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const jsonData = data.data;
                console.log(data.data);

                sessionStorage.setItem('chartData', JSON.stringify(jsonData));

                window.open('statistic.html', '_blank');


                // update the highlight areas
                highlightConditions = {};
                Object.entries(jsonData).forEach(([name, entries]) => {
                    entries.forEach(({map_number, area_code, source}) => {
                        if (!highlightConditions[map_number]) {
                            highlightConditions[map_number] = [];
                        }
                        if (area_code !== null) {
                            highlightConditions[map_number].push([name, area_code, source]);
                        } else {
                            highlightConditions[map_number].push([name, 0, source]);
                        }
                    });
                });

                // remove the current combined GeoJSON layer
                if (combinedLayer) {
                    map.removeLayer(combinedLayer);
                }

                // reload new GeoJSON layers
                Promise.all(
                    geojsonFiles.map(file =>
                        fetch(('../geometries/' + file))
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`无法加载 ${file}: ${response.statusText}`);
                                }
                                return response.json();
                            })
                            .then(data => {
                                const mapNumber = parseInt(file.replace('.geojson', ''), 10);
                                const highlightAreaCodes = highlightConditions[mapNumber] || [];

                                const layer = L.geoJson(data, {
                                    style: feature => {
                                        if (highlightAreaCodes.some(([_, code]) => code === 0)) {
                                            return {
                                                weight: 5,
                                                color: '#FF0000',
                                                fillOpacity: 0.7
                                            };
                                        }
                                        if (highlightAreaCodes.some(([_, code]) => code === feature.properties.number)) {
                                            return {
                                                weight: 5,
                                                color: '#FF0000',
                                                fillOpacity: 0.7
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
                                            mouseover: highlightFeature,
                                            mouseout: resetHighlight,
                                            click: () => {
                                                const popupContent = getFeatureNameInfo(mapNumber, feature.properties.number);
                                                layer.bindPopup(popupContent).openPopup();
                                            }
                                        });
                                    }
                                });
                                return layer;
                            })
                            .catch(error => console.error(`Error loading GeoJSON file ${file}:`, error))
                    )
                ).then(layers => {
                    if (layers.length > 0) {
                        combinedLayer = L.featureGroup(layers).addTo(map);
                        map.fitBounds(combinedLayer.getBounds());
                    } else {
                        console.warn('failed to load any GeoJSON layers');
                    }
                });
            } else {
                console.error("Backend error:", data.message);
            }
        })
        .catch(error => {
            console.error("Error fetching data from backend:", error);
        });
}



