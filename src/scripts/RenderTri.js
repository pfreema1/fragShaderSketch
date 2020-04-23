// concept mostly taken from here: https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7

import * as THREE from 'three';
import glslify from 'glslify';
import fullScreenTriFrag from './../shaders/fullScreenTri.frag';
import fullScreenTriVert from './../shaders/fullScreenTri.vert';

export default class RenderTri {
  constructor(scene, renderer, bgRenderTarget, pane, PARAMS) {
    this.scene = scene;
    this.renderer = renderer;
    this.bgRenderTarget = bgRenderTarget;
    this.pane = pane;
    this.PARAMS = PARAMS;

    const resolution = new THREE.Vector2();
    this.renderer.getDrawingBufferSize(resolution);

    this.RenderTriTarget = new THREE.WebGLRenderTarget(
      resolution.x,
      resolution.y,
      {
        format: THREE.RGBFormat,
        stencilBuffer: false,
        depthBuffer: true
      }
    );

    this.triMaterial = new THREE.RawShaderMaterial({
      fragmentShader: glslify(fullScreenTriFrag),
      vertexShader: glslify(fullScreenTriVert),
      uniforms: {
        uScene: {
          type: 't',
          value: this.bgRenderTarget.texture
        },
        iResolution: { value: resolution },
        iTime: {
          value: 0.0
        },
        mod1: {
          value: 1.0
        },
        mod2: {
          value: 1.0
        },
        mod3: {
          value: 1.0
        },
        mod4: {
          value: 1.0
        },
        mod5: {
          value: 1.0
        },
        mod6: {
          value: 1.0
        }
      }
    });

    let renderTri = new THREE.Mesh(
      this.returnRenderTriGeometry(),
      this.triMaterial
    );
    renderTri.frustumCulled = false;

    this.scene.add(renderTri);

    this.addGUI();
  }

  addGUI() {
    this.PARAMS.mod1 = 1.0;
    this.PARAMS.mod2 = 1.0;
    this.PARAMS.mod3 = 1.0;
    this.PARAMS.mod4 = 1.0;
    this.PARAMS.mod5 = 1.0;
    this.PARAMS.mod6 = 1.0;

    this.pane.addInput(this.PARAMS, 'mod1', {
      min: 0.0,
      max: 1.0
    }).on('change', value => {
      this.triMaterial.uniforms.mod1.value = value;
    });

    this.pane.addInput(this.PARAMS, 'mod2', {
      min: 0.0,
      max: 1.0
    }).on('change', value => {
      this.triMaterial.uniforms.mod2.value = value;
    });

    this.pane.addInput(this.PARAMS, 'mod3', {
      min: 0.0,
      max: 1.0
    }).on('change', value => {
      this.triMaterial.uniforms.mod3.value = value;
    });

    this.pane.addInput(this.PARAMS, 'mod4', {
      min: 0.0,
      max: 1.0
    }).on('change', value => {
      this.triMaterial.uniforms.mod4.value = value;
    });

    this.pane.addInput(this.PARAMS, 'mod5', {
      min: 0.0,
      max: 1.0
    }).on('change', value => {
      this.triMaterial.uniforms.mod5.value = value;
    });

    this.pane.addInput(this.PARAMS, 'mod6', {
      min: 0.0,
      max: 1.0
    }).on('change', value => {
      this.triMaterial.uniforms.mod6.value = value;
    });
  }

  returnRenderTriGeometry() {
    const geometry = new THREE.BufferGeometry();

    // triangle in clip space coords
    const vertices = new Float32Array([-1.0, -1.0, 3.0, -1.0, -1.0, 3.0]);

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));

    return geometry;
  }
}
