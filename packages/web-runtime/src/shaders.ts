export const VS_SOURCE = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  uniform mat3 u_matrix;
  uniform mat3 u_localMatrix; // パーツごとの行列
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 pos = a_position;
    vec3 worldPos = u_localMatrix * vec3(pos, 1.0);
    gl_Position = vec4((u_matrix * worldPos).xy, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const FS_SOURCE = `
  precision mediump float;
  varying vec2 v_texCoord;
  
  uniform sampler2D u_texture;
  uniform sampler2D u_depthMap;
  uniform bool u_hasDepthMap;
  uniform vec2 u_parallax; // from parameters (head_x, head_y)
  
  void main() {
    vec2 uv = v_texCoord;
    
    if (u_hasDepthMap) {
      // Sample depth map (grayscale). We use the r channel.
      float depth = texture2D(u_depthMap, uv).r;
      // Remap depth from 0.0-1.0 to -0.5 to +0.5.
      // E.g. White (1.0) is forward (0.5), Black (0.0) is back (-0.5).
      float offset = depth - 0.5;
      
      // Shift UV based on parallax parameter and depth offset.
      uv -= u_parallax * offset * 0.1; // 0.1 is an intensity multiplier
    }
    
    vec4 color = texture2D(u_texture, uv);
    gl_FragColor = vec4(color.rgb * color.a, color.a);
  }
`;
