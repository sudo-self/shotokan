import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 50, 5000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(5, 5, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    console.warn("WebGL context lost. Reloading...");
    setTimeout(() => location.reload(), 1000);
});

const skyGeometry = new THREE.SphereGeometry(5000, 16, 16);
const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
        topColor: { value: new THREE.Color(0x6ba6c8) },
        bottomColor: { value: new THREE.Color(0xe6c000) },
    },
    vertexShader: `
        precision mediump float;
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `,
    fragmentShader: `
        precision mediump float;
        varying vec3 vWorldPosition;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        void main() {
            float h = normalize(vWorldPosition).y * 0.5 + 0.5;
            gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
        }
    `,
    side: THREE.BackSide,
    depthWrite: false
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

const sun = new THREE.Mesh(
    new THREE.SphereGeometry(10, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd700 })
);
sun.position.set(50, 20, -200);
scene.add(sun);

scene.add(new THREE.AmbientLight(0x404040, 2));
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const loader = new GLTFLoader();

const loadModel = (path, scale, position) => {
    loader.load(
        path,
        (gltf) => {
            const model = gltf.scene;
            model.scale.set(scale, scale, scale);
            model.position.set(...position);
            scene.add(model);
        },
        undefined,
        (error) => console.error(`Error loading ${path}:`, error)
    );
};

loadModel("/model.glb", 0.8, [0, -4, -2]);
loadModel("/shotokan.glb", 0.03, [12, -9, 11]);

const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load("/ground.jpg", (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
});

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ map: groundTexture, side: THREE.DoubleSide })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -10;
scene.add(ground);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enableZoom = true;
controls.target.set(0, 1, 0);
controls.update();

let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, 200);
});

function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();





