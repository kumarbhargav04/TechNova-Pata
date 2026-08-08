"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Layers, MapPin, Play, RefreshCw, LogOut, Settings, 
  BarChart2, Shield, Clipboard, Download, FileText, Database, Key, Mic,
  Trash2, Navigation, Truck, Zap, Activity
} from "lucide-react";


const PRESETS = [
  { title: "Standard Hinglish", address: "Opposite Ganesh Temple Kothapet Hyderabad", badge: "Hinglish" },
  { title: "Telugu Transliteration", address: "Hanuman mandir daggara Ram Nagar Hyderabad", badge: "Telugu" },
  { title: "Telugu Regional Script", address: "హనుమాన్ గుడి దగ్గర, కొత్తపేట, హైదరాబాద్", badge: "Telugu Script" },
  { title: "Typo & Wrong Pincode", address: "Ganesh templ Kothapeta Hyderbad 500038", badge: "Error Fix" },
  { title: "Hindi Script & Landmark", address: "राम मंदिर के पास पुरानी कॉलोनी, दिल्ली", badge: "Hindi Script" },
  { title: "Apartment & Landmark", address: "Flat 302, Sai Residency, opposite post office, Whitefield, Bangalore", badge: "Karnataka" },
  { title: "Bandra Landmark (Mumbai)", address: "Beside Dominos Pizza, Linking Road, Bandra West, Mumbai 400050", badge: "Mumbai" }
];

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard"); // dashboard | bulk | analytics | audit | playground | developer | settings
  const [addressInput, setAddressInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  
  // Authentication
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("Driver");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState("");

  // Key stats
  const [stats, setStats] = useState<any>({
    total_resolved: 0,
    average_confidence: 0.0,
    average_latency_ms: 0.0,
    success_rate: 0.0,
    delivery_calls_saved: 0,
    fuel_saved_litres: 0.0,
    co2_reduced_kg: 0.0,
    cost_per_tx_inr: 0.05
  });
  const [history, setHistory] = useState<any[]>([]);

  // Bulk geocoding state
  const [bulkFile, setBulkFile] = useState<any>(null);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<string[]>([]);


  const [theme, setTheme] = useState("dark");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [activeModels, setActiveModels] = useState<any[]>([]);
  const [liqKeyInput, setLiqKeyInput] = useState("");
  const [ocKeyInput, setOcKeyInput] = useState("");
  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [keysMessage, setKeysMessage] = useState("");

  // Admin settings state
  const [cachingEnabled, setCachingEnabled] = useState(true);
  const [llmTimeoutSeconds, setLlmTimeoutSeconds] = useState(10);
  const [fallbackConfidenceThreshold, setFallbackConfidenceThreshold] = useState(70);
  const [cacheTtlHours, setCacheTtlHours] = useState(24);
  const [settingsMessage, setSettingsMessage] = useState("");

  // API Playground state
  const [apiMethod, setApiMethod] = useState("POST");
  const [apiPath, setApiPath] = useState("/api/v1/resolve");
  const [apiPayload, setApiPayload] = useState('{\n  "address": "Opposite Ganesh Temple Kothapet Hyderabad",\n  "user_id": 1\n}');
  const [apiResponse, setApiResponse] = useState('{\n  "status": "ready",\n  "logs": "Awaiting test execution..."\n}');

  const [isApiRunning, setIsApiRunning] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const circleInstance = useRef<any>(null);
  const tileLayerInstance = useRef<any>(null);
  const poiMarkersInstance = useRef<any[]>([]);
  const [mapLayer, setMapLayer] = useState("dark"); // dark | satellite | terrain | streets

  // Route planning state and refs
  const [sourceInput, setSourceInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [routeResult, setRouteResult] = useState<any>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState("Truck");
  const [isSimulating, setIsSimulating] = useState(false);

  const routingMapRef = useRef<HTMLDivElement>(null);
  const routingMapInstance = useRef<any>(null);
  const routingRouteLineInstance = useRef<any>(null);
  const routingStartMarkerInstance = useRef<any>(null);
  const routingEndMarkerInstance = useRef<any>(null);
  const simulatedTruckMarker = useRef<any>(null);


  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome.");
      return;
    }
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";
      recognition.onstart = () => {
        setIsListening(true);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAddressInput(prev => prev ? prev + " " + transcript : transcript);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
    }
  };



  // Check auth session
  useEffect(() => {
    const session = localStorage.getItem("pataai_user");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed && typeof parsed === "object" && parsed.id) {
          setCurrentUser(parsed);
          fetchStats(parsed.id);
          fetchHistory(parsed.id);
        } else {
          localStorage.removeItem("pataai_user");
        }
      } catch (e) {
        localStorage.removeItem("pataai_user");
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const savedKeys = localStorage.getItem(`pata_keys_${currentUser.id}`);
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      } else {
        setApiKeys([]);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentPage === "settings") {
      fetchKeys();
      if (currentUser && currentUser.role === "Admin") {
        fetchAdminSettings();
      }
    }
    if (currentPage === "analytics") {
      fetchActiveModels();
    }
  }, [currentPage, currentUser]);

  const generateApiKey = () => {

    if (!currentUser) return;
    const randomHex = Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const newKey = `pata_live_${randomHex}`;
    const updated = [...apiKeys, newKey];
    setApiKeys(updated);
    localStorage.setItem(`pata_keys_${currentUser.id}`, JSON.stringify(updated));
  };

  const deleteApiKey = (keyToDelete: string) => {
    if (!currentUser) return;
    const updated = apiKeys.filter(k => k !== keyToDelete);
    setApiKeys(updated);
    localStorage.setItem(`pata_keys_${currentUser.id}`, JSON.stringify(updated));
  };


  const fetchKeys = async () => {

    try {
      const res = await fetch("http://localhost:8000/api/v1/keys");
      if (res.ok) {
        const data = await res.json();
        setLiqKeyInput(data.locationiq_api_key);
        setOcKeyInput(data.opencage_api_key);
        setGroqKeyInput(data.groq_api_key);
      }
    } catch (e) {
      console.log("Failed to fetch keys", e);
    }
  };

  const fetchActiveModels = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/models");
      if (res.ok) {
        const data = await res.json();
        setActiveModels(data.active_models);
      }
    } catch (e) {
      console.log("Failed to fetch models", e);
    }
  };

  const handleUpdateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysMessage("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationiq_api_key: liqKeyInput,
          opencage_api_key: ocKeyInput,
          groq_api_key: groqKeyInput
        })
      });
      if (res.ok) {
        setKeysMessage("System API keys updated successfully!");
        fetchKeys();
      } else {
        setKeysMessage("Failed to update API keys.");
      }
    } catch (e: any) {
      setKeysMessage(`Error: ${e.message}`);
    }
  };

  const fetchAdminSettings = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setCachingEnabled(data.caching_enabled);
        setLlmTimeoutSeconds(data.llm_timeout_seconds);
        setFallbackConfidenceThreshold(data.fallback_confidence_threshold);
        setCacheTtlHours(data.cache_ttl_hours);
      }
    } catch (e) {
      console.log("Failed to fetch admin settings", e);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caching_enabled: cachingEnabled,
          llm_timeout_seconds: Number(llmTimeoutSeconds),
          fallback_confidence_threshold: Number(fallbackConfidenceThreshold),
          cache_ttl_hours: Number(cacheTtlHours)
        })
      });
      if (res.ok) {
        setSettingsMessage("System settings updated successfully!");
        fetchAdminSettings();
      } else {
        setSettingsMessage("Failed to update settings.");
      }
    } catch (e: any) {
      setSettingsMessage(`Error: ${e.message}`);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("⚠️ WARNING: This will permanently delete all geocoding history and logs. Proceed?")) return;
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/clear-history", { method: "POST" });
      if (res.ok) {
        alert("Geocoding log history cleared successfully.");
        if (currentUser) {
          fetchHistory(currentUser.id);
          fetchStats(currentUser.id);
        }
      } else {
        alert("Failed to clear history.");
      }
    } catch (e) {
      alert("Error clearing history.");
    }
  };

  const handleClearCache = async () => {
    if (!confirm("⚠️ WARNING: This will permanently purge all cached OSM landmark query results. Proceed?")) return;
    try {
      const res = await fetch("http://localhost:8000/api/v1/admin/clear-cache", { method: "POST" });
      if (res.ok) {
        alert("Landmark cache database table cleared successfully.");
      } else {
        alert("Failed to clear landmark cache.");
      }
    } catch (e) {
      alert("Error clearing cache.");
    }
  };

  const handleReSeedDb = async () => {
    if (!confirm("⚠️ Re-seed pincodes directory? This clears existing tables and downloads/re-seeds the 150K ground truth records. Proceed?")) return;
    try {
      const res = await fetch("http://localhost:8000/api/v1/test-seed");
      if (res.ok) {
        const data = await res.json();
        alert(`Success: ${data.message}\nTotal records: ${data.total_records}`);
      } else {
        alert("Failed to re-seed pincodes database.");
      }
    } catch (e) {
      alert("Error contacting server for seeding.");
    }
  };



  // Fetch metrics
  const fetchStats = async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/stats?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.log("Stats fetch failed", e);
    }
  };

  const fetchHistory = async (userId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/history?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.log("History fetch failed", e);
    }
  };

  const handleDeleteHistoryItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this audit log item?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/v1/history/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (currentUser) {
          fetchHistory(currentUser.id);
          fetchStats(currentUser.id);
        }
      } else {
        alert("Failed to delete audit item.");
      }
    } catch (e) {
      console.log("Error deleting history item", e);
    }
  };

  const updateTileLayer = (layerName: string) => {
    setMapLayer(layerName);
    if (mapInstance.current) {
      import("leaflet").then((L) => {
        if (tileLayerInstance.current) {
          mapInstance.current.removeLayer(tileLayerInstance.current);
        }
        
        let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        let attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
        
        if (layerName === 'satellite') {
          url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Hybrid
          attribution = '&copy; Google Maps';
        } else if (layerName === 'terrain') {
          url = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'; // Google Terrain
          attribution = '&copy; Google Maps';
        } else if (layerName === 'streets') {
          url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Standard Roadmap
          attribution = '&copy; Google Maps';
        }
        
        tileLayerInstance.current = L.tileLayer(url, { attribution, maxZoom: 21 }).addTo(mapInstance.current);
      });
    }
  };


  // Setup client-side map
  useEffect(() => {
    if (currentPage === "dashboard" && mapRef.current) {
      import("leaflet").then((L) => {
        // Destroy existing instance to prevent duplicate error
        if (mapInstance.current) {
          try {
            mapInstance.current.remove();
          } catch (e) {
            console.log("Error removing map", e);
          }
          mapInstance.current = null;
        }
        
        const map = L.map(mapRef.current!).setView([17.3850, 78.4867], 11);
        
        let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        let attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
        
        if (mapLayer === 'satellite') {
          url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Hybrid
          attribution = '&copy; Google Maps';
        } else if (mapLayer === 'terrain') {
          url = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'; // Google Terrain
          attribution = '&copy; Google Maps';
        } else if (mapLayer === 'streets') {
          url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Standard Roadmap
          attribution = '&copy; Google Maps';
        }

        tileLayerInstance.current = L.tileLayer(url, { attribution, maxZoom: 21 }).addTo(map);

        mapInstance.current = map;
        
        // Reset marker and circle refs bound to the old map
        markerInstance.current = null;
        circleInstance.current = null;
      });
    }

    return () => {
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {
          console.log("Error cleaning map", e);
        }
        mapInstance.current = null;
        markerInstance.current = null;
        circleInstance.current = null;
        tileLayerInstance.current = null;
      }
    };
  }, [currentPage, currentUser]);

  // Setup routing Leaflet map
  useEffect(() => {
    if (currentPage === "routing" && routingMapRef.current) {
      import("leaflet").then((L) => {
        if (routingMapInstance.current) {
          try {
            routingMapInstance.current.remove();
          } catch (e) {
            console.log("Error removing routing map", e);
          }
          routingMapInstance.current = null;
        }
        
        const map = L.map(routingMapRef.current!).setView([17.3850, 78.4867], 11);
        const url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        const attribution = '&copy; OpenStreetMap contributors &copy; CARTO';
        
        L.tileLayer(url, { attribution, maxZoom: 21 }).addTo(map);
        routingMapInstance.current = map;
        
        routingRouteLineInstance.current = null;
        routingStartMarkerInstance.current = null;
        routingEndMarkerInstance.current = null;
        simulatedTruckMarker.current = null;
      });
    }

    return () => {
      if (routingMapInstance.current) {
        try {
          routingMapInstance.current.remove();
        } catch (e) {
          console.log("Error cleaning routing map", e);
        }
        routingMapInstance.current = null;
        routingRouteLineInstance.current = null;
        routingStartMarkerInstance.current = null;
        routingEndMarkerInstance.current = null;
        simulatedTruckMarker.current = null;
      }
    };
  }, [currentPage, currentUser]);

  const triggerCalculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceInput.trim() || !destinationInput.trim()) return;

    setIsRouteLoading(true);
    setRouteResult(null);
    setIsSimulating(false);

    try {
      const res = await fetch("http://localhost:8000/api/v1/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: sourceInput,
          destination: destinationInput
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRouteResult(data);

        // Update leaflet map routing layers
        if (routingMapInstance.current) {
          import("leaflet").then((L) => {
            // Clean old layers
            if (routingRouteLineInstance.current) routingMapInstance.current.removeLayer(routingRouteLineInstance.current);
            if (routingStartMarkerInstance.current) routingMapInstance.current.removeLayer(routingStartMarkerInstance.current);
            if (routingEndMarkerInstance.current) routingMapInstance.current.removeLayer(routingEndMarkerInstance.current);
            if (simulatedTruckMarker.current) routingMapInstance.current.removeLayer(simulatedTruckMarker.current);

            // Start marker
            const startIcon = L.divIcon({
              className: 'routing-start-icon',
              html: `<div class="w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center text-slate-950 font-black text-xs shadow-lg animate-pulse">S</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });
            routingStartMarkerInstance.current = L.marker(data.source_coords, { icon: startIcon }).addTo(routingMapInstance.current);
            routingStartMarkerInstance.current.bindPopup(`<strong>Source Start Point</strong><br/>${data.source_resolved}`);

            // End marker
            const endIcon = L.divIcon({
              className: 'routing-end-icon',
              html: `<div class="w-8 h-8 rounded-full bg-red-500 border-4 border-slate-950 flex items-center justify-center text-white font-black text-xs shadow-lg">D</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });
            routingEndMarkerInstance.current = L.marker(data.destination_coords, { icon: endIcon }).addTo(routingMapInstance.current);
            routingEndMarkerInstance.current.bindPopup(`<strong>Destination Endpoint</strong><br/>${data.destination_resolved}`);

            // Draw line
            routingRouteLineInstance.current = L.polyline(data.route_geometry, {
              color: '#3b82f6',
              weight: 5,
              opacity: 0.85,
              lineJoin: 'round'
            }).addTo(routingMapInstance.current);

            routingMapInstance.current.fitBounds(routingRouteLineInstance.current.getBounds(), { padding: [50, 50] });
          });
        }
      } else {
        alert("Failed to calculate routing path. Please check input address details.");
      }
    } catch (e) {
      console.log("Routing error", e);
      alert("Error contacting routing server.");
    } finally {
      setIsRouteLoading(false);
    }
  };

  const runRoutingSimulation = () => {
    if (!routeResult || !routeResult.route_geometry || routeResult.route_geometry.length === 0) return;
    setIsSimulating(true);

    import("leaflet").then((L) => {
      // Clear old simulation marker
      if (simulatedTruckMarker.current) {
        try {
          routingMapInstance.current.removeLayer(simulatedTruckMarker.current);
        } catch (e) {}
        simulatedTruckMarker.current = null;
      }

      // Styled vehicle marker based on selected mode
      const getVehicleHTML = () => {
        switch (selectedVehicle) {
          case "Two-Wheeler":
            return `<div class="w-9 h-9 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg"><span class="text-xs">🛵</span></div>`;
          case "Auto-Rickshaw":
            return `<div class="w-9 h-9 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center shadow-lg"><span class="text-xs">🛺</span></div>`;
          case "Drone (Aerial)":
            return `<div class="w-9 h-9 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-lg animate-bounce"><span class="text-xs">🚁</span></div>`;
          case "Walking Courier":
            return `<div class="w-9 h-9 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-lg"><span class="text-xs">🏃</span></div>`;
          default: // Truck
            return `<div class="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg"><span class="text-xs">🚚</span></div>`;
        }
      };

      const vehicleIcon = L.divIcon({
        className: 'simulated-vehicle-icon',
        html: getVehicleHTML(),
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const geometry = routeResult.route_geometry;
      let index = 0;
      
      // Initialize vehicle marker at start point
      simulatedTruckMarker.current = L.marker(geometry[0], { icon: vehicleIcon }).addTo(routingMapInstance.current);

      const moveStep = () => {
        if (index >= geometry.length) {
          setIsSimulating(false);
          return;
        }
        if (simulatedTruckMarker.current && routingMapInstance.current) {
          simulatedTruckMarker.current.setLatLng(geometry[index]);
          // Center map on moving vehicle
          routingMapInstance.current.panTo(geometry[index]);
          index++;
          setTimeout(moveStep, 100); // 100ms per coordinates node step
        } else {
          setIsSimulating(false);
        }
      };

      moveStep();
    });
  };



  // Update map pin & accuracy boundary
  const updateMap = (lat: number, lon: number, label: string, pois: any[] = []) => {
    if (mapInstance.current) {
      import("leaflet").then((L) => {
        mapInstance.current.setView([lat, lon], 15);
        
        if (markerInstance.current) {
          markerInstance.current.setLatLng([lat, lon]);
        } else {
          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center shadow-lg animate-bounce"><div class="w-2 h-2 rounded-full bg-emerald-950"></div></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          });
          markerInstance.current = L.marker([lat, lon], { icon: customIcon }).addTo(mapInstance.current);
        }
        markerInstance.current.bindPopup(`<div class="text-black font-semibold text-xs">${label}</div>`).openPopup();

        // Accuracy Circle boundary
        if (circleInstance.current) {
          mapInstance.current.removeLayer(circleInstance.current);
        }
        circleInstance.current = L.circle([lat, lon], {
          radius: 120, // 120m accuracy boundary
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.15,
          weight: 2
        }).addTo(mapInstance.current);

        // Clean up old POI markers
        poiMarkersInstance.current.forEach((m) => {
          try {
            mapInstance.current.removeLayer(m);
          } catch (e) {}
        });
        poiMarkersInstance.current = [];

        // Color mapping for POIs
        const getPoiColor = (cat: string) => {
          switch (cat) {
            case "School": return "bg-blue-500 border-blue-900";
            case "Hospital": return "bg-red-500 border-red-900";
            case "Temple/Worship": return "bg-yellow-500 border-yellow-900";
            case "Bank": return "bg-indigo-500 border-indigo-900";
            case "Food/Cafe": return "bg-amber-500 border-amber-900";
            case "Shop/Store": return "bg-green-500 border-green-900";
            default: return "bg-slate-500 border-slate-900";
          }
        };

        if (pois && pois.length > 0) {
          pois.forEach((poi: any) => {
            const colorClass = getPoiColor(poi.category);
            const icon = L.divIcon({
              className: 'poi-div-icon',
              html: `<div class="w-6 h-6 rounded-full ${colorClass} border-2 flex items-center justify-center shadow-md hover:scale-125 transition-transform"><span class="text-[7px] text-white font-bold">${poi.category[0]}</span></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            const m = L.marker([poi.latitude, poi.longitude], { icon }).addTo(mapInstance.current);
            m.bindPopup(`<div class="text-black font-semibold text-xs p-1"><strong>${poi.name}</strong><br/><span class="text-[9px] text-slate-500">${poi.category} Landmark</span></div>`);
            poiMarkersInstance.current.push(m);
          });
        }
      });
    }
  };


  const handlePresetClick = (address: string) => {
    setAddressInput(address);
  };

  const triggerResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;

    setIsLoading(true);
    setResult(null);
    setAgentLogs([]);

    const steps = [
      { name: "language", log: "[Agent 1: Language Detection] Analyzing text syntax, script & translation..." },
      { name: "normalization", log: "[Agent 2: Normalization Agent] Resolving regional spelling typos and abbreviations..." },
      { name: "parsing", log: "[Agent 3: Address Parser Agent] Extracting house, street, locality, landmark details..." },
      { name: "pincode", log: "[Agent 4: Pincode Validation] Checking postal directories against ground truth..." },
      { name: "landmark", log: "[Agent 5: Landmark Retrieval] Querying landmarks via Overpass OpenStreetMap API..." },
      { name: "semantic", log: "[Agent 6: Semantic Matching] Compiling semantic similarities via text embeddings lookup..." },
      { name: "geo", log: "[Agent 7: Geo Resolution] Computing candidate weights and generating target coordinates..." },
      { name: "self", log: "[Agent 8: Self Verification] Sanity checking city boundaries & distance limits..." },
      { name: "evidence", log: "[Agent 9: Evidence Generator] Compiling verification trails and correction explanation..." }
    ];

    for (let step of steps) {
      setActiveAgent(step.name);
      setAgentLogs(prev => [...prev, step.log]);
      await new Promise(r => setTimeout(r, 220));
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          address: addressInput,
          user_id: currentUser ? currentUser.id : null,
          target_language: targetLanguage
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        updateMap(data.latitude, data.longitude, data.normalized_address);
        if (data.evidence && data.evidence.length > 0) {
          setAgentLogs(prev => [...prev, ...data.evidence]);
        }
        if (currentUser) {
          fetchStats(currentUser.id);
          fetchHistory(currentUser.id);
        }
      } else {
        setAgentLogs(prev => [...prev, "[Error] Pipeline resolution failed."]);
      }
    } catch (err) {
      setAgentLogs(prev => [...prev, "[Error] Connection to backend failed."]);
    } finally {
      setIsLoading(false);
      setActiveAgent(null);
    }
  };

  const downloadSampleCSV = () => {
    const sample = [
      "address",
      "Opposite Ganesh Temple Kothapet Hyderabad",
      "Flat 302 Sai Residency opposite post office Whitefield Bangalore",
      "Hanuman mandir daggara Ram Nagar Hyderabad",
      "Beside Dominos Pizza Linking Road Bandra West Mumbai 400050",
      "రామ మందిర్ దగ్గర కొత్తపేట హైదరాబాద్",
      "Ganesh templ Kothapeta Hyderbad 500038"
    ].join("\n");
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pataai_sample_addresses.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    setIsBulkRunning(true);
    setBulkProgress(0);
    setBulkResults([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setIsBulkRunning(false);
        return;
      }

      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        alert("The CSV file is empty.");
        setIsBulkRunning(false);
        return;
      }

      // --- Smart CSV column detection ---
      // Parse the header row to detect which column holds the address
      const headerRow = lines[0];
      const headerCols = headerRow.split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());
      const addressColIdx = headerCols.findIndex(h =>
        h === "address" || h === "messy_address" || h === "raw_address" ||
        h === "location" || h === "full_address" || h === "delivery_address" ||
        h === "messy address" || h === "raw address"
      );
      // If first column looks like a header (has letters), treat row 0 as header
      const hasHeader = /[a-zA-Z]/.test(headerRow.split(",")[0]);
      const startRow = hasHeader ? 1 : 0;
      const colIdx = addressColIdx >= 0 ? addressColIdx : 0;

      const addresses: string[] = [];
      for (let i = startRow; i < lines.length; i++) {
        const row = lines[i];
        if (!row) continue;
        // Handle quoted CSV fields
        const cols = row.match(/(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g) || [];
        let cell = cols[colIdx] ?? row;
        cell = cell.replace(/^"|"$/g, "").replace(/""/g, "").trim();
        if (cell) addresses.push(cell);
      }

      if (addresses.length === 0) {
        alert("No valid addresses found in the CSV. Make sure the file has an 'address' column or single-column address list.");
        setIsBulkRunning(false);
        return;
      }

      // --- Process addresses one-by-one with real-time progress ---
      const results: any[] = [];
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        setBulkProgress(Math.round(((i) / addresses.length) * 100));
        try {
          const res = await fetch("http://localhost:8000/api/v1/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: addr,
              user_id: currentUser ? currentUser.id : null
            })
          });
          if (res.ok) {
            const data = await res.json();
            results.push({
              address: addr,
              coordinates: data.latitude && data.longitude
                ? `${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`
                : "Failed",
              accuracy: `${Math.round(data.confidence)}%`,
              status: "Resolved",
              ok: true
            });
          } else {
            results.push({ address: addr, coordinates: "—", accuracy: "0%", status: "API Error", ok: false });
          }
        } catch {
          results.push({ address: addr, coordinates: "—", accuracy: "0%", status: "Connection Error", ok: false });
        }
        // Stream results as they come in
        setBulkResults([...results]);
      }

      setBulkProgress(100);
      setIsBulkRunning(false);
    };

    reader.readAsText(bulkFile);
  };

  const downloadBulkCSV = () => {
    if (bulkResults.length === 0) return;
    
    const headers = ["Messy Address", "Resolved Coordinates", "Confidence", "Status"];
    const rows = bulkResults.map(r => [
      `"${r.address.replace(/"/g, '""')}"`,
      `"${r.coordinates}"`,
      `"${r.accuracy}"`,
      `"${r.status}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `geocoded_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePlaygroundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApiRunning(true);
    setApiResponse('{\n  "status": "processing",\n  "logs": "Executing endpoint request..."\n}');
    try {
      const url = `http://localhost:8000${apiPath}`;
      let options: RequestInit = {
        method: apiMethod,
        headers: { "Content-Type": "application/json" }
      };

      if (apiMethod === "POST") {
        const parsedPayload = JSON.parse(apiPayload);
        options.body = JSON.stringify(parsedPayload);
      }

      const res = await fetch(url, options);
      if (res.ok) {
        const data = await res.json();
        setApiResponse(JSON.stringify(data, null, 2));
      } else {
        const err = await res.json();
        setApiResponse(JSON.stringify(err, null, 2));
      }
    } catch (err: any) {
      setApiResponse(`{\n  "error": "API Request Failed",\n  "message": "${err.message}"\n}`);
    } finally {
      setIsApiRunning(false);
    }
  };


  const copyCoordinates = () => {
    if (result) {
      const coords = `${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`;
      navigator.clipboard.writeText(coords);
      alert(`Copied coordinates: ${coords}`);
    }
  };

  const downloadJSON = () => {
    if (result) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `geocode_result.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const downloadPDF = () => {
    window.print();
  };

  const getLandmarksFromEvidence = () => {
    if (!result || !result.evidence) return [];
    const list: { name: string; lat: number; lon: number }[] = [];
    const regex = /(?:matching landmark|landmark|POI):\s*'([^']+)'\s*.*?\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/i;
    result.evidence.forEach((e: string) => {
      const match = e.match(regex);
      if (match) {
        list.push({
          name: match[1],
          lat: parseFloat(match[2]),
          lon: parseFloat(match[3])
        });
      }
    });
    return list;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        localStorage.setItem("pataai_user", JSON.stringify(data));
        fetchStats(data.id);
        fetchHistory(data.id);
        setLoginUsername("");
        setLoginPassword("");
      } else {
        const err = await res.json();
        setAuthError(err.detail);
      }
    } catch (err: any) {
      setAuthError(`Connection failed: ${err.message}`);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: registerUsername, password: registerPassword, role: registerRole })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        localStorage.setItem("pataai_user", JSON.stringify(data));
        fetchStats(data.id);
        fetchHistory(data.id);
        setRegisterUsername("");
        setRegisterPassword("");
      } else {
        const err = await res.json();
        setAuthError(err.detail);
      }
    } catch (err: any) {
      setAuthError(`Connection failed: ${err.message}`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("pataai_user");
    setCurrentPage("dashboard");
  };

  // Nav button active class toggle
  const navBtnClass = (page: string) => currentPage === page
    ? "flex items-center space-x-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-2 rounded-lg text-xs font-bold w-full text-left"
    : `flex items-center space-x-2 hover:bg-slate-800/60 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white w-full text-left transition`;

  // Login view if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl backdrop-blur-md animate-fade-in-up">
          <h2 className="text-xl font-bold tracking-wide text-center">
            {authMode === "login" ? "Sign In to PataAI" : "Create PataAI Account"}
          </h2>
          {authError && <p className="text-xs text-red-500 text-center font-semibold bg-red-500/10 p-2 rounded">{authError}</p>}
          
          <div key={authMode} className="animate-fade-in-up space-y-3">
            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 text-slate-400">Username</label>
                  <input 
                    type="text" 
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full text-xs p-2.5 rounded bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white placeholder-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 text-slate-400">Password</label>
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full text-xs p-2.5 rounded bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white placeholder-slate-600"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded text-xs mt-4 transition animate-pulse-subtle">Sign In</button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 text-slate-400">Username</label>
                  <input 
                    type="text" 
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    placeholder="Choose username"
                    className="w-full text-xs p-2.5 rounded bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white placeholder-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 text-slate-400">Password</label>
                  <input 
                    type="password" 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Choose password"
                    className="w-full text-xs p-2.5 rounded bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white placeholder-slate-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 text-slate-400">Account Role</label>
                  <select
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value)}
                    className="w-full text-xs p-2.5 rounded bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white"
                  >
                    <option value="Driver">Driver (Delivery Agent)</option>
                    <option value="Manager">Manager (Dispatch Operations)</option>
                    <option value="Admin">Admin (System Controls)</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded text-xs mt-4 transition">Create Account</button>
              </form>
            )}
          </div>

          <div className="text-center text-xs opacity-75 pt-2">
            {authMode === "login" ? (
              <span>Don't have an account? <button type="button" onClick={() => { setAuthError(""); setAuthMode("register"); }} className="text-emerald-500 font-semibold underline bg-transparent border-none p-0 cursor-pointer">Sign Up</button></span>
            ) : (
              <span>Already have an account? <button type="button" onClick={() => { setAuthError(""); setAuthMode("login"); }} className="text-emerald-500 font-semibold underline bg-transparent border-none p-0 cursor-pointer">Sign In</button></span>
            )}
          </div>
        </div>
      </div>
    );
  }


  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800";
  const cardClass = isDark ? "bg-slate-900/60 border-slate-800 text-white animate-fade-in" : "bg-white border-slate-200 text-slate-900 shadow-sm animate-fade-in";
  const innerCardClass = isDark ? "bg-slate-950/80 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-900";
  const asideClass = isDark ? "w-64 bg-slate-900/60 border-r border-slate-800 p-5 flex flex-col space-y-4" : "w-64 bg-white border-r border-slate-200 p-5 flex flex-col space-y-4";
  const inputClass = isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const headingColor = isDark ? "text-emerald-500" : "text-emerald-600 font-bold";

  return (
    <div className={`flex h-screen overflow-hidden ${bgClass}`}>
      
      {/* Sidebar Navigation */}
      <aside className={asideClass}>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-emerald-500 p-1.5 rounded text-slate-950 font-bold text-base">P</div>
          <div>
            <span className="font-bold tracking-wider text-sm block">PataAI Space</span>
            <span className="text-[9px] text-slate-400 block truncate">{currentUser.username} ({currentUser.role})</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <button onClick={() => setCurrentPage("dashboard")} className={navBtnClass("dashboard")}>
            <MapPin className="h-4 w-4" />
            <span>Single Address</span>
          </button>
          <button onClick={() => setCurrentPage("bulk")} className={navBtnClass("bulk")}>
            <Layers className="h-4 w-4" />
            <span>Bulk Geocoding</span>
          </button>
          <button onClick={() => setCurrentPage("routing")} className={navBtnClass("routing")}>
            <Navigation className="h-4 w-4 text-emerald-400" />
            <span>Route Planner</span>
          </button>
          <button onClick={() => setCurrentPage("analytics")} className={navBtnClass("analytics")}>
            <BarChart2 className="h-4 w-4" />
            <span>Analytics Stats</span>
          </button>
          <button onClick={() => setCurrentPage("audit")} className={navBtnClass("audit")}>
            <Shield className="h-4 w-4" />
            <span>Audit Ledger</span>
          </button>
          <button onClick={() => setCurrentPage("playground")} className={navBtnClass("playground")}>
            <Play className="h-4 w-4" />
            <span>API Playground</span>
          </button>
          <button onClick={() => setCurrentPage("developer")} className={navBtnClass("developer")}>
            <Key className="h-4 w-4" />
            <span>API Keys</span>
          </button>
          <button onClick={() => setCurrentPage("settings")} className={navBtnClass("settings")}>
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </nav>
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] px-3">
          <span className={textMuted}>Interface Theme</span>
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/20 transition text-[10px]"
          >
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
        <button 

          onClick={handleLogout}
          className="flex items-center space-x-2 text-slate-400 hover:text-red-400 text-xs font-semibold px-3 py-2 w-full text-left transition"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Workspace Window */}
      <main className="flex-1 p-8 overflow-y-auto flex flex-col space-y-6">

        {/* PAGE: Dashboard (Single Geocoding) */}
        {currentPage === "dashboard" && (
          <div className="flex flex-col space-y-5">
            
            {/* Multi-Agent state monitor */}
            <div className={`p-5 rounded-2xl border ${cardClass}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3">9-Agent Cooperative StateGraph</h3>
              <div className={`grid grid-cols-3 md:grid-cols-9 gap-1.5 text-center text-[10px] font-bold ${textMuted}`}>
                <div className={`border p-2 rounded transition ${isDark ? 'border-slate-800' : 'border-slate-200'} ${activeAgent === 'language' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}`}>1. Language</div>
                <div className={`border p-2 rounded transition ${isDark ? 'border-slate-800' : 'border-slate-200'} ${activeAgent === 'normalization' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}`}>2. Normalization</div>
                <div className={`border p-2 rounded transition ${isDark ? 'border-slate-800' : 'border-slate-200'} ${activeAgent === 'parsing' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}`}>3. Parser</div>
                <div className={`border p-2 rounded transition ${isDark ? 'border-slate-800' : 'border-slate-200'} ${activeAgent === 'pincode' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}`}>4. Pincode</div>
                <div className={`border p-2 rounded transition ${isDark ? 'border-slate-800' : 'border-slate-200'} ${activeAgent === 'landmark' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}`}>5. OSM Search</div>
                <div className={`border p-2 rounded transition ${isDark ? 'border-slate-800' : 'border-slate-200'} ${activeAgent === 'semantic' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}`}>6. Semantic</div>
                <div className={`border p-2 rounded transition ${isDark ? 'border-slate-800' : 'border-slate-200'} ${activeAgent === 'geo' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}`}>7. Resolution</div>
                <div className={`border p-2 rounded transition ${isDark ? 'border-slate-800' : 'border-slate-200'} ${activeAgent === 'self' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}`}>8. Self-Check</div>
                <div className={`border p-2 rounded transition ${isDark ? 'border-slate-800' : 'border-slate-200'} ${activeAgent === 'evidence' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}`}>9. Evidence</div>
              </div>
              <div className={`mt-4 p-3 rounded font-mono text-xs text-emerald-500 h-28 overflow-y-auto space-y-1 ${inputClass}`}>
                {agentLogs.length === 0 ? "> Orchestrator Idle..." : agentLogs.map((l, i) => <p key={i}>&gt; {l}</p>)}
              </div>
            </div>

            {/* Input & Maps container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Form & Presets */}
              <div className="flex flex-col space-y-4">
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <form onSubmit={triggerResolve} className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className={`block text-xs font-bold uppercase tracking-wider ${textMuted}`}>Unstructured Indian Address</label>
                        <button
                          type="button"
                          onClick={toggleListening}
                          className={`p-1.5 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse' : (isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200 text-slate-500 hover:text-slate-900')}`}
                          title={isListening ? "Listening... Click to stop" : "Speak to enter address"}
                        >
                          <Mic className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="Opposite Ganesh Temple Kothapet Hyderabad..."
                        className={`w-full rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500 resize-none ${inputClass}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Output Translation Language</label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className={`w-full rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 ${inputClass}`}
                      >
                        <option value="English">English (Standard)</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Telugu">Telugu (తెలుగు)</option>
                        <option value="Tamil">Tamil (தமிழ்)</option>
                        <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                        <option value="Malayalam">Malayalam (മലയാളം)</option>
                        <option value="Bengali">Bengali (বাংলা)</option>
                        <option value="Marathi">Marathi (मराठी)</option>
                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                        <option value="Urdu">Urdu (اردو)</option>
                        <option value="Sanskrit">Sanskrit (संस्कृतम्)</option>
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="German">German (Deutsch)</option>
                        <option value="French">French (Français)</option>
                        <option value="Japanese">Japanese (日本語)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition"
                    >
                      {isLoading ? "Running Agents..." : "Analyze Address"}
                    </button>
                  </form>
                </div>

                {/* Presets */}
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Test Address Presets</h4>
                  <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto">
                    {PRESETS.map((p, i) => (
                      <button 
                        key={i} 
                        onClick={() => handlePresetClick(p.address)}
                        className="text-left text-[11px] p-2 rounded hover:border-emerald-500/50 border border-slate-800 bg-slate-950/40 transition flex justify-between items-center"
                      >
                        <span className="truncate max-w-[150px]">{p.title}</span>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-950/20 text-emerald-500">{p.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Maps & Result Screen */}
              <div className="lg:col-span-2 flex flex-col space-y-4">
                
                {/* Map element */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-[300px] relative">
                  <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />
                  {/* Floating Layer Control */}
                  <div className="absolute top-3 right-3 z-[1000] flex space-x-1 bg-slate-950/90 border border-slate-800 p-1 rounded-lg shadow-2xl">
                    <button 
                      type="button"
                      onClick={() => updateTileLayer('dark')} 
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all duration-200 ${mapLayer === 'dark' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                    >
                      Dark
                    </button>
                    <button 
                      type="button"
                      onClick={() => updateTileLayer('satellite')} 
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all duration-200 ${mapLayer === 'satellite' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                    >
                      Satellite
                    </button>
                    <button 
                      type="button"
                      onClick={() => updateTileLayer('terrain')} 
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all duration-200 ${mapLayer === 'terrain' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                    >
                      Terrain
                    </button>
                    <button 
                      type="button"
                      onClick={() => updateTileLayer('streets')} 
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all duration-200 ${mapLayer === 'streets' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
                    >
                      Streets
                    </button>
                  </div>
                </div>


                {/* Interactive Landmarks List */}
                {result && getLandmarksFromEvidence().length > 0 && (
                  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contextual Landmarks Audited</h4>
                    <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin">
                      {getLandmarksFromEvidence().map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (mapInstance.current) {
                              mapInstance.current.setView([item.lat, item.lon], 17);
                              import("leaflet").then((L) => {
                                L.popup()
                                  .setLatLng([item.lat, item.lon])
                                  .setContent(`<div class="text-black font-semibold text-xs">${item.name} (Audited POI)</div>`)
                                  .openOn(mapInstance.current);
                              });
                            }
                          }}
                          className="flex-shrink-0 bg-slate-950 hover:border-emerald-500 border border-slate-800 p-2.5 rounded-lg text-left text-[11px] space-y-1 transition max-w-[150px]"
                        >
                          <span className="font-bold text-white block truncate">{item.name}</span>
                          <span className="text-[9px] text-slate-400 block truncate">{item.lat.toFixed(4)}, {item.lon.toFixed(4)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result Info Card */}
                {result && (
                  <div className={`p-5 rounded-2xl border ${cardClass} grid grid-cols-1 md:grid-cols-2 gap-4 text-xs`}>
                    <div className="space-y-3">
                      <div className={`flex justify-between items-center p-3 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800/60' : 'bg-slate-100/40 border-slate-200/60'}`}>
                        <div className="flex items-center space-x-3">
                          {/* Circular SVG Confidence Gauge */}
                          <div className="relative flex items-center justify-center h-14 w-14">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="28" cy="28" r="23" className={isDark ? "stroke-slate-800" : "stroke-slate-200"} strokeWidth="4" fill="transparent" />
                              <circle cx="28" cy="28" r="23" className="stroke-emerald-500 transition-all duration-1000" strokeWidth="4" fill="transparent"
                                strokeDasharray={144.5} strokeDashoffset={144.5 - (144.5 * result.confidence) / 100} strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-[10px] font-black text-emerald-400">{result.confidence}%</span>
                          </div>
                          <div>
                            <span className={`block uppercase text-[8px] tracking-wider ${textMuted}`}>Resolution Status</span>
                            <span className="font-bold text-xs block">Confidence Approved</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button onClick={copyCoordinates} className={`p-1.5 rounded-lg border hover:bg-emerald-500 hover:text-slate-950 transition ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`} title="Copy Coordinates"><Clipboard className="h-3.5 w-3.5" /></button>
                          <button onClick={downloadJSON} className={`p-1.5 rounded-lg border hover:bg-emerald-500 hover:text-slate-950 transition ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`} title="Download JSON"><Download className="h-3.5 w-3.5" /></button>
                          <button onClick={downloadPDF} className={`p-1.5 rounded-lg border hover:bg-emerald-500 hover:text-slate-950 transition ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`} title="Print Invoice PDF"><FileText className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <div className={`p-3.5 rounded-xl border space-y-2.5 mt-1 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/80 border-slate-200'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] uppercase font-bold tracking-wider ${textMuted}`}>Multi-Language AI Translator</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-[9px]">
                            {result.detected_language || "English (Standard)"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className={`block text-[9px] font-bold uppercase tracking-wider ${textMuted}`}>Clean Normalization Output</span>
                          <span className={`font-bold text-xs block p-2.5 rounded-lg border leading-relaxed ${isDark ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>{result.normalized_address}</span>
                        </div>
                      </div>

                      {result.parsed_components && (
                        <div className={`p-3.5 rounded-xl border space-y-2 mt-1 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/80 border-slate-200'}`}>
                          <span className={`block text-[9px] uppercase font-bold tracking-wider ${textMuted}`}>Structured Address Parser</span>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className={`block text-[8px] uppercase font-semibold ${textMuted}`}>House No</span>
                              <span className="font-bold block truncate">{result.parsed_components.house_number || "—"}</span>
                            </div>
                            <div>
                              <span className={`block text-[8px] uppercase font-semibold ${textMuted}`}>Building / Apt</span>
                              <span className="font-bold block truncate">{result.parsed_components.building_name || "—"}</span>
                            </div>
                            <div>
                              <span className={`block text-[8px] uppercase font-semibold ${textMuted}`}>Street / Road</span>
                              <span className="font-bold block truncate">{result.parsed_components.street_road || "—"}</span>
                            </div>
                            <div>
                              <span className={`block text-[8px] uppercase font-semibold ${textMuted}`}>Colony / Locality</span>
                              <span className="font-bold block truncate">{result.parsed_components.colony_colony_name || "—"}</span>
                            </div>
                            <div>
                              <span className={`block text-[8px] uppercase font-semibold ${textMuted}`}>Landmark</span>
                              <span className="font-bold block truncate text-emerald-500">{result.parsed_components.landmark || "—"}</span>
                            </div>
                            <div>
                              <span className={`block text-[8px] uppercase font-semibold ${textMuted}`}>City / District</span>
                              <span className="font-bold block truncate">{result.parsed_components.city_district || "—"}</span>
                            </div>
                            <div>
                              <span className={`block text-[8px] uppercase font-semibold ${textMuted}`}>State</span>
                              <span className="font-bold block truncate">{result.parsed_components.state || "—"}</span>
                            </div>
                            <div>
                              <span className={`block text-[8px] uppercase font-semibold ${textMuted}`}>Pincode</span>
                              <span className="font-bold block truncate text-yellow-500 font-mono">{result.parsed_components.pincode || "—"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <span className={`block uppercase text-[9px] ${textMuted}`}>Decision Cost</span>
                          <span className={`font-semibold text-emerald-500 block p-1.5 rounded border text-[10px] ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                            ₹ {result.cost_inr.toFixed(3)} (${result.cost_usd.toFixed(4)})
                          </span>
                        </div>
                        <div>
                          <span className={`block uppercase text-[9px] ${textMuted}`}>Model Agent Stack</span>
                          <span className={`font-semibold block p-1.5 rounded border text-[10px] truncate ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`} title={result.model_used}>
                            {result.model_used}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        <div>
                          <span className={`block uppercase text-[9px] ${textMuted}`}>LATITUDE</span>
                          <span className="font-bold text-xs">{result.latitude ? result.latitude.toFixed(6) : "—"}</span>
                        </div>
                        <div>
                          <span className={`block uppercase text-[9px] ${textMuted}`}>LONGITUDE</span>
                          <span className="font-bold text-xs">{result.longitude ? result.longitude.toFixed(6) : "—"}</span>
                        </div>
                      </div>
                      {result.risk_warning && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-2 rounded text-[10px] mt-2">
                          <strong>Notice:</strong> {result.risk_warning}
                        </div>
                      )}
                      <div className={`text-[10px] mt-2 p-3 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-100/50 border-slate-200/80'}`}>
                        <strong className={`block text-[8px] uppercase tracking-wider ${textMuted}`}>Agent Evidence Timeline</strong>
                        <div className="space-y-2.5 relative before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-emerald-500/20 pl-1">
                          {result.evidence && result.evidence.slice(-4).map((log: string, logIdx: number) => (
                            <div key={logIdx} className="relative pl-5 flex items-start space-x-1.5 text-[9px] group">
                              <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-slate-950 group-hover:scale-125 transition-transform duration-200 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              <div className="flex-1 font-mono text-slate-300 leading-relaxed truncate" title={log}>
                                {log.replace(/^\[.*?\]\s*/, "")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* PAGE: Bulk Upload */}
        {currentPage === "bulk" && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-emerald-500">CSV Bulk Geocoding</h2>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="text-[10px] font-semibold text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg hover:bg-emerald-500/10 transition"
                >
                  Download Sample CSV
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-1">Upload a CSV file with an <code className="text-emerald-400">address</code> column (or single-column list). Supports Hindi, Telugu, Hinglish, and typo-laden addresses.</p>
              <p className="text-[10px] text-slate-500 mb-4">Supported headers: <code>address</code>, <code>messy_address</code>, <code>raw_address</code>, <code>location</code>, <code>delivery_address</code></p>

              <form onSubmit={handleBulkSubmit} className="space-y-3">
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-emerald-500/40 transition">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e: any) => setBulkFile(e.target.files[0])}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-600 cursor-pointer"
                  />
                  {bulkFile && <p className="text-[10px] text-emerald-400 mt-2">Selected: {bulkFile.name}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isBulkRunning || !bulkFile}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  {isBulkRunning ? (
                    <><span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>Processing {bulkProgress}% — {bulkResults.length} resolved...</>
                  ) : "Upload & Geocode All Addresses"}
                </button>
              </form>

              {isBulkRunning && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Geocoding Progress</span>
                    <span>{bulkProgress}% — {bulkResults.filter(r => r.ok).length} resolved / {bulkResults.filter(r => !r.ok).length} failed</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${bulkProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {bulkResults.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider">Geocoding Results</h3>
                    <div className="flex gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{bulkResults.filter(r => r.ok).length} Resolved</span>
                      {bulkResults.filter(r => !r.ok).length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">{bulkResults.filter(r => !r.ok).length} Failed</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        Avg {bulkResults.filter(r => r.ok).length > 0
                          ? Math.round(bulkResults.filter(r => r.ok).reduce((sum, r) => sum + parseInt(r.accuracy), 0) / bulkResults.filter(r => r.ok).length)
                          : 0}% confidence
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={downloadBulkCSV}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-bold px-4 py-1.5 rounded-lg transition"
                  >
                    Download Results CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 pr-4">#</th>
                        <th className="pb-2 pr-4">Input Address</th>
                        <th className="pb-2 pr-4">Resolved Coordinates</th>
                        <th className="pb-2 pr-4">Confidence</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.map((r, i) => (
                        <tr key={i} className={`border-b border-slate-800/40 ${r.ok ? '' : 'opacity-60'}` }>
                          <td className="py-2.5 pr-4 text-slate-500">{i + 1}</td>
                          <td className="py-2.5 pr-4 max-w-[240px]">
                            <span className="truncate block" title={r.address}>{r.address}</span>
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-emerald-400">{r.coordinates}</td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-1.5 rounded-full bg-emerald-500"
                                  style={{ width: r.accuracy }}
                                />
                              </div>
                              <span className="text-emerald-400">{r.accuracy}</span>
                            </div>
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              r.ok
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAGE: Route Planner */}
        {currentPage === "routing" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column: Form and Stats Comparison */}
            <div className="flex flex-col space-y-4">
              <div className={`p-6 rounded-2xl border ${cardClass}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-4">Route Planner (OSRM Live Routing)</h3>
                <form onSubmit={triggerCalculateRoute} className="space-y-4">
                  <div className="space-y-1">
                    <label className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Source Address</label>
                    <input 
                      type="text"
                      value={sourceInput}
                      onChange={(e) => setSourceInput(e.target.value)}
                      placeholder="e.g. Ganesh Temple Kothapet Hyderabad"
                      className={`w-full rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 ${inputClass}`}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`block text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Destination Address</label>
                    <input 
                      type="text"
                      value={destinationInput}
                      onChange={(e) => setDestinationInput(e.target.value)}
                      placeholder="e.g. Apollo Hospital Jubilee Hills Hyderabad"
                      className={`w-full rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 ${inputClass}`}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isRouteLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition"
                  >
                    {isRouteLoading ? "Calculating Path..." : "Calculate Route"}
                  </button>
                </form>

                {/* Preset Fast Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <span className={`block text-[9px] uppercase font-bold tracking-wider ${textMuted}`}>Sample Scenarios</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => {
                        setSourceInput("Opposite Ganesh Temple Kothapet Hyderabad");
                        setDestinationInput("Sarathi Studios Ameerpet Yousufguda Hyderabad");
                      }}
                      className={`text-[9px] font-semibold p-1.5 rounded border text-left truncate transition ${isDark ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                      Kothapet ➔ Ameerpet
                    </button>
                    <button 
                      onClick={() => {
                        setSourceInput("Charminar Laad Bazar Hyderabad");
                        setDestinationInput("Cyber Towers Madhapur Hyderabad");
                      }}
                      className={`text-[9px] font-semibold p-1.5 rounded border text-left truncate transition ${isDark ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                      Charminar ➔ Hitec City
                    </button>
                  </div>
                </div>
              </div>

              {/* Travel Metrics Comparison Panel */}
              {routeResult && (
                <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Dispatch Comparison</h4>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {routeResult.distance_km} KM
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {Object.entries(routeResult.modes).map(([modeName, info]: [string, any]) => (
                      <div 
                        key={modeName}
                        onClick={() => setSelectedVehicle(modeName)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${selectedVehicle === modeName ? 'border-emerald-500 bg-emerald-500/5' : (isDark ? 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100')}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">
                              {modeName === "Truck" ? "🚚" : modeName === "Two-Wheeler" ? "🛵" : modeName === "Auto-Rickshaw" ? "🛺" : modeName === "Drone (Aerial)" ? "🚁" : "🏃"}
                            </span>
                            <div>
                              <strong className="block text-[11px] font-bold">{modeName}</strong>
                              <span className={`text-[9px] block ${textMuted}`}>{info.label}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black block text-emerald-400">{info.time_mins} Min</span>
                            <span className="text-[8px] text-slate-500 block">{info.avg_speed_kph} KPH avg</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-800/40 text-[8px] opacity-75">
                          <span>Carbon Emitted: <span className="font-bold">{info.carbon_emissions_g}g</span></span>
                          {info.carbon_emissions_g === 0 && <span className="text-emerald-400 font-bold">🌱 Zero Emission EV</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={runRoutingSimulation}
                    disabled={isSimulating}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center space-x-2"
                  >
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span>{isSimulating ? "Simulation Active..." : "Simulate Travel Journey"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Route Map and Info Banner */}
            <div className="lg:col-span-2 flex flex-col space-y-4">
              <div className={`p-4 rounded-2xl border ${cardClass} flex-1 min-h-[500px] flex flex-col relative`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Geodetic Route Topology Map</h3>
                  <span className={`text-[10px] ${textMuted}`}>Double click points to explore</span>
                </div>
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 relative" style={{ minHeight: '440px' }}>
                  <div ref={routingMapRef} className="absolute inset-0 z-10" />
                </div>
              </div>

              {routeResult && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed grid grid-cols-2 gap-4 ${innerCardClass}`}>
                  <div>
                    <span className="font-bold text-yellow-500 uppercase block mb-1 text-[10px]">Source Geocoded Hub</span>
                    <p className="opacity-90">{routeResult.source_resolved}</p>
                    <span className="text-[10px] opacity-60 font-mono">[{routeResult.source_coords[0].toFixed(5)}, {routeResult.source_coords[1].toFixed(5)}]</span>
                  </div>
                  <div>
                    <span className="font-bold text-emerald-500 uppercase block mb-1 text-[10px]">Destination Geocoded Hub</span>
                    <p className="opacity-90">{routeResult.destination_resolved}</p>
                    <span className="text-[10px] opacity-60 font-mono">[{routeResult.destination_coords[0].toFixed(5)}, {routeResult.destination_coords[1].toFixed(5)}]</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* PAGE: Analytics */}
        {currentPage === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${cardClass}`}>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>Total Resolved Drops</span>
                <h2 className="text-2xl font-black mt-1 text-emerald-500">{stats.total_resolved}</h2>
              </div>
              <div className={`p-4 rounded-xl border ${cardClass}`}>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>Avg Accuracy</span>
                <h2 className="text-2xl font-black mt-1 text-emerald-500">{stats.success_rate}%</h2>
              </div>
              <div className={`p-4 rounded-xl border ${cardClass}`}>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>Calls Saved</span>
                <h2 className="text-2xl font-black mt-1 text-emerald-500">{stats.delivery_calls_saved}</h2>
              </div>
              <div className={`p-4 rounded-xl border ${cardClass}`}>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${textMuted}`}>Carbon Reduced</span>
                <h2 className="text-2xl font-black mt-1 text-emerald-500">{stats.co2_reduced_kg} kg</h2>
              </div>
            </div>

            {currentUser.role === "Admin" && (
              <div className={`p-5 rounded-2xl border ${cardClass} space-y-4`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500">System AI Models Registry & Configuration</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b opacity-75 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <th className="pb-2">Model Identifier</th>
                        <th className="pb-2">Role description</th>
                        <th className="pb-2">Fallback order</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeModels.map((m: any, idx: number) => (
                        <tr key={idx} className={`border-b ${isDark ? 'border-slate-800/40' : 'border-slate-200/40'}`}>
                          <td className="py-2.5 font-mono text-emerald-400">{m.model_name}</td>
                          <td className="py-2.5">{m.role}</td>
                          <td className="py-2.5 font-bold">{m.priority_order}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px]">ACTIVE</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={`p-3 rounded-lg text-[11px] leading-relaxed ${innerCardClass}`}>
                  <strong className="text-yellow-500 uppercase block mb-1">Model Distribution Info</strong>
                  <p>Our Multi-Agent Cooperative StateGraph uses semantic mapping logic to assign sub-tasks to Groq (Llama-3-70b-Tool-Use) and Google Gemini Flash depending on input language and script complexity. Rule-based offline fallbacks are dynamically prioritized to ensure SLA guarantees even in network constraints.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SVG interactive dashboard charts */}
              <div className={`p-5 rounded-2xl border ${cardClass} space-y-4`}>
                <h3 className="text-xs font-bold uppercase tracking-wider">Processing Latency Distribution</h3>
                <div className={`h-44 flex items-end justify-between px-4 pb-2 border-b border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="w-8 bg-emerald-500/20 hover:bg-emerald-500 h-28 rounded-t transition flex items-center justify-center text-[10px]">120</div>
                  <div className="w-8 bg-emerald-500/20 hover:bg-emerald-500 h-24 rounded-t transition flex items-center justify-center text-[10px]">115</div>
                  <div className="w-8 bg-emerald-500/20 hover:bg-emerald-500 h-32 rounded-t transition flex items-center justify-center text-[10px]">128</div>
                  <div className="w-8 bg-emerald-500/20 hover:bg-emerald-500 h-20 rounded-t transition flex items-center justify-center text-[10px]">110</div>
                  <div className="w-8 bg-emerald-500/20 hover:bg-emerald-500 h-26 rounded-t transition flex items-center justify-center text-[10px]">121</div>
                </div>
              </div>
              <div className={`p-5 rounded-2xl border ${cardClass} space-y-4`}>
                <h3 className="text-xs font-bold uppercase tracking-wider">Accuracy Confidence Share</h3>
                <div className={`h-44 flex items-end justify-around pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="text-center space-y-1">
                    <div className="w-12 bg-emerald-500 h-32 rounded-t"></div>
                    <span className="text-[9px] block">90%+</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="w-12 bg-blue-500 h-12 rounded-t"></div>
                    <span className="text-[9px] block">80-90%</span>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="w-12 bg-amber-500 h-6 rounded-t"></div>
                    <span className="text-[9px] block">70-80%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE: Audit Timeline */}
        {currentPage === "audit" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-500">Reversible Auditing Ledger</h2>
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 relative group hover:border-slate-700 transition duration-200">
                  <div className="flex justify-between items-center text-[10px] opacity-75">
                    <span>{new Date(h.created_at).toLocaleString()}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-emerald-500">{h.confidence}% Confidence</span>
                      <button
                        onClick={() => handleDeleteHistoryItem(h.id)}
                        className="text-slate-500 hover:text-red-500 transition duration-150 p-1 rounded"
                        title="Delete log item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <strong className="text-yellow-500 block text-[9px] uppercase">Original (Masked for Privacy)</strong>
                      <p className="opacity-75 mt-0.5 truncate">{h.original_address}</p>
                    </div>
                    <div>
                      <strong className="text-emerald-500 block text-[9px] uppercase">Normalized Geocode</strong>
                      <p className="opacity-90 mt-0.5 truncate">{h.normalized_address}</p>
                    </div>
                  </div>
                  <div className="text-[10px] opacity-50 font-mono">
                    User: {h.username}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAGE: API Playground */}
        {currentPage === "playground" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-500">REST API Tester</h2>
              <div className="text-xs space-y-3">
                <div>
                  <span className="block mb-1 text-slate-400">Target Endpoint</span>
                  <select
                    className="w-full text-xs p-2 rounded bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    value={`${apiMethod} ${apiPath.split('?')[0]}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "POST /api/v1/resolve") {
                        setApiMethod("POST");
                        setApiPath("/api/v1/resolve");
                        setApiPayload('{\n  "address": "Opposite Ganesh Temple Kothapet Hyderabad",\n  "user_id": 1\n}');
                      } else if (val === "GET /api/v1/history") {
                        setApiMethod("GET");
                        setApiPath(`/api/v1/history?user_id=${currentUser ? currentUser.id : 1}`);
                        setApiPayload("");
                      } else if (val === "GET /api/v1/stats") {
                        setApiMethod("GET");
                        setApiPath(`/api/v1/stats?user_id=${currentUser ? currentUser.id : 1}`);
                        setApiPayload("");
                      }
                      setApiResponse('{\n  "status": "ready",\n  "logs": "Endpoint selection updated. Press Try API."\n}');
                    }}
                  >
                    <option value="POST /api/v1/resolve">POST /api/v1/resolve (Resolve Messy Address)</option>
                    <option value="GET /api/v1/history">GET /api/v1/history (Fetch Resolve History)</option>
                    <option value="GET /api/v1/stats">GET /api/v1/stats (Fetch Performance Metrics)</option>
                  </select>
                </div>
                <p className="text-[10px]"><strong>Request URL:</strong> <code className="bg-slate-950 p-1 rounded border border-slate-800 font-mono text-emerald-400">http://localhost:8000{apiPath}</code></p>
                {apiMethod === "POST" && (
                  <div>
                    <span className="block mb-1 text-slate-400">Payload JSON</span>
                    <textarea 
                      rows={4}
                      className="w-full font-mono text-[11px] p-2.5 rounded bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      value={apiPayload}
                      onChange={(e) => setApiPayload(e.target.value)}
                    />
                  </div>
                )}
                <button 
                  onClick={handlePlaygroundSubmit}
                  disabled={isApiRunning}
                  className="bg-emerald-500 text-slate-950 font-bold py-2 px-5 rounded-lg text-xs transition hover:bg-emerald-600"
                >
                  {isApiRunning ? "Sending..." : "Try API"}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-500">Response Payload (JSON)</h2>
              <pre className="p-3 rounded font-mono text-[11px] overflow-x-auto min-h-[180px] bg-slate-950 text-emerald-500 border border-slate-800">
                {apiResponse}
              </pre>
            </div>
          </div>
        )}

        {/* PAGE: API Keys */}
        {currentPage === "developer" && (
          <div className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-emerald-500 mb-1">Developer Registry</h2>
                  <p className="text-xs opacity-75">Generate and configure API keys for enterprise integration in shipping / CRM platforms.</p>
                </div>
                <button 
                  onClick={generateApiKey}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-4 rounded-lg text-xs transition"
                >
                  + Generate live key
                </button>
              </div>

              {apiKeys.length === 0 ? (
                <div className="text-center py-6 bg-slate-950 rounded-xl border border-slate-800 text-xs opacity-50">
                  No active API keys found. Generate one above to access the API endpoints.
                </div>
              ) : (
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 opacity-75 bg-slate-900/40">
                        <th className="p-3">API Key ID</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.map((k, i) => (
                        <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-900/20">
                          <td className="p-3 font-mono text-emerald-400 select-all">{k}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 font-bold text-[9px]">ACTIVE</span>
                          </td>
                          <td className="p-3 text-right">
                            <button 
                              onClick={() => deleteApiKey(k)}
                              className="text-red-400 hover:text-red-300 font-semibold transition text-[10px]"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE: Settings */}
        {currentPage === "settings" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {currentUser.role === "Admin" ? (
              <div className="space-y-6">
                
                {/* Block 1: Dynamic Cooperative System Tuners */}
                <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-500 border-b border-slate-800/80 pb-2">Cooperative Agent Parameters</h2>
                  
                  {settingsMessage && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-xs font-semibold">
                      {settingsMessage}
                    </div>
                  )}

                  <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/40">
                        <div>
                          <strong className="block">Enable Landmark Cache</strong>
                          <span className={`text-[10px] block ${textMuted}`}>Use SQLite LandmarkCache before querying live OSM Overpass API</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCachingEnabled(!cachingEnabled)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${cachingEnabled ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                        >
                          {cachingEnabled ? "ENABLED" : "DISABLED"}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-400 uppercase text-[10px]">LLM API Timeout (Seconds)</label>
                          <span className="font-bold font-mono text-emerald-400 text-xs">{llmTimeoutSeconds}s</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="30"
                          step="1"
                          value={llmTimeoutSeconds}
                          onChange={(e) => setLlmTimeoutSeconds(Number(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                        <span className={`text-[9px] block ${textMuted}`}>Maximum timeout for API requests to Groq and Gemini before failing</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-slate-400 uppercase text-[10px]">Fallback Confidence Threshold</label>
                          <span className="font-bold font-mono text-emerald-400 text-xs">{fallbackConfidenceThreshold}%</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="95"
                          step="5"
                          value={fallbackConfidenceThreshold}
                          onChange={(e) => setFallbackConfidenceThreshold(Number(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                        <span className={`text-[9px] block ${textMuted}`}>Score below which system triggers fallback geocoding providers</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-bold text-slate-400 uppercase text-[10px]">Cache TTL Lifespan (Hours)</label>
                        <input
                          type="number"
                          min="1"
                          max="720"
                          value={cacheTtlHours}
                          onChange={(e) => setCacheTtlHours(Number(e.target.value))}
                          className={`w-full text-xs p-2 rounded-lg border ${inputClass}`}
                        />
                        <span className={`text-[9px] block ${textMuted}`}>Duration in hours before cached landmarks are evicted from cache</span>
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-5 rounded-lg text-xs transition"
                      >
                        Save Parameter Settings
                      </button>
                    </div>
                  </form>
                </div>

                {/* Block 2: System API Keys Configuration */}
                <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-500 border-b border-slate-800/80 pb-2">System API Keys Configuration</h2>
                  
                  {keysMessage && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg text-xs font-semibold">
                      {keysMessage}
                    </div>
                  )}

                  <form onSubmit={handleUpdateKeys} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-400">LOCATIONIQ API KEY</label>
                        <input 
                          type="password" 
                          value={liqKeyInput} 
                          onChange={(e) => setLiqKeyInput(e.target.value)}
                          placeholder="Enter LocationIQ API Key" 
                          className={`w-full font-mono text-xs p-2.5 rounded-lg border ${inputClass}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-400">OPENCAGE API KEY</label>
                        <input 
                          type="password" 
                          value={ocKeyInput} 
                          onChange={(e) => setOcKeyInput(e.target.value)}
                          placeholder="Enter OpenCage API Key" 
                          className={`w-full font-mono text-xs p-2.5 rounded-lg border ${inputClass}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-400">GROQ API KEY</label>
                        <input 
                          type="password" 
                          value={groqKeyInput} 
                          onChange={(e) => setGroqKeyInput(e.target.value)}
                          placeholder="Enter Groq API Key" 
                          className={`w-full font-mono text-xs p-2.5 rounded-lg border ${inputClass}`}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-5 rounded-lg text-xs transition"
                    >
                      Save Key Configuration
                    </button>
                  </form>
                </div>

                {/* Block 3: Database Reset Operations (Maintenance & Purges) */}
                <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 border-b border-slate-800/80 pb-2">Database Maintenance & Purges</h2>
                  <p className={`text-[11px] leading-relaxed ${textMuted}`}>Run administrative maintenance routines below to wipe tables or seed data directory assets. Confirmations are required before execution.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2.5 flex flex-col justify-between">
                      <div>
                        <strong className="block text-white text-[11px]">Purge Geocoding Ledger</strong>
                        <span className={`text-[9px] block leading-relaxed mt-0.5 ${textMuted}`}>Truncates the resolve requests table and associated evidence logs. Wipes all history dashboard cards.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 font-bold py-1.5 rounded text-[10px] transition"
                      >
                        Purge History Ledger
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2.5 flex flex-col justify-between">
                      <div>
                        <strong className="block text-white text-[11px]">Purge Landmark Cache</strong>
                        <span className={`text-[9px] block leading-relaxed mt-0.5 ${textMuted}`}>Clears all OSM Overpass response queries saved locally in the SQLite cache table. Forces live OSM calls.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearCache}
                        className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 font-bold py-1.5 rounded text-[10px] transition"
                      >
                        Purge Landmark Cache
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2.5 flex flex-col justify-between">
                      <div>
                        <strong className="block text-white text-[11px]">Re-Seed All-India Pincodes</strong>
                        <span className={`text-[9px] block leading-relaxed mt-0.5 ${textMuted}`}>Wipes all 150K records and runs seed_db script to re-download postal indices directory.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleReSeedDb}
                        className="w-full bg-yellow-500/10 hover:bg-yellow-500 hover:text-slate-950 border border-yellow-500/30 text-yellow-400 font-bold py-1.5 rounded text-[10px] transition"
                      >
                        Re-Seed Database Directory
                      </button>
                    </div>
                  </div>
                </div>

                {/* Block 4: Cooperative LLM Agent Monitor */}
                <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-500 border-b border-slate-800/80 pb-2">Cooperative Agent Monitor</h2>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-800 opacity-75">
                          <th className="pb-2">API Agent Service</th>
                          <th className="pb-2">Role Description</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-800/40">
                          <td className="py-2.5 font-mono text-emerald-400">Groq Llama-3-70B API</td>
                          <td className="py-2.5">Primary language script classifier, typo expansion normalizer, and address tag parser.</td>
                          <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px]">ACTIVE</span></td>
                        </tr>
                        <tr className="border-b border-slate-800/40">
                          <td className="py-2.5 font-mono text-emerald-400">Google Gemini 1.5 Flash</td>
                          <td className="py-2.5">Alternate secondary fallback orchestrator, active if Groq rate limits are encountered.</td>
                          <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[9px]">STANDBY</span></td>
                        </tr>
                        <tr className="border-b border-slate-800/40">
                          <td className="py-2.5 font-mono text-emerald-400">OSM Overpass REST API</td>
                          <td className="py-2.5">Surrounding Landmark retrieval agent client. Fetches schools, temples, hospitals.</td>
                          <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px]">ACTIVE</span></td>
                        </tr>
                        <tr className="border-b border-slate-800/40">
                          <td className="py-2.5 font-mono text-emerald-400">LocationIQ Geocoding API</td>
                          <td className="py-2.5">Primary geocoding client for location centroids verification.</td>
                          <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px]">ACTIVE</span></td>
                        </tr>
                        <tr className="border-b border-slate-800/40">
                          <td className="py-2.5 font-mono text-emerald-400">OpenCage Geocoder API</td>
                          <td className="py-2.5">Secondary geocoding client, active if primary geocoder fails.</td>
                          <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px]">ACTIVE</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className={`p-6 rounded-2xl border ${cardClass} space-y-4`}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-500 border-b border-slate-800 pb-2">Profile & Privacy Settings</h2>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">DPDP Address Retention Policy</p>
                      <p className={`opacity-75 ${textMuted}`}>Clear original address strings from RAM instantly post-geocoding.</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-500">ACTIVE</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
