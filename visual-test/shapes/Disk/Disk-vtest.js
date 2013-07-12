require.config({
	paths: {
		"goo": "../../../src/goo"
	}
});

require([
	'goo/entities/GooRunner',
	'goo/entities/World',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Camera',
	'goo/shapes/ShapeCreator',
	'goo/entities/components/CameraComponent',
	'goo/scripts/OrbitCamControlScript',
	'goo/entities/EntityUtils',
	'goo/entities/components/ScriptComponent',
	'goo/renderer/MeshData',
	'goo/entities/components/MeshRendererComponent',
	'goo/math/Vector3',
	'goo/renderer/light/PointLight',
	'goo/renderer/light/DirectionalLight',
	'goo/renderer/light/SpotLight',
	'goo/entities/components/LightComponent',
	'goo/shapes/Disk'
], function (
	GooRunner,
	World,
	Material,
	ShaderLib,
	Camera,
	ShapeCreator,
	CameraComponent,
	OrbitCamControlScript,
	EntityUtils,
	ScriptComponent,
	MeshData,
	MeshRendererComponent,
	Vector3,
	PointLight,
	DirectionalLight,
	SpotLight,
	LightComponent,
	Disk
	) {
	'use strict';

	function addNormalsToWorld(goo, entity) {
		var normalsMeshData = entity.meshDataComponent.meshData.getNormalsMeshData();
		var normalsMaterial = Material.createMaterial(ShaderLib.simpleColored, '');
		normalsMaterial.uniforms.color = [0.2, 1.0, 0.6];
		var normalsEntity = EntityUtils.createTypicalEntity(goo.world, normalsMeshData, normalsMaterial, '');
		normalsEntity.transformComponent.transform = entity.transformComponent.transform;
		normalsEntity.addToWorld();
	}

	function diskDemo(goo) {
		var material = Material.createMaterial(ShaderLib.simpleLit, '');

		// add pointy disk
		var pointyDiskMeshData = new Disk(64, 4, 8);
		var pointyDiskEntity = EntityUtils.createTypicalEntity(goo.world, pointyDiskMeshData, material, 'Pointy Disk');
		pointyDiskEntity.transformComponent.transform.translation.setd(-9, 0, 0);
		pointyDiskEntity.addToWorld();
		addNormalsToWorld(goo, pointyDiskEntity);

		// add flat disk
		var flatDiskMeshData = new Disk(64, 4, 0);
		var flatDiskEntity = EntityUtils.createTypicalEntity(goo.world, flatDiskMeshData, material, 'Flat Disk');
		flatDiskEntity.addToWorld();
		addNormalsToWorld(goo, flatDiskEntity);

		// add inversly pointy disk
		var ipointyDiskMeshData = new Disk(64, 4, -4);
		var iPointyDiskEntity = EntityUtils.createTypicalEntity(goo.world, ipointyDiskMeshData, material, '-Pointy Disk');
		iPointyDiskEntity.transformComponent.transform.translation.setd(9, 0, 0);
		iPointyDiskEntity.addToWorld();
		addNormalsToWorld(goo, iPointyDiskEntity);

		// add lights
		var light = new PointLight();
		var lightEntity = goo.world.createEntity('light');
		lightEntity.setComponent(new LightComponent(light));
		lightEntity.transformComponent.transform.translation.set(0, 10, 10);
		lightEntity.addToWorld();

		// camera
		var camera = new Camera(45, 1, 1, 1000);
		var cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.transformComponent.transform.translation.set(0, 0, 3);
		cameraEntity.transformComponent.transform.lookAt(new Vector3(0, 0, 0), Vector3.UNIT_Y);
		cameraEntity.setComponent(new CameraComponent(camera));
		cameraEntity.addToWorld();
		var scripts = new ScriptComponent();
		scripts.scripts.push(new OrbitCamControlScript({
			domElement : goo.renderer.domElement,
			spherical : new Vector3(25, Math.PI / 2, 0)
		}));
		cameraEntity.setComponent(scripts);
	}

	function init() {
		var goo = new GooRunner();
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		diskDemo(goo);
	}

	init();
});
