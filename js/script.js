import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.141.0/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from "https://unpkg.com/three@0.141.0/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "https://unpkg.com/three@0.141.0/examples/jsm/loaders/MTLLoader";
import { GLTFLoader } from "https://unpkg.com/three@0.141.0/examples/jsm/loaders/GLTFLoader"; 

let drawerOpen, drawerClicked;
let mixer, clock;
let diaryMixer, diaryOpenArmature;
let zoomDiary = false ;
let diaryOpenDuration = 0;
let actions;
let textureEquirec;
let obj = []; // book, 
var Clicked = 0;
let diaryActions = [];

main();

function main() {
    const canvas = document.querySelector("#c"); 
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.physicallyCorrectLights = true

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 1000);
    camera.position.set(10,30,25); 
    camera.lookAt(0,0,0);
    
    const skytextureLader = new THREE.TextureLoader();

    const skyloader = skytextureLader.load('../assets/skytexture.jpeg');
    skyloader.mapping = THREE.EquirectangularReflectionMapping;
    skyloader.encoding = THREE.sRGBEncoding;
    scene.background = skyloader;

    const textureLoader = new THREE.TextureLoader();

    textureEquirec = textureLoader.load( '../assets/hdri7.jpg' );
    textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
    textureEquirec.encoding = THREE.sRGBEncoding;


    clock = new THREE.Clock();

    {
      const color = 0xFFFFFF;
      const intensity = 2.5; 
      const light = new THREE.DirectionalLight(color, intensity); 
      light.position.set(0, 30, 10);
      light.target.position.set(0, -10, 0);
      scene.add(light);
      scene.add(light.target);
    }

   
    const rayCast= new THREE.Raycaster(); 
    const mouse = new THREE.Vector2(); 
    mouse.x = mouse.y = -1;

    const controls = new OrbitControls(camera,canvas);
    controls.target.set(0,5,0);
    controls.update();

    {
      const deskModel = new GLTFLoader();
      const deskurl = "../assets/desk/desk.glb";
      deskModel.load(deskurl, (gltf) => {
        const desk = gltf.scene;
        desk.scale.set(5, 5, 5);
        desk.position.y = -10;
        scene.add(desk);
        desk.traverse((child)=>{
          console.log(child.name);
          if (child.name == "Plane001"|| child.name == "Cylinder004"){
            child.material.metalness = 0.3;
            child.material.envMap = textureEquirec;
            child.material.needsUpdate = true;
          }
        })
      }) 
    }
    {
      const boardModel = new GLTFLoader();
      const boardurl = "../assets/desk/board.glb";
      boardModel.load(boardurl, (gltf) => {
        const board = gltf.scene;
        board.scale.set(5, 5, 5);
        board.position.y = -10;
        scene.add(board);
      }) 
    }

    {
      const deskModel = new GLTFLoader();
      const deskurl = "../assets/desk/drawer.glb";
      deskModel.load(deskurl, (gltf) => {
        const desk = gltf.scene;
        desk.scale.set(5, 5, 5);
        desk.position.y = -10;
        scene.add(desk);
        console.log("desk");
        console.log(desk);
        desk.traverse((child)=>{
          console.log("child.name");
          console.log(child.name);
          if (child.name == "Plane004"){
            child.material.metalness = 0.3;
            child.material.envMap = textureEquirec;
            child.material.needsUpdate = true;
          }
        })

        const animations = gltf.animations;
        mixer = new THREE.AnimationMixer( desk );

				drawerOpen = mixer.clipAction( animations[ 0 ] );
				actions = [ drawerOpen ];
        activateAllActions();
        
        drawerOpen.stop();
        drawerOpen.clampWhenFinished = true;
        drawerOpen.loop = THREE.LoopOnce;

				animate();
      }) 
    }


    {
      const bookModel = new GLTFLoader();
      const bookurl = "../assets/desk/book.glb";
      bookModel.load(bookurl, (gltf) => {
        const book = gltf.scene;
        book.scale.set(5, 5, 5);
        book.position.y = -10;
        scene.add(book);

        obj.push(book);
        book.isvisible = false

        const animations = gltf.animations;
        diaryMixer = new THREE.AnimationMixer( book );

        console.log("diaryanimations");
        console.log(animations);

        const armatureClip = THREE.AnimationClip.findByName( animations, 'ArmatureAction' );
				diaryOpenArmature = diaryMixer.clipAction( armatureClip );
		
        diaryActions.push(diaryOpenArmature);
        activateAllActions();

        diaryOpenArmature.stop();

        diaryOpenArmature.clampWhenFinished = true;
        diaryOpenArmature.loop = THREE.LoopOnce;

				animate();
      }) 
    }

    function openDrawer(time) {
      time *= 0.01;
      if (drawerClicked) {
        console.log("openDrawer()");
        setWeight(drawerOpen, 1.0);
        setWeight(diaryOpenArmature, 1.0);

        drawerOpen.play();
        diaryOpenArmature.play(); 

        if (!drawerOpen.isRunning()){
          drawerClicked = false;
          zoomDiary = true; 
        }
      }

      requestAnimationFrame(openDrawer);
    }

    function diaryZoom(time){
      time *= 0.01; 
      if (zoomDiary){
        console.log("diaryOpenDuration");
        console.log(diaryOpenDuration);
        camera.position.set(10-diaryOpenDuration*0.03, 30-diaryOpenDuration*0.07, 25-diaryOpenDuration*0.06);
        camera.lookAt(0, -3, 0);
        diaryOpenDuration += 1;
        if (diaryOpenDuration >= 200){
          zoomDiary = false;
        }
      }
      requestAnimationFrame(diaryZoom);
    }

    function setWeight( action, weight ) {
        action.enabled = true;
        action.setEffectiveTimeScale( 1 );
        action.setEffectiveWeight( weight );
    }

    function activateAllActions() {
      actions.forEach( function ( action ) {
        setWeight(action, 0.0);
      } );
      
      console.log(diaryActions);
    }

    function deactivateAllActions() {

      actions.forEach( function ( action ) {

        action.stop();

      } );
    }

    function animate() {
        requestAnimationFrame( animate );

        let mixerUpdateDelta = clock.getDelta();
        // Update the animation mixer, the stats panel, and render this frame

        diaryMixer.update( mixerUpdateDelta );
        mixer.update( mixerUpdateDelta );
        // stats.update();
        renderer.render( scene, camera );
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const width  = canvas.clientWidth  * pixelRatio | 0;
        const height = canvas.clientHeight * pixelRatio | 0;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
    }

    class PickHelper {
        constructor() {
          this.raycaster = new THREE.Raycaster();
          this.pickedObject = null;
          this.pickedObjectSavedColor = 0;
        }
        pick(normalizedPosition, scene, camera, time) {
            time *= 0.001;
          // restore the color if there is a picked object
          if (this.pickedObject) {
            this.pickedObject.material.emissive = this.pickedObjectSavedColor;
            this.pickedObject = undefined;
          }
    
          // cast a ray through the frustum
          this.raycaster.setFromCamera(normalizedPosition, camera);
          // get the list of objects the ray intersected
          const intersectedObjects = this.raycaster.intersectObjects(scene.children);
          
          if (intersectedObjects.length) {
            this.pickedObject = intersectedObjects[0].object;

            if(Clicked == 1){
              console.log("----------pickedObject.name------------");
              console.log(this.pickedObject.name);

              if (this.pickedObject.name == "Plane004"){
                drawerClicked = true;
              }
              if (this.pickedObject.name == "Plane004_1"){
                diaryClicked = true;
              }
              Clicked = 0
            }
          } 
        }
      }

    const pickPosition = {x: 0, y: 0};
    const pickHelper = new PickHelper();
    clearPickPosition();

    function getCanvasRelativePosition(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * canvas.width  / rect.width,
        y: (event.clientY - rect.top ) * canvas.height / rect.height,
      };
    }
  
    function setPickPosition(event) {
      const pos = getCanvasRelativePosition(event);
      pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
      pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
    }
  
    function clearPickPosition() {
      // unlike the mouse which always has a position
      // if the user stops touching the screen we want
      // to stop picking. For now we just pick a value
      // unlikely to pick something
      pickPosition.x = -100000;
      pickPosition.y = -100000;
    }

    function onMouseClick(e) { 
      Clicked = 1;
    }

    Math.radians = function(degrees) {
      return degrees * Math.PI / 180;
      };
    window.addEventListener('mousemove', setPickPosition);
    window.addEventListener('mouseout', clearPickPosition);
    window.addEventListener('mouseleave', clearPickPosition);
  
    window.addEventListener('touchstart', (event) => {
      // prevent the window from scrolling
      event.preventDefault();
      setPickPosition(event.touches[0]);
    }, {passive: false});
  
    window.addEventListener('touchmove', (event) => {
      setPickPosition(event.touches[0]);
    });
    window.addEventListener('click', onMouseClick);
    window.addEventListener('touchend', clearPickPosition);


    function render(time) {
      time *= 0.01;

      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
      pickHelper.pick(pickPosition, scene, camera, time);

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
    requestAnimationFrame(openDrawer);
    requestAnimationFrame(diaryZoom);
}
