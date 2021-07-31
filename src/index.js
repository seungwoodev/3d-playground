import * as CANNON from 'cannon-es';
import * as THREE from 'three';
// import * as THREE from 'https://unpkg.com/three@0.122.0/build/three.module.js'
import { threeToCannon, ShapeType } from 'three-to-cannon';
import Stats from './stats';
import { PointerLockControlsCannon } from './PointerLockControlsCannon';
import { VoxelLandscape } from './VoxelLandscape';
import SimplexNoise from 'simplex-noise';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import cannonDebugger from 'cannon-es-debugger'
import { GUI } from '../node_modules/three/examples/jsm/libs/dat.gui.module.js';
import { Mat3 } from 'cannon-es';
import {derivative} from 'mathjs'

import ParticleSystem from '../src/libs/system.js'
import SnowEmitter from '../src/libs/emitters/snow.js'
import TunnelEmitter from '../src/libs/emitters/tunnel.js'
// import FlameEmitter from '../src/libs/emitters/flame.js'
import { Shape } from '../src/libs/const'
import Tween from '../src/libs/tween.js'
/**
 * Example construction of a voxel world and player.
 */

 var texture = new THREE.TextureLoader().load( './models/concrete.jpeg' );
 texture.wrapS = THREE.RepeatWrapping;
 texture.wrapT = THREE.RepeatWrapping;
 texture.repeat.set(50, 50);
 var floorMat = new THREE.MeshStandardMaterial({
   color: 0x2006d,
   roughness: 0.8,
   metalness: 1,
 });

// three.js variables
let camera, scene, renderer, stats
let material
let floor, music, audioBall
var mesh;
let root
let previousShadowMap = false;
var ambientLight;
var audioPointLight;
var spotLight;
let mixer
let mixer_moon
// To be synced
var meshes = [];
var bodies = [];

// cannon.js variables
let world
let controls
const timeStep = 1 / 60
let lastCallTime = performance.now() / 1000
let sphereShape
let musicShape
let sphereBody
let musicBody
let physicsMaterial
let voxels
let shape


const balls = []
const ballMeshes = []
const boxes = []
const boxMeshes = []

// Number of voxels
const nx = 50
const ny = 8
const nz = 50

// Scale of voxels
const sx = 0.5
const sy = 0.5
const sz = 0.5

scene = new THREE.Scene();
world = new CANNON.World()
// cannonDebugger(scene, world.bodies)

// music audio
const listener = new THREE.AudioListener();
var sound = new THREE.Audio( listener );
const audioLoader = new THREE.AudioLoader();

var soundPrevTime, soundCurrentTime, data;
var syncFrame;

var noise;
var context;
var src;
var analyser;
var bufferLength;
var dataArray;

var offline;
var bufferSource;
var scp;
var freqData;
var audio;


var lowerHalfArray;
var upperHalfArray;

var overallAvg;
var lowerMax;
var lowerAvg;
var upperMax;
var upperAvg;

var lowerMaxFr;
var lowerAvgFr;
var upperMaxFr;
var upperAvgFr;

var isMusicPlayed = false;
var isAnalyser = false;
var isMusicRenderComplete = true;
var isTimeOutRec = false;


var count = 0;

let TrexMesh;
let TrexBody;
let TrexLoaded = false;
let shipMesh;
let shipBody;
let shipLoaded = false;
let moonMesh;
let moonBody;
let moonLoaded = false;
initThree()

initCannon()
initPointerLock()

animate()


// const shape = threeToCannon(root, {type: threeToCannon.Type.MESH});




function initThree() {
  console.log("ssd");
  // Camera
  camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 1000)


  // Scene
  scene.background = new THREE.Color( 0x411ca8);
  scene.fog = new THREE.Fog( 0xA71069, 10, 50 );


  var floorGeometry = new THREE.PlaneGeometry(1000, 1000);
  var floorMesh = new THREE.Mesh(floorGeometry, floorMat);
  floorMesh.receiveShadow = true;
  floorMesh.castShadow = true;
  floorMesh.rotation.x = -Math.PI / 2.0;
  floorMesh.position.y = -1;
  floorMesh.matrixAutoUpdate = false;
  floorMesh.updateMatrix();
  
  scene.add( floorMesh );




  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(scene.fog.color)
  renderer.physicallyCorrectLights = true
  renderer.toneMapping = THREE.ReinhardToneMapping
  renderer.toneMappingExposure = 7
  renderer.shadowMap.enabled = true;

  // Lights
  const color = 0xFFFFFF;
  const intensity = 0.5;
  const distance = 25;
  const decay = 0.5;

  const light = new THREE.PointLight(color, intensity, distance, decay);
  light.position.set(-3, 3, -10);
  scene.add(light);
  light.castShadow = true

  class ColorGUIHelper {
    constructor(object, prop) {
      this.object = object;
      this.prop = prop;
    }
    get value() {
      return `#${this.object[this.prop].getHexString()}`;
    }
    set value(hexString) {
      this.object[this.prop].set(hexString);
    }
  }
  const gui = new GUI();
  gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
  gui.add(light, 'intensity', 0, 1, 0.01);
  gui.add(light, 'distance', 20, 50, 1);
  gui.add(light, 'decay', 0, 1, 0.01);
  gui.add(renderer, 'toneMappingExposure', 0, 20, 0.1);

  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  document.body.appendChild(renderer.domElement)

  // Stats.js
  stats = new Stats()
  document.body.appendChild(stats.dom)

  //lights
  ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  ambientLight.name = "ambientLight"
  scene.add(ambientLight)

  const originLight = new THREE.DirectionalLight( 0xffffff, 1, 100 );
  originLight.position.set(0,3,0)
  originLight.castShadow = true
  scene.add(originLight)
  originLight.shadow.mapSize.width = 1024; // default
  originLight.shadow.mapSize.height = 1024; // default
  originLight.shadow.camera.near = 0.5; // default
  originLight.shadow.camera.far = 500; // default

  var ambientLight2 = new THREE.AmbientLight(0xaaaaaa);
  // scene.add(ambientLight2);

  // Music text object
  const loader = new THREE.FontLoader();

  loader.load('https://threejsfundamentals.org/threejs/resources/threejs/fonts/helvetiker_regular.typeface.json', (font) => {
    const text = 'Music';  

    const musicGeometry = new THREE.TextGeometry(text, {
      font: font,
      size: 3,  

      height: 0.2,  

      curveSegments: 12,  

      bevelEnabled: true,  
      bevelThickness: 0.15,  

      bevelSize: 0.3,  

      bevelSegments: 5,  

    });
    const musicMaterial = new THREE.MeshPhongMaterial({ color: 0x97df5e });
    music = new THREE.Mesh(musicGeometry, musicMaterial);
    music.position.x = 0
    music.position.y = 2
    music.position.z = -30
    scene.add(music);
    console.log('music position x y z', music.position.x, music.position.y, music.position.z)

  });

  // // position test box object
  // const phongMaterial = new THREE.MeshPhongMaterial()
  // const width =  11.5;  
  // const height = 4.0;  
  // const depth = 1.0;  
  // const testGeometry = new THREE.BoxGeometry(width, height, depth);
  // const testBox = new THREE.Mesh(testGeometry, phongMaterial);

  // testBox.position.x = 5;
  // testBox.position.y = 3.5;
  // testBox.position.z = -30;
  // scene.add(testBox);
  // audio visualizer
  var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4);
  console.log("ico~~:", icosahedronGeometry)
  var lambertMaterial = new THREE.MeshNormalMaterial() 
  // var lambertMaterial = new THREE.MeshLambertMaterial({
  //     color: 0xff00ee,
  //     // wireframe: true,
  //     reflectivity: 1,
  //     emissive: 0xffffff,
      
  // });

  audioBall = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
  audioBall.position.set(0, 15, 0);
  scene.add(audioBall);
  console.log("audioBall:", audioBall)

  spotLight = new THREE.SpotLight(0xffffff, 0.2);
  spotLight.position.set(-10, 70, 20);
  spotLight.lookAt(audioBall);
  spotLight.castShadow = true;
  spotLight.name = "spotLight";
  // scene.add(spotLight);  

  




  window.addEventListener('resize', onWindowResize)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}



function initCannon() {
  // Setup world
  

  // Tweak contact properties.
  // Contact stiffness - use to make softer/harder contacts
  world.defaultContactMaterial.contactEquationStiffness = 1e9

  // Stabilization time in number of timesteps
  world.defaultContactMaterial.contactEquationRelaxation = 4

  const solver = new CANNON.GSSolver()
  solver.iterations = 7
  solver.tolerance = 0.1
  world.solver = new CANNON.SplitSolver(solver)
  // use this to test non-split solver
  // world.solver = solver

  world.gravity.set(0, -9.8, 0)

  world.broadphase.useBoundingBoxes = true

  // Create a slippery material (friction coefficient = 0.0)
  physicsMaterial = new CANNON.Material('physics')
  const physics_physics = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, {
    friction: 0.3,
    restitution: 0.3,
  })

  // We must add the contact materials to the world
  world.addContactMaterial(physics_physics)

  // Create the user collision sphere
  const radius = 1.5
  sphereShape = new CANNON.Sphere(radius)
  sphereBody = new CANNON.Body({ mass: 5, material: physicsMaterial })
  sphereBody.addShape(sphereShape)
  sphereBody.position.set(nx * sx * 0.5, ny * sy + radius * 2, nz * sz * 0.5)
  sphereBody.linearDamping = 0.9
  world.addBody(sphereBody)
  console.log("user start position", nx * sx * 0.5, ny * sy + radius * 2, nz * sz * 0.5);

  // Create the ground plane
  const groundShape = new CANNON.Plane()
  const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial })
  groundBody.addShape(groundShape)
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
  world.addBody(groundBody)


  // Music object apply physic
  const width =  11.5;  
  const height = 4.0;  
  const depth = 1.0;
  const musicShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2))
  const musicBody = new CANNON.Body({ mass: 0 })
  const musicQuaternion = new CANNON.Quaternion();
  musicQuaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), 0)
  musicBody.addShape(musicShape, new CANNON.Vec3(), musicQuaternion)
  musicBody.position.x = 5
  musicBody.position.y = 3.5
  musicBody.position.z = -30

  musicBody.addEventListener('collide', (event) => {
    audioLoader.load( 'music/butter.mp3', async function( buffer ) {

      let clock = new THREE.Clock();
      let delta = 0;

      // var time = 1/60;

      sound.setBuffer( buffer );
      console.log('sound1', typeof sound);
      sound.setLoop( true );
      sound.setVolume( 0.5 );
      
      soundPrevTime = sound.context.currentTime;
      console.log('soundStartTime', soundPrevTime);
      isMusicPlayed = true;
      isMusicRenderComplete = false;
      console.log('buffer', buffer);
      console.log('play');
      console.log('isMusicPlayed', isMusicPlayed);
      // audio visualizer
      // initialise simplex noise instance
      noise = new SimplexNoise();
      console.log("noise", noise)
      console.log('context start');

      // context = new (window.AudioContext || window.webkitAudioContext)();
      // src = context.createBufferSource();
      // src.buffer = sound.buffer;
      // console.log('sound buffer', sound.buffer);
      // console.log('src buffer', src.buffer);
      // analyser = context.createAnalyser();
      // analyser.minDecibels = -100;
      // analyser.maxDecibels = -30;
      // src.connect(analyser);
      // analyser.connect(context.destination);
      // analyser.fftSize = 512;
      // bufferLength = analyser.frequencyBinCount;
      // console.log('frequencyBinCount', bufferLength);
      // freqData = new Uint8Array(bufferLength);
      // // freqData = new Float32Array(bufferLength);
      // console.log('analyser', analyser);
      // console.log('sound0', typeof sound);
      isAnalyser = true;
      isTimeOutRec = false;



      offline = new OfflineAudioContext(2, buffer.length ,44100);
      bufferSource = offline.createBufferSource();
      bufferSource.buffer = buffer;

      analyser = offline.createAnalyser();
      scp = offline.createScriptProcessor(256, 0, 1);

      bufferSource.connect(analyser);
      scp.connect(offline.destination); // this is necessary for the script processor to start

      var fps = 60;
      var index = 0.4;
      var length = Math.ceil(buffer.duration*fps);
      var time = 1/fps;
      var data = [];

      let asap = async () => {
        var onSuspend = () => {
          // console.log('onSuspend '+index);
          return new Promise((res, rej)=>{
            index += 1;
            var raw = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(raw);
            data.push(raw);
            if(index < length){
              if(time * (index + 1) < buffer.duration){
                offline.suspend(time * (index + 1)).then(onSuspend);
              }
              offline.resume();
            }
            return res('data received');
          });
        };
        offline.suspend(time * (index + 1)).then(onSuspend);
        bufferSource.start(0);
        console.log('Decoding Audio-Spectrum...');
        await offline.startRendering().then(()=>{
          console.log('Audio-Spectrum Decoded!');
          // return resolve(data);
        }).catch((err)=>{
          console.log('Rendering failed: '+err);
          throw { error : 'Get audio data error', message : err } ;
        });

      }
      console.log('1');
      asap().then(()=>{
        sound.play();
        console.log('2');
        console.log('data', data);
        count = 0;
        animateSound();
      })
    

      console.log('offline start rendering time', sound.context.currentTime);
      console.log('soundBufferDuration', sound.buffer.duration);


      function animateSound() {
        console.log('animateSound', count);
        particleSystem.stop()

        const time = performance.now() / 1000
        const dt = time - lastCallTime
        lastCallTime = time
      
        if (TrexLoaded){
          // console.log("TrexMesh.position is", TrexMesh.position)
          // console.log("TrexMesh.qat is", TrexMesh.quaternion)
          TrexMesh.position.copy(TrexBody.position)
          TrexMesh.quaternion.copy(TrexBody.quaternion)
        }
      
        if (shipLoaded){
          // console.log("TrexMesh.position is", TrexMesh.position)
          // console.log("TrexMesh.qat is", TrexMesh.quaternion)



          shipBody.position.x = Math.sin( time * 0.7 ) * 30+Math.cos( time * 0.5 ) * 10;
          // shipBody.quaternion.x = derivative('Math.sin( x * 0.7 ) * 30', 'x').evaluate({x: time})  
          shipBody.position.y = 15+Math.cos( time * 0.5 ) * 10;
          // shipBody.quaternion.y = derivative('15+Math.cos( x * 0.5 ) * 10', 'x').evaluate({x: time})  
          shipBody.position.z = 10+Math.cos( time * 0.3 ) * 50;
          // shipBody.quaternion.z = derivative('10+Math.cos( x * 0.3 ) * 30', 'x').evaluate({x: time})  
          shipMesh.position.copy(shipBody.position)
          shipMesh.quaternion.copy(shipBody.quaternion)
          

          shipMesh.position.copy(shipBody.position)
          shipMesh.quaternion.copy(shipBody.quaternion)
        }

        if (mixer) mixer.update(dt)

        if (moonLoaded) {
          moonMesh.position.x += Math.sin( time * 0.7 ) * 100
        }
      
        if (controls.enabled) {
          world.step(timeStep, dt)
      
          // Update ball positions
          for (let i = 0; i < balls.length; i++) {
            ballMeshes[i].position.copy(balls[i].position)
            ballMeshes[i].quaternion.copy(balls[i].quaternion)
          }
      
          // Update box positions
          for (let i = 0; i < voxels.boxes.length; i++) {
            boxMeshes[i].position.copy(voxels.boxes[i].position)
            boxMeshes[i].quaternion.copy(voxels.boxes[i].quaternion)
          }
        }
      
        if(isMusicPlayed && isAnalyser){
          syncFrame = false;
      
          // Update light
          removeEntity(ambientLight)
          ambientLight = new THREE.AmbientLight(0xffffff*Math.random(), 0.2)
          ambientLight.name = "ambientLight"
          scene.add(ambientLight)
      
          removeEntity(spotLight);
          spotLight = new THREE.SpotLight(0xffffff*Math.random(), 0.2);
          spotLight.position.set(-10, 70, 20);
          spotLight.lookAt(audioBall);
          spotLight.castShadow = true;
          spotLight.name = "spotLight";
          scene.add(spotLight);
      
          // audio visualizer
          // console.log('analyser2', analyser);
          var freqData = data[count];
          count += 1;
          // console.log('freqData', freqData);
          // console.log('dataArray', dataArray);
      
          lowerHalfArray = freqData.slice(0, (freqData.length/2) - 1);
          upperHalfArray = freqData.slice((freqData.length/2) - 1, freqData.length - 1);
      
          overallAvg = avg(freqData);
          lowerMax = max(lowerHalfArray);
          lowerAvg = avg(lowerHalfArray);
          upperMax = max(upperHalfArray);
          upperAvg = avg(upperHalfArray);
      
          lowerMaxFr = lowerMax / lowerHalfArray.length;
          lowerAvgFr = lowerAvg / lowerHalfArray.length;
          upperMaxFr = upperMax / upperHalfArray.length;
          upperAvgFr = upperAvg / upperHalfArray.length;
          makeRoughBall(audioBall, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
      
          syncFrame = true;
      
      
          if (!isMusicRenderComplete){
            soundCurrentTime = sound.context.currentTime - sound.startTime + soundPrevTime;
            if (soundCurrentTime >= sound.buffer.duration){
                console.log('end song');
                isMusicRenderComplete = true;
            }
          }
        }
      
        controls.update(dt)


        
        renderer.render(scene, camera)
        if(isMusicPlayed){
          // if(isTimeOutRec){
          // }
          // else{
          //   requestAnimationFrame(animateSound)
          // }
          requestAnimationFrame(animateSound);
        }
        else{
          console.log('music end');
          requestAnimationFrame(animate);
        }
        stats.update()
        
      }
    })


      // syncFrame = false;
      
      // function syncFrameRec(isMusicRenderComplete, syncFrame, sound){
      //   animateSound();
      //   if (isMusicRenderComplete){
      //     return;
      //   }
      //   console.log('offline suspend start at', sound.context.currentTime);
      //   offline.suspend(sound.context.currentTime).then(()=>{
      //     console.log('offline suspend at', sound.context.currentTime);
          
      //     console.log('frame sync complete at', sound.context.currentTime);
      //     offline.resume().then(()=>{
      //       console.log('offline resume');
      //       console.log('syncFrameRec');
      //       isTimeOutRec = true;
      //       syncFrameRec(isMusicRenderComplete, syncFrame, sound);
      //     })
      //   })
      // }
      // syncFrameRec(isMusicRenderComplete, syncFrame, sound);
      // while(!isMusicRenderComplete){
      //   console.log('offline suspend start');
      //   offline.suspend(0.01).then(()=>{
      //     console.log('offline suspend at', sound.context.currentTime);
      //     while(!syncFrame){
      //       console.log('frame not sync yet');
      //     }
      //     console.log('frame sync complete at', sound.context.currentTime);
      //     offline.resume()
      //   })
      // }
      





      

      function animateSoundRec() {
        console.log('animateSoundRec');

        const time = performance.now() / 1000
        const dt = time - lastCallTime
        lastCallTime = time
      
        renderer.toneMappingExposure = Math.pow( params.exposure, 5.0 ); // to allow for very bright scenes.
        renderer.shadowMap.enabled = params.shadows;
        bulbLight.castShadow = params.shadows;
      
        if ( params.shadows !== previousShadowMap ) {
      
          // ballMat.needsUpdate = true;
          // cubeMat.needsUpdate = true;
          // floorMat.needsUpdate = true;
          previousShadowMap = params.shadows;
      
        }
      
        bulbLight.power = bulbLuminousPowers[ params.bulbPower ];
        bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow( 0.02, 2.0 );
        bulbLight.position.copy( sphereBody.position );
      
      
        if (controls.enabled) {
          world.step(timeStep, dt)
      
          // Update ball positions
          for (let i = 0; i < balls.length; i++) {
            ballMeshes[i].position.copy(balls[i].position)
            ballMeshes[i].quaternion.copy(balls[i].quaternion)
          }
      
          // Update box positions
          for (let i = 0; i < voxels.boxes.length; i++) {
            boxMeshes[i].position.copy(voxels.boxes[i].position)
            boxMeshes[i].quaternion.copy(voxels.boxes[i].quaternion)
          }
        }
      
        if(isMusicPlayed && isAnalyser){
      
          // Update light
          removeEntity(ambientLight)
          ambientLight = new THREE.AmbientLight(0xffffff*Math.random(), 0.2)
          ambientLight.name = "ambientLight"
          scene.add(ambientLight)
      
          removeEntity(spotLight);
          spotLight = new THREE.SpotLight(0xffffff*Math.random(), 0.2);
          spotLight.position.set(-10, 70, 20);
          spotLight.lookAt(audioBall);
          spotLight.castShadow = true;
          spotLight.name = "spotLight";
          scene.add(spotLight);
      
          // audio visualizer
          // console.log('analyser2', analyser);
          analyser.getByteFrequencyData(freqData);
          console.log('freqData', freqData);
          // console.log('dataArray', dataArray);
      
          lowerHalfArray = freqData.slice(0, (freqData.length/2) - 1);
          upperHalfArray = freqData.slice((freqData.length/2) - 1, freqData.length - 1);
      
          overallAvg = avg(freqData);
          lowerMax = max(lowerHalfArray);
          lowerAvg = avg(lowerHalfArray);
          upperMax = max(upperHalfArray);
          upperAvg = avg(upperHalfArray);
      
          lowerMaxFr = lowerMax / lowerHalfArray.length;
          lowerAvgFr = lowerAvg / lowerHalfArray.length;
          upperMaxFr = upperMax / upperHalfArray.length;
          upperAvgFr = upperAvg / upperHalfArray.length;
          makeRoughBall(audioBall, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));
      
          syncFrame = true;
      
      
          if (!isMusicRenderComplete){
            soundCurrentTime = sound.context.currentTime - sound.startTime + soundPrevTime;
            if (soundCurrentTime >= sound.buffer.duration){
                console.log('end song');
                isMusicRenderComplete = true;
            }
          }
        }
      
        controls.update(dt)
        renderer.render(scene, camera)
        // if(isMusicPlayed){
        //   if(isTimeOutRec){
        //     requestAnimationFrame(animateSoundRec)
        //   }
        //   else{
        //     requestAnimationFrame(animateSound)
        //   }
        // }
        // else{
        //   requestAnimationFrame(animate)
        // }
        stats.update()
        
      }

      // offline = new OfflineAudioContext(2, buffer.length ,44100);
      // bufferSource = offline.createBufferSource();
      // bufferSource.buffer = buffer;

      // analyser = offline.createAnalyser();
      // scp = offline.createScriptProcessor(256, 0, 1);

      // bufferSource.connect(analyser);
      // scp.connect(offline.destination); // this is necessary for the script processor to start

      // freqData = new Uint8Array(analyser.frequencyBinCount);
      // scp.onaudioprocess = function(){

      //   // analyser.getByteFrequencyData(freqData);
      //   // console.log(freqData);
      // };
      // bufferSource.start(0);
      // offline.startRendering();
      // console.log('offline start rendering time', sound.context.currentTime);
      // console.log('soundBufferDuration', sound.buffer.duration);
      // syncFrame = false;
      // function setTimeoutRec(timeout, syncFrame){
      //   if(syncFrame){
      //     return;
      //   }
      //   console.log('timeOut frame not sync yet');
      //   setTimeout(setTimeoutRec, timeout);
      //   setTimeoutRec(timeout, syncFrame);
      // }
      // function syncFrameRec(isMusicRenderComplete, syncFrame, sound){
      //   if (isMusicRenderComplete){
      //     offline.oncomplete = function(e){
      //       while(!isMusicRenderComplete){
      //         console.log('isMusicRenderC');
      //       }
      //       isMusicPlayed = false;
      //       // console.log('analysed');
      //     };
      //     return;
      //   }
      //   console.log('offline suspend start');
      //   offline.suspend(0.05).then(()=>{
      //     console.log('offline suspend at', sound.context.currentTime);
      //     setTimeoutRec(0.01, syncFrame);
      //     console.log('frame sync complete at', sound.context.currentTime);
      //     offline.resume().then(()=>{
      //       console.log('offline resume');
      //     })
      //     console.log('syncFrameRec');
      //     syncFrameRec(isMusicRenderComplete, syncFrame, sound);
      //   })
      // }
      // syncFrameRec(isMusicRenderComplete, syncFrame, sound);
      // while(!isMusicRenderComplete){
      //   console.log('offline suspend start');
      //   offline.suspend(0.01).then(()=>{
      //     console.log('offline suspend at', sound.context.currentTime);
      //     while(!syncFrame){
      //       console.log('frame not sync yet');
      //     }
      //     console.log('frame sync complete at', sound.context.currentTime);
      //     offline.resume()
      //   })
      // }
      
      
    
      

  }); 
  world.addBody(musicBody)


  // Voxels
  voxels = new VoxelLandscape(world, nx, ny, nz, sx, sy, sz)
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      for (let k = 0; k < nz; k++) {
        let filled = true

        // Insert map constructing logic here
        if (Math.sin(i * 0.1) * Math.sin(k * 0.1) < (j / ny) * 2 - 1) {
          filled = false
        }

        voxels.setFilled(i, j, k, filled)
      }
    }
  }

  voxels.update()

  console.log(`${voxels.boxes.length} voxel physics bodies`)

  // Voxel meshes
  for (let i = 0; i < voxels.boxes.length; i++) {
    const box = voxels.boxes[i]
    const voxelGeometry = new THREE.BoxBufferGeometry(voxels.sx * box.nx, voxels.sy * box.ny, voxels.sz * box.nz)
    const voxelMesh = new THREE.Mesh(voxelGeometry, floorMat)
    voxelMesh.castShadow = true
    voxelMesh.receiveShadow = true
    boxMeshes.push(voxelMesh)
    scene.add(voxelMesh)
  }

  // The shooting balls
  const shootVelocity = 15
  const ballShape = new CANNON.Sphere(0.2)
  const ballGeometry = new THREE.SphereBufferGeometry(ballShape.radius, 32, 32)

  // Returns a vector pointing the the diretion the camera is at
  function getShootDirection() {
    const vector = new THREE.Vector3(0, 0, 1)
    vector.unproject(camera)
    const ray = new THREE.Ray(sphereBody.position, vector.sub(sphereBody.position).normalize())
    return ray.direction
  }

  window.addEventListener('click', (event) => {
    if (!controls.enabled) {
      return
    }

    const ballBody = new CANNON.Body({ mass: 1 })
    ballBody.addShape(ballShape)
    material = new THREE.MeshLambertMaterial({
      emissive: 0xCD5C5C,
      
    })
    const ballMesh = new THREE.Mesh(ballGeometry, material)

    ballMesh.castShadow = true
    ballMesh.receiveShadow = true

    world.addBody(ballBody)
    scene.add(ballMesh)
    balls.push(ballBody)
    ballMeshes.push(ballMesh)

    const shootDirection = getShootDirection()
    ballBody.velocity.set(
      shootDirection.x * shootVelocity,
      shootDirection.y * shootVelocity,
      shootDirection.z * shootVelocity
    )

    // Move the ball outside the player sphere
    const x = sphereBody.position.x + shootDirection.x * (sphereShape.radius * 1.02 + ballShape.radius)
    const y = sphereBody.position.y + shootDirection.y * (sphereShape.radius * 1.02 + ballShape.radius)
    const z = sphereBody.position.z + shootDirection.z * (sphereShape.radius * 1.02 + ballShape.radius)
    ballBody.position.set(x, y, z)
    ballMesh.position.copy(ballBody.position)
  })
}



function initPointerLock() {
  controls = new PointerLockControlsCannon(camera, sphereBody)
  scene.add(controls.getObject())

  instructions.addEventListener('click', () => {
    controls.lock()
  })

  controls.addEventListener('lock', () => {
    controls.enabled = true
    instructions.style.display = 'none'
  })

  controls.addEventListener('unlock', () => {
    controls.enabled = false
    instructions.style.display = null
  })
  
}

function removeEntity(object) {
  var selectedObject = scene.getObjectByName(object.name);
  scene.remove( selectedObject );
}

function makeRoughBall(mesh, bassFr, treFr) {
mesh.geometry.vertices.forEach(function (vertex, i) {
  var offset = mesh.geometry.parameters.radius;
  var amp = 7;
  var time = window.performance.now();
  vertex.normalize();
  var rf = 0.00001;
  var distance = (offset + bassFr ) + noise.noise3D(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr;
  vertex.multiplyScalar(distance);
});
mesh.geometry.verticesNeedUpdate = true;
mesh.geometry.normalsNeedUpdate = true;
mesh.geometry.computeVertexNormals();
mesh.geometry.computeFaceNormals();
}

//some helper functions for audio visualizer here
function fractionate(val, minVal, maxVal) {
return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
var fr = fractionate(val, minVal, maxVal);
var delta = outMax - outMin;
return outMin + (fr * delta);
}

function avg(arr){
var total = arr.reduce(function(sum, b) { return sum + b; });
return (total / arr.length);
}

function max(arr){
return arr.reduce(function(a, b){ return Math.max(a, b); })
}

function animate() {

  const time = performance.now() / 1000
  const dt = time - lastCallTime
  lastCallTime = time


  if (TrexLoaded){
    // console.log("TrexMesh.position is", TrexMesh.position)
    // console.log("TrexMesh.qat is", TrexMesh.quaternion)
    TrexMesh.position.copy(TrexBody.position)
    TrexMesh.quaternion.copy(TrexBody.quaternion)
  }

  if (shipLoaded){
    // console.log("TrexMesh.position is", TrexMesh.position)
    // console.log("TrexMesh.qat is", TrexMesh.quaternion)

    shipBody.position.x = Math.sin( time * 0.7 ) * 30+Math.cos( time * 0.5 ) * 10;
    // shipBody.quaternion.x = derivative('Math.sin( x * 0.7 ) * 30', 'x').evaluate({x: time})  
    shipBody.position.y = 15+Math.cos( time * 0.5 ) * 10;
    // shipBody.quaternion.y = derivative('15+Math.cos( x * 0.5 ) * 10', 'x').evaluate({x: time})  
    shipBody.position.z = 10+Math.cos( time * 0.3 ) * 50;
    shipMesh.position.copy(shipBody.position)
    shipMesh.quaternion.copy(shipBody.quaternion)
  }

  if (mixer) mixer.update(dt)

  if (moonLoaded) {
    moonMesh.position.x += 0.01*time
    // console.log(moonMesh)
    // console.log(moonMesh)
  }


  if (controls.enabled) {
    world.step(timeStep, dt)

    // Update ball positions
    for (let i = 0; i < balls.length; i++) {
      ballMeshes[i].position.copy(balls[i].position)
      ballMeshes[i].quaternion.copy(balls[i].quaternion)
    }

    // Update box positions
    for (let i = 0; i < voxels.boxes.length; i++) {
      boxMeshes[i].position.copy(voxels.boxes[i].position)
      boxMeshes[i].quaternion.copy(voxels.boxes[i].quaternion)
    }


  }

  
  controls.update(dt)
  renderer.render(scene, camera)
  if(!isMusicPlayed){
    // console.log('no music played');
    requestAnimationFrame(animate)
  }
  // else{
  //   requestAnimationFrame(animateSound)
  // }
  stats.update()
  
}
function addShip2(pathScene, pathWorld, positionX, positionY, positionZ, mass) {
  let threeRoot = null
  let newBody = null
  const sceneLoader = new GLTFLoader();
  sceneLoader.load(pathScene, (gltf) => {
    threeRoot = gltf.scene;
    threeRoot.position.x=positionX
    threeRoot.position.y=positionY
    threeRoot.position.z=positionZ
    threeRoot.castShadow = true
    threeRoot.receiveShadow = true
    threeRoot.traverse((child)=>{
      if (child.isMesh){
        child.castShadow = true
        child.receiveShadow = true
        child.material = new THREE.MeshNormalMaterial() 
      }
    })
          const worldLoader = new GLTFLoader();
          worldLoader.load(pathWorld, (gltf) => {
            const worldRoot = gltf.scene;
            newBody = new CANNON.Body({mass: mass})
            newBody.position.x=positionX
            newBody.position.y=positionY
            newBody.position.z=positionZ
            worldRoot.traverse((child)=>{
              if (child.isMesh){
                const primShape = new threeToCannon(child)
                newBody.addShape(primShape.shape, child.position, child.quaternion)
              }
            })
            world.addBody(newBody)
            scene.add(threeRoot) 

          })

    
  })

}


function addShip(pathScene, pathWorld, positionX, positionY, positionZ, mass) {
  let threeRoot = null
  let newBody = null
  const sceneLoader = new GLTFLoader();
  sceneLoader.load(pathScene, (gltf) => {
    threeRoot = gltf.scene;
    threeRoot.position.x=positionX
    threeRoot.position.y=positionY
    threeRoot.position.z=positionZ
    threeRoot.castShadow = true
    threeRoot.receiveShadow = true
    threeRoot.traverse((child)=>{
      if (child.isMesh){
        child.castShadow = true
        child.receiveShadow = true
        child.material = new THREE.MeshNormalMaterial() 
      }
    })
          const worldLoader = new GLTFLoader();
          worldLoader.load(pathWorld, (gltf) => {
            const worldRoot = gltf.scene;
            newBody = new CANNON.Body({mass: mass})
            newBody.position.x=positionX
            newBody.position.y=positionY
            newBody.position.z=positionZ
            worldRoot.traverse((child)=>{
              if (child.isMesh){
                const primShape = new threeToCannon(child)
                newBody.addShape(primShape.shape, child.position, child.quaternion)
              }
            })
            world.addBody(newBody)
            scene.add(threeRoot) 
            shipMesh = threeRoot
            shipBody = newBody
            shipLoaded = true
          })

    
  })

}

addShip('../models/ship.glb', '../models/ship_body.glb', 48, 3, -31, 0)

addShip2('../models/ship.glb', '../models/ship_body.glb', 50, 2, -11, 0)


addCorona('../models/corona.gltf', '../models/corona.gltf', 20, 2, -21, 0)

function addCorona(pathScene, pathWorld, positionX, positionY, positionZ, mass) {
  let threeRoot = null

  const sceneLoader = new GLTFLoader();
  console.log("gltf corona loading...")
  sceneLoader.load(pathScene, (gltf) => {
    mixer = new THREE.AnimationMixer( gltf.scene );
    var action = mixer.clipAction( gltf.animations[ 0 ] );
    action.loop = THREE.LoopPingPong
    action.play();
    var action1 = mixer.clipAction( gltf.animations[ 1 ] );
    action1.loop = THREE.LoopPingPong
    action1.play();
    var action2 = mixer.clipAction( gltf.animations[ 2 ] );
    action2.loop = THREE.LoopPingPong
    action2.play();
    var action3 = mixer.clipAction( gltf.animations[ 3 ] );
    action3.loop = THREE.LoopPingPong
    action3.play();
    console.log("gltf", gltf)

    threeRoot = gltf.scene;
    threeRoot.position.x=positionX
    threeRoot.position.y=positionY
    threeRoot.position.z=positionZ
    threeRoot.castShadow = true
    threeRoot.receiveShadow = true
    scene.add(threeRoot) 
  })

}


function addTrex(pathScene, pathWorld, positionX, positionY, positionZ, mass) {
  let threeRoot = null
  let newBody = null
  const sceneLoader = new GLTFLoader();
  sceneLoader.load(pathScene, (gltf) => {
    threeRoot = gltf.scene;
    threeRoot.position.x=positionX
    threeRoot.position.y=positionY
    threeRoot.position.z=positionZ

    console.log("overr:", threeRoot.overrideMaterial)

    threeRoot.traverse((child)=>{
      if (child.isMesh){
        child.castShadow = true
        child.receiveShadow = true
        child.material = new THREE.MeshNormalMaterial() 
      }
    })
    
          const worldLoader = new GLTFLoader();
          worldLoader.load(pathWorld, (gltf) => {
            const worldRoot = gltf.scene;
            newBody = new CANNON.Body({mass: mass})
            newBody.position.x=positionX
            newBody.position.y=positionY
            newBody.position.z=positionZ
            worldRoot.traverse((child)=>{
              if (child.isMesh){
                const primShape = new threeToCannon(child, {type: ShapeType.HULL})
                newBody.addShape(primShape.shape, child.position, child.quaternion)
              }
            })
            world.addBody(newBody)
            scene.add(threeRoot) 
            console.log("threeRoot",threeRoot)
            TrexMesh = threeRoot
            TrexBody = newBody
            TrexLoaded = true
            console.log("trexmesh", TrexMesh)
          })    
  })
}

addTrex('../models/trex.gltf', '../models/trex_body.gltf', 30, 0, 21, 1)

addMoonWalk('../models/moonwalk.glb', '../models/moonwalk.glb', 0, 4, 0, 0)

function addMoonWalk(pathScene, pathWorld, positionX, positionY, positionZ, mass) {
  let threeRoot = null

  const sceneLoader = new GLTFLoader();
  console.log("gltf corona loading...")
  sceneLoader.load(pathScene, (gltf) => {
    mixer = new THREE.AnimationMixer( gltf.scene );
    var action0 = mixer.clipAction( gltf.animations[ 0 ] );
    action0.loop = THREE.LoopPingPong
    action0.play()
    console.log("gltf", gltf)

    threeRoot = gltf.scene;
    threeRoot.position.x=positionX
    threeRoot.position.y=positionY
    threeRoot.position.z=positionZ
    threeRoot.castShadow = true
    threeRoot.receiveShadow = true
    scene.add(threeRoot) 
    moonMesh = threeRoot
    // moonBody = newBody
    moonLoaded = true
  })

}

const particleSystem = new ParticleSystem()
particleSystem.emitter = new SnowEmitter()
console.log("emitter:", particleSystem.emitter)
scene.add(particleSystem.mesh)
particleSystem.start()