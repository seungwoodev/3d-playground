import './style.css'
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
// import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
// import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls.js';
// import { PointerLockControls } from 'three';


// // Cannon

// // Setup our world
// var world = new CANNON.World();
// world.gravity.set(0, 0, -9.82); // m/s²

// // Create a sphere
// var radius = 1; // m
// var sphereBody = new CANNON.Body({
//    mass: 5, // kg
//    position: new CANNON.Vec3(0, 0, 10), // m
//    shape: new CANNON.Sphere(radius)
// });
// world.addBody(sphereBody);

// // Create a plane
// var groundBody = new CANNON.Body({
//     mass: 0 // mass == 0 makes the body static
// });
// var groundShape = new CANNON.Plane();
// groundBody.addShape(groundShape);
// world.addBody(groundBody);

// var fixedTimeStep = 1.0 / 60.0; // seconds
// var maxSubSteps = 3;

// // Start the simulation loop
// var lastTime;
// (function simloop(time){
//   requestAnimationFrame(simloop);
//   if(lastTime !== undefined){
//      var dt = (time - lastTime) / 1000;
//      world.step(fixedTimeStep, dt, maxSubSteps);
//   }
//   console.log("Sphere z position: " + sphereBody.position.z);
//   lastTime = time;
// })();




// three.js

let camera, scene, renderer, controls;
let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.y = 10;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('white');

  controls = new PointerLockControls( camera, document.body );

  // const controls = new OrbitControls(camera, canvas);
  // controls.target.set(0, 5, 0);
  // controls.update(); 
  const blocker = document.getElementById( 'blocker' );
  const instructions = document.getElementById( 'instructions' );

  instructions.addEventListener( 'click', function () {

    controls.lock();

  } );

  controls.addEventListener( 'lock', function () {
  
    instructions.style.display = 'none';
    blocker.style.display = 'none';

  } );

  controls.addEventListener( 'unlock', function () {

    blocker.style.display = 'block';
    instructions.style.display = '';

  } );

  scene.add( controls.getObject() );

  const onKeyDown = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;

      case 'Space':
        if ( canJump === true ) velocity.y += 350;
        canJump = false;
        break;

    }

  };

  const onKeyUp = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;

    }

  };

  document.addEventListener( 'keydown', onKeyDown );
  document.addEventListener( 'keyup', onKeyUp );

  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );


  // {
  //   const planeSize = 40;

  //   const loader = new THREE.TextureLoader();
  //   const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png');
  //   texture.wrapS = THREE.RepeatWrapping;
  //   texture.wrapT = THREE.RepeatWrapping;
  //   texture.magFilter = THREE.NearestFilter;
  //   const repeats = planeSize / 2;
  //   texture.repeat.set(repeats, repeats);

  //   const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
  //   const planeMat = new THREE.MeshPhongMaterial({
  //     map: texture,
  //     side: THREE.DoubleSide,
  //   });
  //   const mesh = new THREE.Mesh(planeGeo, planeMat);
  //   mesh.rotation.x = Math.PI * -.5;
  //   scene.add(mesh);
  // }
  let floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
  floorGeometry.rotateX( - Math.PI / 2 );

  // vertex displacement

  let position = floorGeometry.attributes.position;

  for ( let i = 0, l = position.count; i < l; i ++ ) {

    vertex.fromBufferAttribute( position, i );

    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;

    position.setXYZ( i, vertex.x, vertex.y, vertex.z );

  }

  floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

  position = floorGeometry.attributes.position;
  const colorsFloor = [];

  for ( let i = 0, l = position.count; i < l; i ++ ) {

    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    colorsFloor.push( color.r, color.g, color.b );

  }

  floorGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsFloor, 3 ) );

  const floorMaterial = new THREE.MeshBasicMaterial( { vertexColors: true } );

  const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  scene.add( floor );

  {
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add(light.target);
  }

  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // compute a unit vector that points in the direction the camera is now
    // in the xz plane from the center of the box
    const direction = (new THREE.Vector3())
        .subVectors(camera.position, boxCenter)
        .multiply(new THREE.Vector3(1, 0, 1))
        .normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./src/models/temple.glb', (gltf) => {
      const root = gltf.scene;
      root.scale.set(30,30,30);
      root.position.x = -200;
      root.position.y = 0;
      root.position.z = 200;
      scene.add(root);
    });
  }

  {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./src/models/Greeting.glb', (gltf) => {
      const root = gltf.scene;
      root.scale.set(10,10,10);
      root.position.x = -180;
      root.position.y = 30;
      root.position.z = 180;
      scene.add(root);
    });
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
  document.body.appendChild( renderer.domElement );
  window.addEventListener( 'resize', onWindowResize );
  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }


  function render() {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    requestAnimationFrame(render);

    const time = performance.now();
    if ( controls.isLocked === true ) {

      raycaster.ray.origin.copy( controls.getObject().position );
      raycaster.ray.origin.y -= 10;

      // const intersections = raycaster.intersectObjects( root );

      // const onObject = intersections.length > 0;

      const delta = ( time - prevTime ) / 1000;

      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;
      velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      direction.z = Number( moveForward ) - Number( moveBackward );
      direction.x = Number( moveRight ) - Number( moveLeft );
      direction.normalize(); // this ensures consistent movements in all directions

      if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
      if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

      // if ( onObject === true ) {

      //   velocity.y = Math.max( 0, velocity.y );
      //   canJump = true;

      // }

      controls.moveRight( - velocity.x * delta );
      controls.moveForward( - velocity.z * delta );

      controls.getObject().position.y += ( velocity.y * delta ); // new behavior

      if ( controls.getObject().position.y < 10 ) {

        velocity.y = 0;
        controls.getObject().position.y = 10;

        canJump = true;

      }

    }

    prevTime = time;
    renderer.render(scene, camera);



  }

  requestAnimationFrame(render);
}

main();