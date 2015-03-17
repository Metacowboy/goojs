require([
	'goo/renderer/Camera',
	'goo/entities/components/HtmlComponent',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/shapes/Box',
	'goo/shapes/Quad',
	'goo/math/Vector3',
	'goo/math/Transform',
	'goo/math/MathUtils',
	'goo/util/gizmopack/GizmoRenderSystem',
	'goo/util/Skybox',
	'lib/V',
	'goo/scripts/Scripts',
	'goo/renderer/Renderer',

	'goo/animationpack/systems/AnimationSystem',
	'goo/fsmpack/statemachine/StateMachineSystem',
	'goo/entities/systems/HtmlSystem',
	'goo/timelinepack/TimelineSystem',
	'goo/loaders/DynamicLoader',

	'goo/scriptpack/OrbitNPanControlScript',

	'goo/animationpack/handlers/AnimationHandlers',

	'goo/fsmpack/StateMachineHandlers',
	'goo/timelinepack/TimelineComponentHandler',
	'goo/passpack/PosteffectsHandler',
	'goo/quadpack/QuadComponentHandler',
	'goo/scriptpack/ScriptHandlers',
	'goo/scriptpack/ScriptRegister',
	'goo/scripts/GooClassRegister'
], function(
	Camera,
	HtmlComponent,
	Material,
	ShaderLib,
	Box,
	Quad,
	Vector3,
	Transform,
	MathUtils,
	GizmoRenderSystem,
	Skybox,
	V,
	Scripts,
	Renderer,
	AnimationSystem,
	StateMachineSystem,
	HtmlSystem,
	TimelineSystem,
	DynamicLoader,
	OrbitNPanControlScript
) {
	'use strict';

	V.describe('Testing the matching of CSS3D transformed DOM elements to our entities');

	var gizmoRenderSystem;
	var entitySelected;

	function key1() {
		gizmoRenderSystem.setActiveGizmo(0);
	}

	function key2() {
		gizmoRenderSystem.setActiveGizmo(1);
	}

	function key3() {
		gizmoRenderSystem.setActiveGizmo(2);
	}

	function setupKeys() {
		document.body.addEventListener('keypress', function(e) {
			switch (e.which) {
				case 49: // 1
					key1();
					break;
				case 50: // 2
					key2();
					break;
				case 51: // 3
					key3();
					break;
				case 52: // 4
					goo.renderer.domElement.style.pointerEvents = 'none';
					break;
				case 53: // 5
					goo.renderer.domElement.style.pointerEvents = 'inherit';
					break;
				case 54: // 6
					if (entitySelected) {
						var w = entitySelected.HtmlComponent.width;
						var h = entitySelected.HtmlComponent.height;
						entitySelected.HtmlComponent.setSize(w/2, h/2);
					}
					break;
				case 55: // 7
					if (entitySelected) {
						var w = entitySelected.HtmlComponent.width;
						var h = entitySelected.HtmlComponent.height;
						entitySelected.HtmlComponent.setSize(w*2, h*2);
					}
					break;

				default:
					console.log('1: translate gizmo\n2: rotate gizmo\n3: scale gizmo');
			}
		});
	}

	function setupMouse() {
		function onPick(e) {
			if (e.domEvent.button !== 0) {
				return;
			}
			if (e.domEvent.shiftKey || e.domEvent.altKey) {
				return;
			}

			if (e.id < 16000) {
				if (e.id >= 0) {
					entitySelected = goo.world.entityManager.getEntityByIndex(e.id);
					gizmoRenderSystem.show(entitySelected);
				} else {
					gizmoRenderSystem.show(); // actually hides
				}
			} else if (e.id < 16100) {
				gizmoRenderSystem.activate(e.id, e.x, e.y);
			}
		}

		goo.addEventListener('mousedown', onPick);
		goo.addEventListener('touchstart', onPick);

		function onUnpick() {
			gizmoRenderSystem.deactivate();
		}

		document.addEventListener('mouseup', onUnpick);
		document.addEventListener('touchend', onUnpick);
	}

	function setupGizmos() {
		gizmoRenderSystem = new GizmoRenderSystem();
		gizmoRenderSystem.setActiveGizmo(0);
		goo.setRenderSystem(gizmoRenderSystem);
	}

	function addOrbitCamera(spherical, lookAt, dragButton) {
		spherical = new Vector3(spherical);
		lookAt = new Vector3(lookAt);

		// Convert to degrees since the script uses degrees
		spherical.y = MathUtils.degFromRad(spherical.y);
		spherical.z = MathUtils.degFromRad(spherical.z);

		var camera = new Camera();

		var orbitCamOptions = {
			domElement: goo.renderer.domElement,
			releaseVelocity: true,
			interpolationSpeed: 7,
			dragButton: dragButton || 'Any',
			lookAtDistance: null,
			spherical: spherical,
			whenUsed : true,
			orbitSpeed : 0.005,
			zoomSpeed : 1,
			inertia: 0.9,
			smoothness: 0.4,
			drag : 0,
			minZoomDistance : 0.001,
			maxZoomDistance : 1000,
			minAscent : -89,
			maxAscent : 89,
			clampAzimuth : false,
			minAzimuth : 90,
			maxAzimuth : 270,
			lookAtPoint: lookAt,

			// Pan
			panButton: 'Middle',
			panSpeed : 0.005
		};

		var orbitScript = Scripts.create(OrbitNPanControlScript, orbitCamOptions);
		var entity = V.goo.world.createEntity(camera, orbitScript, 'CameraEntity').addToWorld();
		return entity;
	}

	function loadProject(gooRunner) {

		// The loader takes care of loading the data.
		var loader = new DynamicLoader({
			world: gooRunner.world,
			rootPath: 'res'
		});

		return loader.load('root.bundle', {
			preloadBinaries: true,
			//progressCallback: progressCallback
		}).then(function(result) {
			var project = null;

			// Try to get the first project in the bundle.
			for (var key in result) {
				if (/\.project$/.test(key)) {
					project = result[key];
					break;
				}
			}

			if (!project || !project.id) {
				alert('Error: No project in bundle'); // Should never happen.
				return null;
			}

			return loader.load(project.id);
		});
	}

	var goo = V.initGoo({
		alpha: true
	});
	var world = goo.world;
	goo.world.add(new AnimationSystem());
	goo.world.add(new StateMachineSystem(goo));
	goo.world.add(new HtmlSystem(goo.renderer));
	goo.world.add(new TimelineSystem());
	// var htmlSystem = new HtmlSystem(goo.renderer);
	// goo.world.setSystem(htmlSystem);

	var transformSystem = world.getSystem('TransformSystem');
	var cameraSystem = world.getSystem('CameraSystem');
	var lightingSystem = world.getSystem('LightingSystem');
	var boundingSystem = world.getSystem('BoundingUpdateSystem');
	var renderSystem = world.getSystem('RenderSystem');
	var renderer = goo.renderer;

	// Load the project
	loadProject(goo).then(function() {
		world.processEntityChanges();
		transformSystem._process();
		lightingSystem._process();
		cameraSystem._process();
		boundingSystem._process();
		if (Renderer.mainCamera) {
			goo.renderer.checkResize(Renderer.mainCamera);
		}
	}).then(function() {
		var goon = world.by.name('goon_mesh').first();
		// goon.meshRendererComponent.isReflectable = true;
		// goon.setTranslation(0, -1000, 3000);
		goon.setScale(20, 20, 20);

		goo.renderSystems[0].composers.length = 0;

		// add the gizmo render system
		setupGizmos();

		// allow using the mouse to select what entity to transform
		setupMouse();

		setupKeys();

		V.addLights();
		// var camEntity = V.addOrbitCamera(new Vector3(150, Math.PI / 1.5, Math.PI / 8), new Vector3(), 'Right');
		// var camEntity = V.addOrbitCamera(new Vector3(50, Math.PI / 2, 0), new Vector3(), 'Right');
		var camEntity = addOrbitCamera(new Vector3(100, Math.PI / 2, 0), new Vector3(), 'Right');
		camEntity.cameraComponent.camera.setFrustumPerspective(null, null, 1, 10000);
		camEntity.setAsMainCamera();

		// console.log(window.WindowHelper);
		// window.WindowHelper.install(htmlSystem.rootDom, goo.renderer.domElement);

		var material2 = new Material(ShaderLib.uber);
		material2.uniforms.materialDiffuse = [0.3, 0.3, 0.3, 1];
		var box2 = new Box(100, 20, 100);
		var entity = world.createEntity([0, -10, 0], box2, material2).addToWorld();

		var numBoxes = 2;
		var spread = 70.0;
		for (var i = 0; i < numBoxes; i++) {
			for (var j = 0; j < numBoxes; j++) {
				for (var k = 0; k < numBoxes; k++) {
					var domElement;
					var width = (0.5 + V.rng.nextFloat() * 3) * 100;
					var height = (0.5 + V.rng.nextFloat() * 3) * 100;
					var rand = V.rng.nextFloat();
					if (rand > 0.6) {
						domElement = document.createElement('div');
						domElement.style.backgroundImage = 'url(https://dl.dropboxusercontent.com/u/640317/screenshot.jpg)';
					} else if (rand > 0.1) {
						domElement = document.createElement('div');
						domElement.className = 'object';
						domElement.innerText = 'Gooooo';
						domElement.style.border = '2px solid white';
						domElement.style.backgroundColor = 'blue';
						domElement.style.color = 'white';
						domElement.style.padding = '20px';
					} else {
						width = 768;
						height = 640;
						domElement = document.createElement('iframe');
						// domElement.src = 'https://get.webgl.org/';
						domElement.src = 'https://gootechnologies.com';
						domElement.style.border = 'none';
						domElement.style.width = '100%';
						domElement.style.height = '100%';
					}

					var htmlComponent = new HtmlComponent(domElement, {
						width: width,
						height: height
						// backfaceVisibility: 'visible'
					});

					// Make some elements face the camera
					// htmlComponent.faceCamera = V.rng.nextFloat() > 0.95;

					var position = [
						(i - (numBoxes / 4)) * spread, (j - (numBoxes / 4)) * spread + 120, (k - (numBoxes / 4)) * spread
					];
					var entity = world.createEntity(position, htmlComponent);
					entity.setScale(0.1, 0.1, 1);
					entity.addToWorld();

					// if (V.rng.nextFloat() > 0.7) {
					// 	var r1 = V.rng.nextFloat();
					// 	var r2 = V.rng.nextFloat();
					// 	(function(r1, r2) {
					// 		var script = function (entity) {
					// 			entity.setRotation(world.time * r1, world.time * r2, 0);
					// 		};
					// 		entity.set(script);
					// 	})(r1, r2);
					// }
				}
			}
		}

		var environmentPath = '../../../addons/Water/resources/skybox/';
		var images = [
			environmentPath + '1.jpg',
			environmentPath + '3.jpg',
			environmentPath + '6.jpg',
			environmentPath + '5.jpg',
			environmentPath + '4.jpg',
			environmentPath + '2.jpg'
		];
		var skybox = new Skybox(Skybox.BOX, images, null, 0);
		var skyEnt = goo.world.createEntity(
			skybox.transform,
			skybox.materials[0],
			skybox.meshData
		).addToWorld();
		skyEnt.meshRendererComponent.cullMode = 'Never';

		return renderer.precompileShaders(renderSystem._activeEntities, renderSystem.lights);
	}).then(function() {
		return renderer.preloadMaterials(renderSystem._activeEntities);
	}).then(function() {
		// Start the rendering loop!
		V.process();
	}).then(null, function(e) {
		// If something goes wrong, 'e' is the error message from the engine.
		alert('Failed to load project: ' + e);
	});

});
