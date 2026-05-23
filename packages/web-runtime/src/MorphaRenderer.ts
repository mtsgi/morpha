import { mat3 } from 'gl-matrix';
import { VS_SOURCE, FS_SOURCE } from './shaders.js';

export class MorphaRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  
  private positionBuffer: WebGLBuffer;
  private texCoordBuffer: WebGLBuffer;
  
  private matrixLocation: WebGLUniformLocation;
  private localMatrixLocation: WebGLUniformLocation;
  private parallaxLocation: WebGLUniformLocation;
  private textureLocation: WebGLUniformLocation;
  private depthMapLocation: WebGLUniformLocation;
  private hasDepthMapLocation: WebGLUniformLocation;
  
  private textures: Map<string, WebGLTexture> = new Map();
  private parts: any[] = [];
  private bones: any[] = [];
  
  private currentParallax = { x: 0, y: 0 };
  
  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    
    this.program = this.createProgram(gl, VS_SOURCE, FS_SOURCE);
    
    this.positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER, 
      new Float32Array([
        -0.5, -0.5,
         0.5, -0.5,
        -0.5,  0.5,
        -0.5,  0.5,
         0.5, -0.5,
         0.5,  0.5,
      ]), 
      gl.STATIC_DRAW
    );
    
    this.texCoordBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 1.0, 
        1.0, 1.0, 
        0.0, 0.0, 
        0.0, 0.0, 
        1.0, 1.0, 
        1.0, 0.0, 
      ]),
      gl.STATIC_DRAW
    );
    
    this.matrixLocation = gl.getUniformLocation(this.program, 'u_matrix')!;
    this.localMatrixLocation = gl.getUniformLocation(this.program, 'u_localMatrix')!;
    this.parallaxLocation = gl.getUniformLocation(this.program, 'u_parallax')!;
    this.textureLocation = gl.getUniformLocation(this.program, 'u_texture')!;
    this.depthMapLocation = gl.getUniformLocation(this.program, 'u_depthMap')!;
    this.hasDepthMapLocation = gl.getUniformLocation(this.program, 'u_hasDepthMap')!;
    
    gl.clearColor(0, 0, 0, 0);
  }
  
  // 後方互換/テスト用
  public loadTexture(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const gl = this.gl;
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        this.textures.set('default', tex);
        resolve();
      };
    });
  }

  public syncProject(project: any) {
    if (!project || !project.rig) return;
    
    // パーツリストを更新
    this.parts = project.rig.parts || [];
    // ボーンリストを更新
    this.bones = project.rig.bones || [];
    
    // 新しいアセットがあればロードする
    for (const asset of project.assets || []) {
      if ((asset.type === 'image' || asset.type === 'depth_map') && !this.textures.has(asset.id)) {
        // ロード中フラグとして null をセット
        this.textures.set(asset.id, null as any);
        
        const img = new Image();
        img.src = asset.data;
        img.onload = () => {
          const gl = this.gl;
          const tex = gl.createTexture()!;
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          this.textures.set(asset.id, tex);
        };
      }
    }
  }

  public updateParameters(params: Record<string, number>) {
    const headX = params['head_x'] || 0;
    const headY = params['head_y'] || 0;
    const bodyX = params['body_x'] || 0;
    
    // パララックス（視差）用のパラメータとして設定
    this.currentParallax.x = headX * 0.8 + bodyX * 0.2;
    this.currentParallax.y = headY * 0.8;
  }
  
  public resize(width: number, height: number) {
    this.gl.canvas.width = width;
    this.gl.canvas.height = height;
  }

  public render(viewMatrix?: Float32Array) {
    const gl = this.gl;
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if (this.textures.size === 0) return;
    
    gl.useProgram(this.program);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniform2f(this.parallaxLocation, this.currentParallax.x, this.currentParallax.y);
    
    // Calculate global projection matrix
    const matrix = mat3.create();
    const aspect = gl.canvas.width / gl.canvas.height;
    
    if (aspect > 1) {
      mat3.scale(matrix, matrix, [1 / aspect * 1.5, 1.5]);
    } else {
      mat3.scale(matrix, matrix, [1.5, aspect * 1.5]);
    }

    // Apply viewport transform (zoom/pan)
    if (viewMatrix) {
      const viewMat = mat3.fromValues(
        viewMatrix[0], viewMatrix[1], viewMatrix[2],
        viewMatrix[3], viewMatrix[4], viewMatrix[5],
        viewMatrix[6], viewMatrix[7], viewMatrix[8]
      );
      mat3.multiply(matrix, viewMat, matrix);
    }

    gl.uniformMatrix3fv(this.matrixLocation, false, matrix as Float32Array);
    
    // Bone world matrix cache
    const boneWorldMatrices = new Map<string, mat3>();
    const computeBoneWorldMatrix = (boneId: string): mat3 => {
      if (boneWorldMatrices.has(boneId)) return boneWorldMatrices.get(boneId)!;
      
      const bone = this.bones.find((b: any) => b.id === boneId);
      if (!bone) {
        const identity = mat3.create();
        boneWorldMatrices.set(boneId, identity);
        return identity;
      }
      
      const boneMat = mat3.create();
      mat3.translate(boneMat, boneMat, bone.position);
      mat3.rotate(boneMat, boneMat, bone.rotation);
      
      if (bone.parentId) {
        const parentMat = computeBoneWorldMatrix(bone.parentId);
        mat3.multiply(boneMat, parentMat, boneMat);
      }
      
      boneWorldMatrices.set(boneId, boneMat);
      return boneMat;
    };

    // Hierarchical transform calculation
    const worldMatrices = new Map<string, mat3>();
    const computeWorldMatrix = (part: any): mat3 => {
      if (worldMatrices.has(part.id)) return worldMatrices.get(part.id)!;
      
      const localMat = mat3.create();
      
      // ボーンバインドがある場合、ボーンの変形行列を適用
      if (part.boneId) {
        const boneMat = computeBoneWorldMatrix(part.boneId);
        mat3.multiply(localMat, localMat, boneMat);
      }
      
      if (part.transform) {
        mat3.translate(localMat, localMat, part.transform.position);
        mat3.rotate(localMat, localMat, part.transform.rotation);
        mat3.scale(localMat, localMat, part.transform.scale);
      }
      
      if (part.parentId) {
        const parentPart = this.parts.find(p => p.id === part.parentId);
        if (parentPart) {
          const parentWorldMat = computeWorldMatrix(parentPart);
          mat3.multiply(localMat, parentWorldMat, localMat);
        }
      }
      
      worldMatrices.set(part.id, localMat);
      return localMat;
    };

    if (this.parts.length === 0) {
      const tex = this.textures.get('default');
      if (tex) {
        const identity = mat3.create();
        gl.uniformMatrix3fv(this.localMatrixLocation, false, identity as Float32Array);
        this.drawQuad(gl, tex, null);
      }
    } else {
      for (const part of this.parts) {
        if (!part.visible || part.type !== 'mesh') continue;
        
        let tex = null;
        if (part.assetId) {
          tex = this.textures.get(part.assetId);
        } else if (part.name.includes('Eye') || part.name.includes('Face')) {
          tex = this.textures.get('default');
        }

        let depthTex = null;
        if (part.depthAssetId) {
          depthTex = this.textures.get(part.depthAssetId) || null;
        }

        if (tex) {
          const worldMat = computeWorldMatrix(part);
          gl.uniformMatrix3fv(this.localMatrixLocation, false, worldMat as Float32Array);
          this.drawQuad(gl, tex, depthTex);
        }
      }
    }
  }

  private drawQuad(gl: WebGLRenderingContext, texture: WebGLTexture, depthTexture: WebGLTexture | null) {
    // Bind main texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.textureLocation, 0);

    // Bind depth texture
    if (depthTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.uniform1i(this.depthMapLocation, 1);
      gl.uniform1i(this.hasDepthMapLocation, 1);
    } else {
      gl.uniform1i(this.hasDepthMapLocation, 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  private createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram {
    const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource)!;
    const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource)!;
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }
    return program;
  }
  
  private loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
}
