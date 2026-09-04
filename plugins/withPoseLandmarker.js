/**
 * UniFit pose-only MediaPipe config plugin.
 *
 * Generates a Vision Camera v4 Frame Processor Plugin ("poseLandmarker") that
 * runs only PoseLandmarker — no hand/face inference — and emits both
 * normalized pose landmarks and metric world landmarks per frame.
 *
 * MIT-licensed pattern derived from expo-vision-camera-v4-mediapipe's config
 * plugin (only the pose path is kept and extended with world landmarks).
 */
const fs = require('fs');
const path = require('path');
const {
  withAppBuildGradle,
  withMainApplication,
  withDangerousMod
} = require('expo/config-plugins');

const MODEL_POSE = 'pose_landmarker_lite.task';
const REGISTRATION_NAME = 'poseLandmarker';

function getPoseLandmarkerPluginKotlin(packageName) {
  return `package ${packageName}

import android.graphics.Bitmap
import android.graphics.Matrix
import android.media.Image
import android.util.Log
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

/**
 * Pose-only MediaPipe landmarker for UniFit. VIDEO mode tracks between frames;
 * output includes normalized landmarks + metric world landmarks (metres,
 * hip-centered) plus the upright image dimensions for overlay mapping.
 */
class PoseLandmarkerPlugin(
    proxy: VisionCameraProxy,
    options: Map<String, Any>?
) : FrameProcessorPlugin() {

    companion object {
        private const val TAG = "PoseLandmarkerPlugin"
    }

    private var poseLandmarker: PoseLandmarker? = null
    private var initError: String? = null

    init {
        try {
            Log.d(TAG, "=== INITIALIZING PoseLandmarkerPlugin ===")
            val context = proxy.context
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath("${MODEL_POSE}")
                .build()
            val poseOptions = PoseLandmarker.PoseLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setRunningMode(RunningMode.VIDEO)
                .setNumPoses(1)
                .setMinPoseDetectionConfidence(0.5f)
                .setMinPosePresenceConfidence(0.5f)
                .setMinTrackingConfidence(0.5f)
                .build()
            poseLandmarker = PoseLandmarker.createFromOptions(context, poseOptions)
            Log.d(TAG, "=== PoseLandmarker CREATED ===")
        } catch (e: Exception) {
            initError = e.message
            Log.e(TAG, "=== ERROR INITIALIZING PoseLandmarker ===", e)
        }
    }

    private fun frameToUprightBitmap(frame: Frame): Bitmap {
        val image: Image = frame.image
        val plane = image.planes[0]
        val buffer = plane.buffer
        buffer.rewind()
        val pixelStride = plane.pixelStride
        val rowPadding = plane.rowStride - pixelStride * image.width
        val paddedWidth = image.width + rowPadding / pixelStride
        val raw = Bitmap.createBitmap(paddedWidth, image.height, Bitmap.Config.ARGB_8888)
        raw.copyPixelsFromBuffer(buffer)

        val degrees = when (frame.orientation) {
            Orientation.PORTRAIT -> 0f
            Orientation.LANDSCAPE_LEFT -> 270f
            Orientation.PORTRAIT_UPSIDE_DOWN -> 180f
            Orientation.LANDSCAPE_RIGHT -> 90f
        }
        if (degrees == 0f && rowPadding == 0) return raw

        val matrix = Matrix().apply { postRotate(degrees) }
        val upright = Bitmap.createBitmap(raw, 0, 0, image.width, image.height, matrix, true)
        if (upright !== raw) raw.recycle()
        return upright
    }

    override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
        if (poseLandmarker == null) {
            Log.e(TAG, "PoseLandmarker is null! Error: $initError")
            return hashMapOf<String, Any>(
                "pose" to emptyList<Any>(),
                "error" to (initError ?: "PoseLandmarker not initialized")
            )
        }

        var mpImage: MPImage? = null
        try {
            val upright = frameToUprightBitmap(frame)
            mpImage = BitmapImageBuilder(upright).build()
            val timestampMs = frame.timestamp / 1_000_000
            val result = poseLandmarker!!.detectForVideo(mpImage, timestampMs)
            val output = hashMapOf<String, Any>()
            output["imageWidth"] = upright.width
            output["imageHeight"] = upright.height

            if (result.landmarks().isNotEmpty()) {
                val points = mutableListOf<Map<String, Double>>()
                for (lm in result.landmarks()[0]) {
                    val point = hashMapOf(
                        "x" to lm.x().toDouble(),
                        "y" to lm.y().toDouble(),
                        "z" to lm.z().toDouble()
                    )
                    val vis = lm.visibility().orElse(null) ?: lm.presence().orElse(null)
                    if (vis != null) point["visibility"] = vis.toDouble()
                    points.add(point)
                }
                output["pose"] = points
            }

            if (result.worldLandmarks().isNotEmpty()) {
                val worldPoints = mutableListOf<Map<String, Double>>()
                for (lm in result.worldLandmarks()[0]) {
                    worldPoints.add(hashMapOf(
                        "x" to lm.x().toDouble(),
                        "y" to lm.y().toDouble(),
                        "z" to lm.z().toDouble()
                    ))
                }
                output["worldPose"] = worldPoints
            }

            return output
        } catch (e: Exception) {
            Log.e(TAG, "ERROR in pose detection callback", e)
            return hashMapOf<String, Any>(
                "pose" to emptyList<Any>(),
                "error" to (e.message ?: "Unknown error")
            )
        } finally {
            mpImage?.close()
        }
    }
}
`;
}

function writeFileIfChanged(filePath, contents) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === contents) {
    return false;
  }
  fs.writeFileSync(filePath, contents, 'utf8');
  return true;
}

module.exports = function withPoseLandmarker(config) {
  config = withAppBuildGradle(config, (mod) => {
    const gradle = mod.modResults.contents;
    if (!gradle.includes('com.google.mediapipe:tasks-vision')) {
      mod.modResults.contents = gradle.replace(
        /dependencies\s*\{/,
        `dependencies {\n    // MediaPipe Tasks Vision — PoseLandmarker (UniFit pose-only plugin)\n    implementation("com.google.mediapipe:tasks-vision:0.10.21")\n`
      );
      console.log('[PoseLandmarker] ✅ Added MediaPipe dependency to build.gradle');
    }
    return mod;
  });

  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    if (!contents.includes('FrameProcessorPluginRegistry')) {
      contents = contents.replace(
        /^(package .+)$/m,
        `$1\n\nimport com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry`
      );
    }
    if (!contents.includes(REGISTRATION_NAME)) {
      contents = contents.replace(
        /class MainApplication\s*:\s*Application\(\)\s*,\s*ReactApplication\s*\{/,
        `class MainApplication : Application(), ReactApplication {\n\n    companion object {\n        init {\n            FrameProcessorPluginRegistry.addFrameProcessorPlugin("${REGISTRATION_NAME}") { proxy: com.mrousavy.camera.frameprocessors.VisionCameraProxy, options: Map<String, Any>? ->\n                PoseLandmarkerPlugin(proxy, options)\n            }\n        }\n    }\n`
      );
      console.log('[PoseLandmarker] ✅ Registered PoseLandmarkerPlugin');
    }
    mod.modResults.contents = contents;
    return mod;
  });

  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const packageName = config.android?.package || 'com.unifit.app';
      const packageDir = packageName.replace(/\./g, '/');
      const javaDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        packageDir
      );
      const assetsDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'assets'
      );
      fs.mkdirSync(javaDir, { recursive: true });
      fs.mkdirSync(assetsDir, { recursive: true });

      const kotlinSource = getPoseLandmarkerPluginKotlin(packageName);
      const kotlinPath = path.join(javaDir, 'PoseLandmarkerPlugin.kt');
      if (writeFileIfChanged(kotlinPath, kotlinSource)) {
        console.log('[PoseLandmarker] ✅ Generated PoseLandmarkerPlugin.kt');
      }

      const source = path.join(projectRoot, 'assets', MODEL_POSE);
      const dest = path.join(assetsDir, MODEL_POSE);
      if (!fs.existsSync(dest) && fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
        console.log(`[PoseLandmarker] ✅ Copied ${MODEL_POSE}`);
      }
      return mod;
    }
  ]);

  return config;
};
