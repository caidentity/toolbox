export const vertexShaderSource = `
  attribute vec2 position;
  
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const fragmentShaderSource = `
  precision mediump float;
  
  uniform vec2 resolution;
  uniform vec4 points[32];  // xy = position, zw = color (r,g)
  uniform float intensities[32];
  uniform float bendFactors[32];
  uniform float elongations[32];
  uniform int numPoints;

  float getDistance(vec2 p1, vec2 p2, float elongation) {
    vec2 diff = p1 - p2;
    // Scale x component by elongation to create horizontal stretching
    vec2 scaledDiff = vec2(diff.x * elongation, diff.y);
    return length(scaledDiff);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < 32; i++) {
      if (i >= numPoints) break;

      vec2 pointPos = points[i].xy;
      vec3 pointColor = vec3(points[i].z, points[i].w, points[i+1].x);
      float intensity = intensities[i];
      float bend = bendFactors[i];
      float elongation = elongations[i];

      // Calculate distance with elongation
      float dist = getDistance(uv, pointPos, elongation);
      
      // Apply bend factor to create gradient falloff
      float weight = 1.0 / pow(dist * 2.0 + 0.1, bend) * intensity;
      
      totalWeight += weight;
      color += pointColor * weight;
    }

    if (totalWeight > 0.0) {
      color = color / totalWeight;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`; 