import {
  B3dmLoader,
  Cartesian3,
  GltfLoader,
  MetadataClass,
  Resource,
  ResourceCache,
} from "../../../Source/Cesium.js";
import Cesium3DTilesTester from "../../Cesium3DTilesTester.js";
import createScene from "../../createScene.js";
import waitForLoaderProcess from "../../waitForLoaderProcess.js";
describe("Scene/ModelExperimental/B3dmLoader", function () {
  var withBatchTableUrl =
    "./Data/Cesium3DTiles/Batched/BatchedWithBatchTable/batchedWithBatchTable.b3dm";
  var withBatchTableBinaryUrl =
    "./Data/Cesium3DTiles/Batched/BatchedWithBatchTableBinary/batchedWithBatchTableBinary.b3dm";
  var withoutBatchTableUrl =
    "./Data/Cesium3DTiles/Batched/BatchedWithoutBatchTable/batchedWithoutBatchTable.b3dm";
  var withRtcCenterUrl =
    "./Data/Cesium3DTiles/Batched/BatchedWithRtcCenter/batchedWithRtcCenter.b3dm";
  var withBatchTableHierarchy =
    "./Data/Cesium3DTiles/Hierarchy/BatchTableHierarchy/tile.b3dm";
  var deprecated1Url =
    "./Data/Cesium3DTiles/Batched/BatchedDeprecated1/batchedDeprecated1.b3dm";
  var deprecated2Url =
    "./Data/Cesium3DTiles/Batched/BatchedDeprecated2/batchedDeprecated2.b3dm";

  var scene;
  var b3dmLoaders = [];

  beforeAll(function () {
    scene = createScene();
    // Keep the error from logging to the console when running tests
    spyOn(B3dmLoader, "_deprecationWarning");
  });

  afterAll(function () {
    scene.destroyForSpecs();
  });

  afterEach(function () {
    for (var i = 0; i < b3dmLoaders.length; i++) {
      var loader = b3dmLoaders[i];
      if (!loader.isDestroyed()) {
        loader.destroy();
      }
    }
    b3dmLoaders.length = 0;
    ResourceCache.clearForSpecs();
  });

  // function loadB3dmFromArrayBuffer(arrayBuffer) {
  //   var loader = new B3dmLoader({
  //     b3dmResource: Resource.createIfNeeded(""),
  //     arrayBuffer: arrayBuffer
  //   });
  //   b3dmLoaders.push(loader);
  //   loader.load();

  //   return waitForLoaderProcess(loader, scene);
  // }

  function loadB3dm(b3dmPath) {
    var resource = Resource.createIfNeeded(b3dmPath);

    return Resource.fetchArrayBuffer({
      url: b3dmPath,
    }).then(function (arrayBuffer) {
      var loader = new B3dmLoader({
        b3dmResource: resource,
        arrayBuffer: arrayBuffer,
      });
      b3dmLoaders.push(loader);
      loader.load();

      return waitForLoaderProcess(loader, scene);
    });
  }

  it("loads BatchedWithBatchTable", function () {
    return loadB3dm(withBatchTableUrl).then(function (loader) {
      var components = loader.components;
      var featureMetadata = components.featureMetadata;
      var featureTable = featureMetadata.getFeatureTable(
        MetadataClass.BATCH_TABLE_CLASS_NAME
      );
      expect(featureTable).toBeDefined();
      expect(featureTable.count).toEqual(10);
      expect(featureTable.class).toBeDefined();
    });
  });

  it("loads BatchedWithBatchTableBinary", function () {
    return loadB3dm(withBatchTableBinaryUrl).then(function (loader) {
      var components = loader.components;
      var featureMetadata = components.featureMetadata;
      var featureTable = featureMetadata.getFeatureTable(
        MetadataClass.BATCH_TABLE_CLASS_NAME
      );
      expect(featureTable).toBeDefined();
      expect(featureTable.count).toEqual(10);
      expect(featureTable.class).toBeDefined();
    });
  });

  it("loads BatchedWithoutBatchTableUrl", function () {
    return loadB3dm(withoutBatchTableUrl).then(function (loader) {
      var components = loader.components;
      var featureMetadata = components.featureMetadata;
      var featureTable = featureMetadata.getFeatureTable(
        MetadataClass.BATCH_TABLE_CLASS_NAME
      );
      expect(featureTable).toBeDefined();
      expect(featureTable.count).toEqual(10);
      expect(featureTable.class).toBeUndefined();
    });
  });

  it("loads BatchedWithRtcCenterUrl", function () {
    return loadB3dm(withRtcCenterUrl).then(function (loader) {
      var components = loader.components;
      var featureMetadata = components.featureMetadata;
      var featureTable = featureMetadata.getFeatureTable(
        MetadataClass.BATCH_TABLE_CLASS_NAME
      );
      expect(featureTable).toBeDefined();
      expect(featureTable.count).toEqual(10);
      var rootNodeMatrix = components.scene.nodes[0].matrix;
      var translation = new Cartesian3(
        rootNodeMatrix[12],
        rootNodeMatrix[13],
        rootNodeMatrix[14]
      );
      expect(translation).toEqual(new Cartesian3(0.1, 0.3, -0.2));
    });
  });

  it("loads BatchTableHierarchy", function () {
    return loadB3dm(withBatchTableHierarchy).then(function (loader) {
      var components = loader.components;
      var featureMetadata = components.featureMetadata;
      var featureTable = featureMetadata.getFeatureTable(
        MetadataClass.BATCH_TABLE_CLASS_NAME
      );
      expect(featureTable).toBeDefined();
      expect(featureTable.count).toEqual(30);
      expect(featureTable._batchTableHierarchy).toBeDefined();
    });
  });

  it("throws with invalid version", function () {
    var arrayBuffer = Cesium3DTilesTester.generateBatchedTileBuffer({
      version: 2,
    });
    Cesium3DTilesTester.loadTileExpectError(scene, arrayBuffer, "b3dm");
  });

  it("recognizes the legacy 20-byte header", function () {
    return loadB3dm(deprecated1Url).then(function (loader) {
      expect(B3dmLoader._deprecationWarning).toHaveBeenCalled();

      var components = loader.components;
      var featureMetadata = components.featureMetadata;
      var featureTable = featureMetadata.getFeatureTable(
        MetadataClass.BATCH_TABLE_CLASS_NAME
      );
      expect(featureTable).toBeDefined();
      expect(featureTable.count).toEqual(10);
    });
  });

  it("recognizes the legacy 24-byte header", function () {
    return loadB3dm(deprecated2Url).then(function (loader) {
      expect(B3dmLoader._deprecationWarning).toHaveBeenCalled();

      var components = loader.components;
      var featureMetadata = components.featureMetadata;
      var featureTable = featureMetadata.getFeatureTable(
        MetadataClass.BATCH_TABLE_CLASS_NAME
      );
      expect(featureTable).toBeDefined();
      expect(featureTable.count).toEqual(10);
    });
  });

  it("throws with empty gltf", function () {
    // Expect to throw DeveloperError in Model due to invalid gltf magic
    var arrayBuffer = Cesium3DTilesTester.generateBatchedTileBuffer();
    Cesium3DTilesTester.loadTileExpectError(scene, arrayBuffer, "b3dm");
  });

  it("destroys B3DM loader", function () {
    var unloadGltfLoader = spyOn(
      GltfLoader.prototype,
      "unload"
    ).and.callThrough();

    return loadB3dm(withBatchTableUrl).then(function (loader) {
      expect(loader.components).toBeDefined();
      expect(loader.isDestroyed()).toBe(false);

      loader.destroy();

      expect(loader.components).toBeUndefined();
      expect(loader.isDestroyed()).toBe(true);

      expect(unloadGltfLoader.calls.count()).toBe(1);
    });
  });
});
