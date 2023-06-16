import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import 'ol-geocoder/dist/ol-geocoder.min.css';
import axios from 'axios';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon } from 'ol/style';


const App: React.FC = () => {
  const [pointA, setPointA] = useState('');
  const [pointB, setPointB] = useState('');
  const [distance, setDistance] = useState<number | null>(null);

  const calculateDistance = () => {
    const coordsA = pointA.split(',').map(Number);
    const coordsB = pointB.split(',').map(Number);
    setDistance(haversineDistance(coordsA, coordsB));
  };

  const haversineDistance = (coordsA: number[], coordsB: number[]): number => {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(coordsB[0] - coordsA[0]);
    const dLon = toRadians(coordsB[1] - coordsA[1]);
    const lat1 = toRadians(coordsA[0]);
    const lat2 = toRadians(coordsB[0]);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };



  const mapRef = useRef<HTMLDivElement | null>(null);
  const [address, setAddress] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<'A' | 'B'>('A');
  const [map, setMap] = useState<Map | null>(null);

  useEffect(() => {
  const initialMap = new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
    ],
    view: new View({
      center: fromLonLat([0, 0]),
      zoom: 2,
    }),
  });
  
  if (mapRef.current) {
    initialMap.setTarget(mapRef.current);
  }

  setMap(initialMap);

  return () => {
    initialMap.setTarget(undefined);
  };
}, []);

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  setAddress(e.target.value);
  if (e.target.value.length > 2) {
    const response = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        e.target.value
      )}&key=e261688c2fac4c87a8cddbd7009411c1&limit=5`
    );
    // Display suggestions (you can customize this part)
    console.log(response.data.results.map((result: any) => result.formatted));
  }
};

const handleAddressSelect = async () => {
  const response = await axios.get(
    `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      address
    )}&key=e261688c2fac4c87a8cddbd7009411c1&limit=1`
  );
  const result = response.data.results[0];
  const coordinates = fromLonLat([result.geometry.lng, result.geometry.lat]);

  if (selectedPoint === 'A') {
    setPointA(result.geometry.lat + ', ' + result.geometry.lng);
  } else {
    setPointB(result.geometry.lat + ', ' + result.geometry.lng);
  }

  if (map) {
    const iconFeature = new Feature({
      geometry: new Point(coordinates),
    });

    const iconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: 'https://openlayers.org/en/latest/examples/data/icon.png',
      }),
    });

    iconFeature.setStyle(iconStyle);

    const vectorSource = new VectorSource({
      features: [iconFeature],
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    map.addLayer(vectorLayer);
    map.getView().animate({ center: coordinates, duration: 2000 });
  }
};


  
  

  return (
    <div className="App">
      <h1>Distance Calculator</h1>
      <label htmlFor="pointA">Point A:</label>
      <input
        type="text"
        id="pointA"
        placeholder="Latitude, Longitude"
        value={pointA}
        onChange={(e) => setPointA(e.target.value)}
      />
      <br />
      <label htmlFor="pointB">Point B:</label>
      <input
        type="text"
        id="pointB"
        placeholder="Latitude, Longitude"
        value={pointB}
        onChange={(e) => setPointB(e.target.value)}
      />
      <br />
      <button onClick={calculateDistance}>Calculate</button>
      <div>{distance !== null && `Distance: ${distance.toFixed(2)}km`}</div>
      <label htmlFor="address">Address:</label>
    <input
      type="text"
      id="address"
      placeholder="Search address"
      value={address}
      onChange={handleAddressChange}
    />
    <br />
    <label>
      <input
        type="radio"
        name="point"
        checked={selectedPoint === 'A'}
        onChange={() => setSelectedPoint('A')}
      />
      Point A
    </label>
    <label>
      <input
        type="radio"
        name="point"
        checked={selectedPoint === 'B'}
        onChange={() => setSelectedPoint('B')}
      />
      Point B
    </label>
    <br />
    <button onClick={handleAddressSelect}>Select Address</button>
    <div id="map" className="map" ref={mapRef}></div>
    </div>

  );
};

export default App;
