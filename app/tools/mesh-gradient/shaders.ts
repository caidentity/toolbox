export const vertexShaderSource = `
  attribute vec2 position;
  
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const fragmentShaderSource = `
  precision highp float;
  
  uniform vec2 resolution;
  uniform vec4 points[32];  // xy = position, zw = color (r,g), next x = b
  uniform float intensities[32];
  uniform float bendFactors[32];
  uniform float elongations[32];
  uniform int numPoints;
  uniform float noiseAmount;

  // Better noise function
  float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
      mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
      mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
    return res*res;
  }

  float getDistance(vec2 p1, vec2 p2, float elongation) {
    vec2 diff = p1 - p2;
    vec2 scaledDiff = vec2(diff.x * elongation, diff.y);
    return length(scaledDiff);
  }

  // Improved speckle noise
  float speckleNoise(vec2 p) {
    float n = noise(p * 1000.0); // Higher frequency for speckles
    // Make it more binary - either dark or light spots
    n = smoothstep(0.4, 0.6, n);
    return n;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < 32; i++) {
      if (i >= numPoints) break;

      vec2 pointPos = points[i].xy;
      vec3 pointColor;
      if (i == numPoints - 1) {
        pointColor = vec3(points[i].z, points[i].w, points[i].z);
      } else {
        pointColor = vec3(points[i].z, points[i].w, points[i+1].x);
      }

      float intensity = intensities[i];
      float bend = bendFactors[i];
      float elongation = elongations[i];

      float dist = getDistance(uv, pointPos, elongation);
      float weight = 1.0 / (pow(dist * 2.0 + 0.05, bend) + 0.01) * intensity;
      
      totalWeight += weight;
      color += pointColor * weight;
    }

    if (totalWeight > 0.0) {
      color = color / totalWeight;
    }

    // More subtle speckle noise application
    if (noiseAmount > 0.0) {
      float n = speckleNoise(uv);
      // Reduce the noise intensity and make it more subtle
      float noiseIntensity = noiseAmount / 400.0; // Much smaller influence
      color = mix(color, vec3(n * 0.5 + 0.5), noiseIntensity);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`; 