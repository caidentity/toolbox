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
  uniform int numPoints;

  float getDistance(vec2 p1, vec2 p2) {
    return sqrt(pow(p1.x - p2.x, 2.0) + pow(p1.y - p2.y, 2.0));
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

      float dist = getDistance(uv, pointPos);
      float weight = 1.0 / pow(dist * 4.0 + 0.1, bend) * intensity;
      
      totalWeight += weight;
      color += pointColor * weight;
    }

    if (totalWeight > 0.0) {
      color = color / totalWeight;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`; 