import { PlanetData, UserProfile } from "./github";

export function generateUniverseSVG(user: UserProfile, planets: PlanetData[]): string {
  const width = 800;
  const height = 600;
  const cx = width / 2;
  const cy = height / 2;

  // Configuration
  const cycleDuration = 4; // Seconds per planet in the HUD
  const totalCycleTime = planets.length * cycleDuration;

  // Mood colors for definitions
  const moodColors: Record<string, string> = {
    happy: "#FFD700",
    focused: "#00FF94",
    calm: "#00C2FF",
    stressed: "#FF4500",
    energetic: "#FF00E6",
  };

  // Generate Planets
  const planetsSvg = planets.map((planet, index) => {
    // Calculate orbit duration based on speed
    const duration = 1000 / planet.orbitSpeed;
    const glowColor = moodColors[planet.mood] || "#ffffff";

    // Calculate HUD timing for this planet
    const start = index * cycleDuration;
    const end = start + cycleDuration;

    // Unique gradient ID for this planet
    const gradId = `planetGrad-${index}`;

    return `
      <!-- Planet: ${planet.name} -->
      <a href="${planet.html_url}" target="_blank" style="cursor: pointer;">
        <defs>
          <radialGradient id="${gradId}" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="${planet.color}" stop-opacity="1" />
            <stop offset="50%" stop-color="${planet.color}" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#000" stop-opacity="1" />
          </radialGradient>
        </defs>
        <g>
          <!-- Orbit Path -->
          <circle cx="${cx}" cy="${cy}" r="${planet.orbitRadius}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
          
          <!-- Orbiting Group -->
          <g>
            <animateTransform 
              attributeName="transform" 
              type="rotate" 
              from="0 ${cx} ${cy}" 
              to="360 ${cx} ${cy}" 
              dur="${duration}s" 
              repeatCount="indefinite" 
            />
            
            <!-- Planet Body (3D Effect) -->
            <circle cx="${cx + planet.orbitRadius}" cy="${cy}" r="${planet.radius}" fill="url(#${gradId})">
               <title>${planet.name} (${planet.language})</title>
            </circle>
            
            <!-- Inner Rim Light (Atmosphere) -->
            <circle cx="${cx + planet.orbitRadius}" cy="${cy}" r="${planet.radius}" fill="none" stroke="${glowColor}" stroke-width="2" opacity="0.3">
            </circle>
            
            <!-- Texture/Overlay -->
            ${planet.texture === 'ringed' ? `
              <ellipse cx="${cx + planet.orbitRadius}" cy="${cy}" rx="${planet.radius * 1.6}" ry="${planet.radius * 0.4}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" transform="rotate(-15, ${cx + planet.orbitRadius}, ${cy})" />
            ` : ''}
            
            ${planet.texture === 'cracked' ? `
               <path d="M${cx + planet.orbitRadius - 5} ${cy - 5} L${cx + planet.orbitRadius + 5} ${cy + 5} M${cx + planet.orbitRadius + 2} ${cy - 8} L${cx + planet.orbitRadius - 2} ${cy + 2}" stroke="rgba(0,0,0,0.3)" stroke-width="1" />
            ` : ''}
            
            <!-- Mood Glow -->
            <circle cx="${cx + planet.orbitRadius}" cy="${cy}" r="${planet.radius * 1.2}" fill="none" stroke="${glowColor}" stroke-width="1" opacity="0.4" filter="url(#glow)">
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
            </circle>

            <!-- Active Indicator (Ring when HUD is showing this planet) -->
            <circle cx="${cx + planet.orbitRadius}" cy="${cy}" r="${planet.radius + 10}" fill="none" stroke="white" stroke-width="1.5" stroke-dasharray="3 3" opacity="0">
               <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;${start / totalCycleTime};${end / totalCycleTime};1" dur="${totalCycleTime}s" repeatCount="indefinite" />
               <animateTransform attributeName="transform" type="rotate" from="0 ${cx + planet.orbitRadius} ${cy}" to="360 ${cx + planet.orbitRadius} ${cy}" dur="10s" repeatCount="indefinite" />
            </circle>

            <!-- Hover Label (Counter-Rotated to stay upright) -->
            <g opacity="0">
              <set attributeName="opacity" to="1" begin="mouseover" end="mouseout" />
              <animateTransform 
                  attributeName="transform" 
                  type="rotate" 
                  from="360 ${cx + planet.orbitRadius} ${cy}" 
                  to="0 ${cx + planet.orbitRadius} ${cy}" 
                  dur="${duration}s" 
                  repeatCount="indefinite" 
              />
              <text x="${cx + planet.orbitRadius}" y="${cy + planet.radius + 15}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold" style="text-shadow: 0px 0px 4px black;">
                ${planet.name}
              </text>
            </g>
          </g>
        </g>
      </a>
    `;
  }).join("\n");

  // Generate HUD Panels
  const hudPanels = planets.map((planet, index) => {
    // Calculate percentages for keyTimes
    const startPct = index / planets.length;
    const endPct = (index + 1) / planets.length;

    // We need strict visibility control:
    // 0 -> startPct: opacity 0
    // startPct -> endPct: opacity 1
    // endPct -> 1: opacity 0

    // To achieve hard cuts in SMIL without interpolation overlap:
    // We use a small epsilon
    const e = 0.001;

    let values = "";
    let keyTimes = "";

    if (index === 0) {
      // First item: Visible from 0 to endPct
      // 0 -> endPct: 1
      // endPct -> 1: 0
      values = "1; 1; 0; 0";
      keyTimes = `0; ${endPct - e}; ${endPct}; 1`;
    } else if (index === planets.length - 1) {
      // Last item: Visible from startPct to 1
      // 0 -> startPct: 0
      // startPct -> 1: 1
      values = "0; 0; 1; 1";
      keyTimes = `0; ${startPct}; ${startPct + e}; 1`;
    } else {
      // Middle items
      // 0 -> startPct: 0
      // startPct -> endPct: 1
      // endPct -> 1: 0
      values = "0; 0; 1; 1; 0; 0";
      keyTimes = `0; ${startPct}; ${startPct + e}; ${endPct - e}; ${endPct}; 1`;
    }

    return `
      <g opacity="0">
        <!-- Visibility Animation -->
        <animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${totalCycleTime}s" repeatCount="indefinite" />

        <!-- Panel Content -->
        <text x="20" y="${height - 80}" fill="${moodColors[planet.mood] || 'white'}" font-family="Courier New, monospace" font-size="16" font-weight="bold">> ${planet.name}</text>
        <text x="20" y="${height - 60}" fill="#ccc" font-family="Courier New, monospace" font-size="12">LANG: ${planet.language || 'N/A'} | STARS: ${planet.stargazers_count}</text>
        <text x="20" y="${height - 45}" fill="#ccc" font-family="Courier New, monospace" font-size="12">MOOD: ${planet.mood.toUpperCase()} | SIZE: ${planet.size}kb</text>
        
        <!-- Progress Bar -->
        <rect x="20" y="${height - 35}" width="0" height="2" fill="${moodColors[planet.mood] || 'white'}">
            <animate attributeName="width" values="0;200" begin="${index * cycleDuration}s" dur="${cycleDuration}s" fill="freeze" />
        </rect>
      </g>
    `;
  }).join("\n");

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sunGradient">
      <stop offset="0%" stop-color="#FDB813" />
      <stop offset="80%" stop-color="#F5821F" />
      <stop offset="100%" stop-color="rgba(245, 130, 31, 0)" />
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="hudGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="10%" stop-color="rgba(0,20,40,0.8)" />
      <stop offset="90%" stop-color="rgba(0,20,40,0.8)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0)" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="#030014" />
  
  <!-- Copyright Watermark -->
  <text x="${width / 2}" y="${height / 2 + 150}" text-anchor="middle" fill="white" opacity="0.05" font-family="Arial, sans-serif" font-size="40" font-weight="bold">© ${user.name}</text>
  
  <!-- Stars -->
  <circle cx="100" cy="100" r="1" fill="white" opacity="0.5" />
  <circle cx="500" cy="200" r="1.5" fill="white" opacity="0.7" />
  <circle cx="700" cy="500" r="1" fill="white" opacity="0.4" />
  <circle cx="200" cy="400" r="2" fill="white" opacity="0.6" />
  <circle cx="600" cy="100" r="1" fill="white" opacity="0.5" />
  <circle cx="50" cy="550" r="1.5" fill="white" opacity="0.8" />
  <circle cx="750" cy="50" r="1" fill="white" opacity="0.6" />

  <!-- Sun -->
  <g filter="url(#glow)">
    <circle cx="${cx}" cy="${cy}" r="40" fill="url(#sunGradient)">
      <animate attributeName="r" values="40;42;40" dur="4s" repeatCount="indefinite" />
    </circle>
    <image href="${user.avatarUrl}" x="${cx - 40}" y="${cy - 40}" height="80" width="80" clip-path="circle(40px at center)" opacity="0.8" />
  </g>
  
  <!-- User Name (Center) -->
  <text x="${cx}" y="${cy + 60}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${user.name}</text>
  <text x="${cx}" y="${cy + 75}" text-anchor="middle" fill="#aaa" font-family="Arial, sans-serif" font-size="10">@${user.username}</text>

  <!-- Planets -->
  ${planetsSvg}

  <!-- HUD Panel Background -->
  <rect x="10" y="${height - 90}" width="300" height="80" fill="url(#hudGradient)" stroke="rgba(0,255,255,0.2)" stroke-width="1" rx="5" />
  
  <!-- HUD Content (Auto-Cycling) -->
  ${hudPanels}

  <!-- Footer -->
  <text x="${width - 10}" y="${height - 10}" text-anchor="end" fill="#333" font-family="Arial, sans-serif" font-size="10">RepoVerse</text>
  
  <!-- Top-Right User Badge -->
  <g transform="translate(${width - 70}, 20)">
    <circle cx="25" cy="25" r="27" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
    <image href="${user.avatarUrl}" x="0" y="0" height="50" width="50" clip-path="circle(25px at center)" />
  </g>
</svg>
  `.trim();
}
