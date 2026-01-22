"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapInteractionHandler() {
  const map = useMap();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
    } else {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
    }
  }, [isActive, map]);

  useEffect(() => {
    const enableMap = () => setIsActive(true);
    
    const container = map.getContainer();
    container.addEventListener('click', enableMap);
    container.addEventListener('touchstart', enableMap, { passive: true });

    return () => {
      container.removeEventListener('click', enableMap);
      container.removeEventListener('touchstart', enableMap);
    };
  }, [map]);

  return null;
}

export default function Map() {
  const position: [number, number] = [-17.373308, -66.142852]; 
  
  const googleMapsUrl = "https://maps.app.goo.gl/q1TXwMcgscaMPTYV8";

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 relative group">
      
      <div className="flex-1 relative z-0">
        <MapContainer 
          center={position} 
          zoom={18} 
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={icon}>
            <Popup>
              <div className="text-center font-sans">
                <span className="font-bold text-[#C5A059] block mb-1">Flor de Loto</span>
                <span className="text-xs text-gray-600 block">Av. General Galindo</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">(JVG4+MRH)</span>
              </div>
            </Popup>
          </Marker>

          <MapInteractionHandler />
          </MapContainer>

        <div className="absolute top-2 right-2 z-[400] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 px-2 py-1 rounded text-[10px] text-black font-sans uppercase tracking-widest shadow-sm">
          Click para mover
        </div>
      </div>

      <a 
        href={googleMapsUrl}
        target="_blank" 
        rel="noopener noreferrer"
        className="block w-full bg-[#4285F4] hover:bg-[#3367D6] text-white text-center py-3 px-4 font-bold text-xs uppercase tracking-widest transition-colors shadow-inner flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        Abrir ubicación en Google Maps
      </a>

    </div>
  );
}