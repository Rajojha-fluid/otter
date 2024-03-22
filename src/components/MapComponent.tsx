'use client'
import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css'; // Import OpenLayers CSS for styling
import Map from 'ol/Map'; // Import Map class from OpenLayers
import View from 'ol/View'; // Import View class from OpenLayers
import TileLayer from 'ol/layer/Tile'; // Import TileLayer class from OpenLayers
import OSM from 'ol/source/OSM'; // Import OSM class from OpenLayers
import { fromLonLat, toLonLat } from 'ol/proj'; // Import fromLonLat and toLonLat functions from OpenLayers
import { Draw, Modify, Snap } from 'ol/interaction'; // Import drawing interactions from OpenLayers
import { Vector as VectorSource } from 'ol/source'; // Import VectorSource class from OpenLayers
import { Vector as VectorLayer } from 'ol/layer'; // Import VectorLayer class from OpenLayers
import Feature from 'ol/Feature'; // Import Feature class from OpenLayers
import Point from 'ol/geom/Point'; // Import Point class from OpenLayers
import LineString from 'ol/geom/LineString'; // Import LineString class from OpenLayers
import Polygon from 'ol/geom/Polygon'; // Import Polygon class from OpenLayers
import { Style, Circle, Fill, Stroke, Text } from 'ol/style'; // Import styling classes from OpenLayers

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null); // Reference to the map container element
  const [drawingType, setDrawingType] = useState<'Point' | 'LineString' | 'Polygon'>('Point'); // State variable to store the drawing type (Point, LineString, Polygon)
  const [measurement, setMeasurement] = useState<number | null>(null); // State variable to store the calculated measurement

  useEffect(() => {
    if (!mapRef.current) return; // Exit early if map container element is not available

    // Initialize map
    const map = new Map({
      target: mapRef.current, // Set the target element for the map
      layers: [
        new TileLayer({
          source: new OSM(), // Use OpenStreetMap as the base layer
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]), // Set initial center of the map (longitude, latitude)
        zoom: 2, // Set initial zoom level
      }),
    });

    // Initialize a vector source
    const vectorSource = new VectorSource();

    // Initialize a vector layer
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    map.addLayer(vectorLayer); // Add vector layer to the map

    // Draw interaction
    const draw = new Draw({
      source: vectorSource,
      type: drawingType, // Set initial drawing type
    });

    map.addInteraction(draw); // Add draw interaction to the map

    // Modify interaction
    const modify = new Modify({ source: vectorSource });
    map.addInteraction(modify); // Add modify interaction to the map

    // Snap interaction
    const snap = new Snap({ source: vectorSource });
    map.addInteraction(snap); // Add snap interaction to the map

    // Click event listener to add a pinpoint
    map.on('click', (event) => {
      const coordinate = event.coordinate;
      const lonLat = toLonLat(coordinate); // Convert clicked coordinate to longitude and latitude

      // Remove existing features from the vector source
      vectorSource.clear();

      if (drawingType === 'Point') {
        // Create a new marker feature
        const marker = new Feature({
          geometry: new Point(coordinate),
        });

        // Style for the marker
        marker.setStyle(new Style({
          image: new Circle({
            radius: 6,
            fill: new Fill({ color: 'red' }),
            stroke: new Stroke({ color: 'white', width: 2 }),
          }),
        }));

        // Add marker feature to the vector source
        vectorSource.addFeature(marker);

        // You can also display the coordinates
        console.log('Clicked coordinates:', lonLat);
      }
    });

    // Draw end event listener for measurement calculation
    draw.on('drawend', (event) => {
      const geometry = event.feature.getGeometry();
      let newMeasurement: number | null = null;

      if (geometry instanceof LineString) {
        // Calculate length for LineString
        newMeasurement = geometry.getLength();
      } else if (geometry instanceof Polygon) {
        // Calculate area for Polygon
        newMeasurement = geometry.getArea();
      }

      setMeasurement(newMeasurement);
    });

    return () => {
      map.dispose(); // Cleanup when the component unmounts
    };
  }, [drawingType]); // Re-run effect when drawingType changes

  // Event handler for changing the drawing type
  const handleDrawingTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDrawingType(event.target.value as 'Point' | 'LineString' | 'Polygon'); // Update the drawingType state
  };

  return (
    <div>
      <div ref={mapRef} className="map" style={{ width: '100%', height: '400px' }} /> {/* Map container */}
      <div>
        <label htmlFor="drawingType">Drawing Type:</label>
        <select id="drawingType" value={drawingType} onChange={handleDrawingTypeChange}>
          <option value="Point">Point</option>
          <option value="LineString">Line</option>
          <option value="Polygon">Polygon</option>
        </select>
      </div>
      {measurement !== null && (
        <div>
          Measurement: {measurement.toFixed(2)} square meters
        </div>
      )}
    </div>
  );
};

export default MapComponent;
