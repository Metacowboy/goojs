var HeightMapBoundingScript = require('../scriptpack/HeightMapBoundingScript');
var Vector3 = require('../math/Vector3');

var calcVec1 = new Vector3();
var calcVec2 = new Vector3();

var _defaults = {
	minX: 0,
	maxX: 100,
	minY: 0,
	maxY: 50,
	minZ: 0,
	maxZ: 100
};

function validateTerrainProperties(properties, heightMatrix) {
	if (properties.minX > properties.maxX) {
		throw new Error({ name: 'Terrain Exception', message: 'minX is larger than maxX' });
	}
	if (properties.minY > properties.maxY) {
		throw new Error({ name: 'Terrain Exception', message: 'minY is larger than maxY' });
	}
	if (properties.minZ > properties.maxZ) {
		throw new Error({ name: 'Terrain Exception', message: 'minZ is larger than maxZ' });
	}
	if (!heightMatrix) {
		throw new Error({ name: 'Terrain Exception', message: 'No heightmap data specified' });
	}
	if (heightMatrix.length !== heightMatrix[0].length) {
		throw new Error({ name: 'Terrain Exception', message: 'Heightmap data is not a square' });
	}

	return true;
}

function registerHeightData(heightMatrix, dimensions, heightMapData) {
	dimensions = dimensions || _defaults;
	validateTerrainProperties(dimensions, heightMatrix, heightMapData);
	var scriptContainer = {
		dimensions: dimensions,
		sideQuadCount: heightMatrix.length - 1,
		script: new HeightMapBoundingScript(heightMatrix)
	};
	return scriptContainer;
}

/**
 * Creates and exposes a square heightmap terrain fitted within given world dimensions.
 * This does not do any visualizing of the heightMap. That needs to be done elsewhere.
 */
function WorldFittedTerrainScript() {
	this.heightMapData = [];
	this.yMargin = 1;
}

/**
 * Adds a block of height data from an image at given dimensions and stores the script in an array.
 * @param {Array} [heightMatrix] file to load height data from
 * @param {Object} [dimensions] dimensions to fit the data within
 */
WorldFittedTerrainScript.prototype.addHeightData = function (heightMatrix, dimensions) {
	var scriptContainer = registerHeightData(heightMatrix, dimensions, this.heightMapData);
	this.heightMapData.push(scriptContainer);
	return scriptContainer;
};

/**
 * Returns the script relevant to a given position
 * @param {Vector3} [pos] data, typically use entity transform
 * @returns {Object} container object with script and its world dimensions
 */
WorldFittedTerrainScript.prototype.getHeightDataForPosition = function (pos) {
	for (var i = 0; i < this.heightMapData.length; i++) {
		var dim = this.heightMapData[i].dimensions;
		if (pos.x <= dim.maxX && pos.x >= dim.minX) {
			if (pos.y < dim.maxY + this.yMargin && pos.y > dim.minY - this.yMargin) {
				if (pos.z <= dim.maxZ && pos.z >= dim.minZ) {
					return this.heightMapData[i];
				}
			}
		}
	}
	return null;
};

/**
 * Adjusts coordinates to from heightMap to fit the dimensions of raw displacement data.
 * @param {Number} axPos
 * @param {Number} axMin
 * @param {Number} axMax
 * @param {Number} quadCount
 * @returns {Number}
 */
WorldFittedTerrainScript.prototype.displaceAxisDimensions = function (axPos, axMin, axMax, quadCount) {
	var matrixPos = axPos - axMin;
	return quadCount * matrixPos / (axMax - axMin);
};

/**
 * Returns coordinates from raw displacement space to fit the dimensions of a registered heightMap.
 * @param {Number} axPos
 * @param {Number} axMin
 * @param {Number} axMax
 * @param {Number} quadCount
 * @returns {Number}
 */
WorldFittedTerrainScript.prototype.returnToWorldDimensions = function (axPos, axMin, axMax, quadCount) {
	var quadSize = (axMax - axMin) / quadCount;
	var insidePos = axPos * quadSize;
	return axMin + insidePos;
};

/**
 * Looks through height data and returns the elevation of the ground at a given position
 * @param {Vector3} pos Position
 * @returns {Number} height in units
 */
WorldFittedTerrainScript.prototype.getTerrainHeightAt = function (pos) {
	var heightData = this.getHeightDataForPosition(pos);
	if (heightData === null) {
		return null;
	}
	var dims = heightData.dimensions;

	var tx = this.displaceAxisDimensions(pos.x, dims.minX, dims.maxX, heightData.sideQuadCount);
	var tz = this.displaceAxisDimensions(pos.z, dims.minZ, dims.maxZ, heightData.sideQuadCount);
	var matrixHeight = heightData.script.getPreciseHeight(tx, tz);
	return matrixHeight * (dims.maxY - dims.minY) + dims.minY;
};

/**
 * Returns the a normalized terrain normal for the provided position
 * @param {Vector3} [pos] the position
 * @returns {Vector3} the normal vector
 */
WorldFittedTerrainScript.prototype.getTerrainNormalAt = function (pos) {
	var heightData = this.getHeightDataForPosition(pos);
	if (!heightData) {
		return null;
	}
	var dims = heightData.dimensions;

	var x = this.displaceAxisDimensions(pos.x, dims.minX, dims.maxX, heightData.sideQuadCount);
	var y = this.displaceAxisDimensions(pos.z, dims.minZ, dims.maxZ, heightData.sideQuadCount);
	var tri = heightData.script.getTriangleAt(x, y);

	for (var i = 0; i < tri.length; i++) {
		tri[i].x = this.returnToWorldDimensions(tri[i].x, dims.minX, dims.maxX, heightData.sideQuadCount);
		tri[i].z = this.returnToWorldDimensions(tri[i].z, dims.minY, dims.maxY, 1);
		tri[i].y = this.returnToWorldDimensions(tri[i].y, dims.minZ, dims.maxZ, heightData.sideQuadCount);
	}

	calcVec1.setDirect((tri[1].x - tri[0].x), (tri[1].z - tri[0].z), (tri[1].y - tri[0].y));
	calcVec2.setDirect((tri[2].x - tri[0].x), (tri[2].z - tri[0].z), (tri[2].y - tri[0].y));
	calcVec1.cross(calcVec2);
	if (calcVec1.y < 0) {
		calcVec1.scale(-1);
	}

	calcVec1.normalize();
	return calcVec1;
};

module.exports = WorldFittedTerrainScript;