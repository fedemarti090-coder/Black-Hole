import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { Black_hole } from './src/element/black_hole.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000000
);
camera.position.set(0, 8, 20);

const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const resolutionScale = 0.7;
let renderWidth = Math.floor(window.innerWidth * resolutionScale);
let renderHeight = Math.floor(window.innerHeight * resolutionScale);

const renderTarget = new THREE.WebGLRenderTarget(renderWidth, renderHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
});

const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
            gl_FragColor = texture2D(tDiffuse, vUv);
        }
    `,
    uniforms: {
        tDiffuse: { value: renderTarget.texture }
    }
});
const postPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
postScene.add(postPlane);
// ------------------------------------------------------

let needsUpdate = true;
function requestRender() {
    needsUpdate = true;
}

const textureLoader = new THREE.TextureLoader();
const starMapTexture = textureLoader.load('../assets/8k_stars_milky_way.jpg', () => {
    requestRender();
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.update();

controls.addEventListener('change', requestRender);

const stats = new Stats();
document.body.appendChild(stats.dom);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

//-----------------------------------------------SCENE-----------------------------------------------

const black_hole = new Black_hole(scene, camera, starMapTexture);

async function start_render() {
    await black_hole.init();
    
    black_hole.onResize(renderWidth, renderHeight);

    function animate() {
        requestAnimationFrame(animate);

        const isCameraMoving = controls.update();

        if (!isCameraMoving) {
            camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.0002);
            controls.update();
            requestRender();
        }

        if (isCameraMoving || needsUpdate) {
            black_hole.update();

            renderer.setRenderTarget(renderTarget);
            renderer.render(scene, camera);

            renderer.setRenderTarget(null);
            renderer.render(postScene, postCamera);

            stats.update();

            if (!isCameraMoving && !needsUpdate) {

            } else if (!isCameraMoving) {
                needsUpdate = false;
            }
        }
    }
    animate();
}

start_render();

//-----------------------------------------------SCENE-----------------------------------------------

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderWidth = Math.floor(width * resolutionScale);
    renderHeight = Math.floor(height * resolutionScale);
    renderTarget.setSize(renderWidth, renderHeight);

    black_hole.onResize(renderWidth, renderHeight);

    requestRender();
});