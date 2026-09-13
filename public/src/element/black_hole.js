import * as THREE from 'three';

export class Black_hole {
    constructor(scene, camera, starMapTexture) {
        this.scene = scene;
        this.camera = camera;
        this.starMapTexture = starMapTexture;
    }

    async init() {
        const shaders = await window.electronAPI.load_shader();

        this.uniforms = {
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_cameraPos: { value: new THREE.Vector3() },
            u_invProjMatrix: { value: new THREE.Matrix4() },
            u_invViewMatrix: { value: new THREE.Matrix4() },
            u_blackHolePos: { value: new THREE.Vector3(0, 0, 0) },
            u_radius: { value: 1.0 },
            u_starMap: { value: this.starMapTexture }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader: shaders.vertex,
            fragmentShader: shaders.fragment,
            uniforms: this.uniforms,
            depthWrite: false,
            depthTest: false
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.frustumCulled = false;

        this.scene.add(this.mesh);
    }

    update() {
        if (!this.mesh) return;

        this.camera.updateMatrixWorld(true);
        this.camera.updateProjectionMatrix();

        this.uniforms.u_invProjMatrix.value.copy(this.camera.projectionMatrixInverse);
        this.uniforms.u_invViewMatrix.value.copy(this.camera.matrixWorld);
        this.uniforms.u_cameraPos.value.copy(this.camera.position);
    }

    onResize(width, height) {
        if (this.uniforms) {
            this.uniforms.u_resolution.value.set(width, height);
        }
    }
}