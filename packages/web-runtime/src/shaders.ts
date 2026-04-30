export const VS_SOURCE = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  uniform mat3 u_matrix;
  uniform mat3 u_localMatrix; // パーツごとの行列
  uniform vec2 u_deformation; // テスト用の変形パラメータ
  
  varying vec2 v_texCoord;
  
  void main() {
    // パラメータによる簡易的な変形テスト (Y座標に応じてXを歪ませる、X座標に応じてYを歪ませる)
    vec2 pos = a_position;
    pos.x += u_deformation.x * pos.y * 2.0;
    pos.y += u_deformation.y * pos.x * 2.0;

    vec3 worldPos = u_localMatrix * vec3(pos, 1.0);
    gl_Position = vec4((u_matrix * worldPos).xy, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

export const FS_SOURCE = `
  precision mediump float;
  
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  
  void main() {
    // プリマルチプライドアルファ用のブレンド処理は後で行うため、ここではそのまま出力
    vec4 color = texture2D(u_image, v_texCoord);
    gl_FragColor = vec4(color.rgb * color.a, color.a);
  }
`;
