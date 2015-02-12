require([
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/shapes/Box',
	'goo/shapes/Quad',
	'goo/shapes/Sphere',
	'goo/math/Vector3',
	'goo/math/Matrix4x4',
	'goo/renderer/MeshData',
	'goo/renderer/TextureCreator',
	'goo/addons/linerenderpack/LineRenderSystem',
	'lib/V'
], function (
	Material,
	ShaderLib,
	Box,
	Quad,
	Sphere,
	Vector3,
	Matrix4x4,
	MeshData,
	TextureCreator,
	LineRenderSystem,
	V
	) {
	'use strict';

	V.describe('Rendering one non-rotated box, one rotated box and 3 colored lines.');

	var goo = V.initGoo({showStats:true});
	var world = goo.world;
	var LRS = new LineRenderSystem(world);
	
	world.setSystem(LRS);

	V.addOrbitCamera(new Vector3(Math.PI*7, Math.PI / 2.3, 0.4));
	V.addLights();


	var nonRotatedBoxMin = new Vector3(-4,-1,-1);
	var nonRotatedBoxMax = new Vector3(-2,1,1);

	var rotatedBoxMin = new Vector3(-1,-1,-1);
	var rotatedBoxMax = new Vector3(1,1,1);
	var rotationMatrix = new Matrix4x4();

	var coloredLinesStart = new Vector3(2,-1,0);
	var coloredLinesEnd = new Vector3();

	var update = function() {

		//draw the non rotated box
		LRS.drawAABox(nonRotatedBoxMin, nonRotatedBoxMax, LRS.GREEN);

		//update and draw the rotated box
		var rotationVector = new Vector3(0, Math.sin(world.time), Math.cos(world.time));
		rotationMatrix.setRotationFromVector(rotationVector);

		LRS.drawAABox(rotatedBoxMin, rotatedBoxMax, LRS.RED, rotationMatrix);

		//draw a few colored lines!
		for(var i=0;i<3;i++)
		{
			var color = LRS.BLUE;
			if(i%3 === 1)
			{
				color = LRS.YELLOW;
			}
			else if(i%3 === 2)
			{
				color = LRS.MAGENTA;
			}

			coloredLinesStart.setDirect(2+i,1,0);
			coloredLinesEnd.setVector(coloredLinesStart).addDirect(0,-2,0);

			LRS.drawLine(coloredLinesStart, coloredLinesEnd, color);
		}

	};
	
	goo.callbacks.push(update);

	V.process();
});