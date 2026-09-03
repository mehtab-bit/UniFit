/**
 * Local TensorCamera wrapper for Expo SDK 52.
 *
 * This is a small, adapted version of the cameraWithTensors HOC from
 * @tensorflow/tfjs-react-native (Apache-2.0). The published wrapper was built
 * for the legacy expo-camera API (`type` + Camera.Constants), which no longer
 * exists in expo-camera 16 / Expo SDK 52. This version renders CameraView and
 * reads its `facing` prop so the GL preview can render without throwing.
 *
 * Source of the original implementation:
 *   node_modules/@tensorflow/tfjs-react-native/dist/camera/camera_stream.js
 * Expo SDK 52 camera docs:
 *   https://docs.expo.dev/versions/v52.0.0/sdk/camera/#cameraview
 */
import * as React from 'react';
import { LayoutChangeEvent, PixelRatio, Platform, StyleSheet } from 'react-native';
import { CameraView, CameraViewProps } from 'expo-camera';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import {
  detectGLCapabilities,
  fromTexture,
  renderToGLView
} from '@tensorflow/tfjs-react-native/dist/camera/camera';
import { Rotation } from '@tensorflow/tfjs-react-native/dist/camera/types';
import { Tensor3D } from '@tensorflow/tfjs';

type CameraLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TensorCameraProps = CameraViewProps & {
  autorender?: boolean;
  useCustomShadersToResize?: boolean;
  cameraTextureWidth?: number;
  cameraTextureHeight?: number;
  resizeWidth?: number;
  resizeHeight?: number;
  resizeDepth?: number;
  rotation?: Rotation;
  onReady: (
    images: IterableIterator<Tensor3D>,
    updateCameraPreview: () => void,
    gl: ExpoWebGLRenderingContext,
    cameraTexture: WebGLTexture
  ) => void;
  onError?: (error: Error) => void;
};

/**
 * Decides whether the camera preview is drawn mirrored. The TensorFlow wrapper
 * has always flipped the GL texture on Android and on iOS back camera; iOS
 * front camera relies on the platform's own mirrored texture.
 */
export function shouldMirrorPreview(isFrontCamera: boolean) {
  if (Platform.OS === 'ios') {
    return !isFrontCamera;
  }

  return true;
}

type TensorCameraState = {
  cameraLayout: CameraLayout | null;
};

export class TensorCamera extends React.Component<TensorCameraProps, TensorCameraState> {
  private cameraRef: CameraView | null = null;
  private glViewRef: GLView | null = null;
  private glContext: ExpoWebGLRenderingContext | null = null;
  private rafId: number = 0;

  state: TensorCameraState = {
    cameraLayout: null
  };

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);

    if (this.glContext) {
      GLView.destroyContextAsync(this.glContext);
    }

    this.cameraRef = null;
    this.glViewRef = null;
    this.glContext = null;
  }

  private onCameraLayout = (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    this.setState({ cameraLayout: { x, y, width, height } });
  };

  private async createCameraTexture() {
    if (!this.glViewRef || !this.cameraRef) {
      throw new Error('Camera or GL context is not ready.');
    }

    return this.glViewRef.createCameraTextureAsync(this.cameraRef);
  }

  private previewUpdateFunc(gl: ExpoWebGLRenderingContext, cameraTexture: WebGLTexture) {
    const { cameraLayout } = this.state;

    if (!cameraLayout) {
      return () => undefined;
    }

    const width = PixelRatio.getPixelSizeForLayoutSize(cameraLayout.width);
    const height = PixelRatio.getPixelSizeForLayoutSize(cameraLayout.height);
    const isFrontCamera = this.cameraRef?.props.facing === 'front';
    const flipHorizontal = shouldMirrorPreview(isFrontCamera);
    const rotation = this.props.rotation ?? 0;

    return () => {
      renderToGLView(gl, cameraTexture, { width, height }, flipHorizontal, rotation);
    };
  }

  private onGLContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    try {
      this.glContext = gl;
      const cameraTexture = await this.createCameraTexture();
      await detectGLCapabilities(gl);

      const updateCameraPreview = this.previewUpdateFunc(gl, cameraTexture);
      const autorender = this.props.autorender ?? true;

      if (autorender) {
        const renderLoop = () => {
          try {
            updateCameraPreview();
            gl.endFrameEXP();
          } catch {
            // A dropped GL frame (common when switching cameras/exercises)
            // must not kill the loop — skip and retry next frame.
          }
          this.rafId = requestAnimationFrame(renderLoop);
        };

        renderLoop();
      }

      const {
        cameraTextureWidth,
        cameraTextureHeight,
        resizeWidth,
        resizeHeight,
        resizeDepth,
        useCustomShadersToResize,
        rotation
      } = this.props;

      const glHolder = { context: this.glContext };

      const generator = (function* buildGenerator() {
        const sourceDims = {
          width: cameraTextureWidth ?? 0,
          height: cameraTextureHeight ?? 0,
          depth: 4
        };
        const targetDims = {
          width: resizeWidth ?? 192,
          height: resizeHeight ?? 192,
          depth: resizeDepth ?? 3
        };

        while (glHolder.context != null) {
          yield fromTexture(
            gl,
            cameraTexture,
            sourceDims,
            targetDims,
            useCustomShadersToResize ?? false,
            { rotation: rotation ?? 0 }
          );
        }
      })();

      this.props.onReady(generator, updateCameraPreview, gl, cameraTexture);
    } catch (error) {
      this.props.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  render() {
    const {
      autorender: _autorender,
      useCustomShadersToResize: _useCustomShadersToResize,
      cameraTextureWidth: _cameraTextureWidth,
      cameraTextureHeight: _cameraTextureHeight,
      resizeWidth: _resizeWidth,
      resizeHeight: _resizeHeight,
      resizeDepth: _resizeDepth,
      rotation: _rotation,
      onReady: _onReady,
      onError: _onError,
      style,
      ...cameraProps
    } = this.props;

    const { cameraLayout } = this.state;
    const flattenedStyle = StyleSheet.flatten(style);
    const zIndex =
      typeof flattenedStyle?.zIndex === 'number' ? flattenedStyle.zIndex + 10 : 10;

    const glView =
      cameraLayout == null ? null : (
        <GLView
          key="tensor-camera-gl-view"
          style={{
            position: 'absolute',
            left: cameraLayout.x,
            top: cameraLayout.y,
            width: cameraLayout.width,
            height: cameraLayout.height,
            zIndex
          }}
          onContextCreate={this.onGLContextCreate}
          ref={(ref) => {
            this.glViewRef = ref;
          }}
        />
      );

    return [
      <CameraView
        key="tensor-camera-view"
        {...cameraProps}
        style={style}
        onLayout={this.onCameraLayout}
        ref={(ref) => {
          this.cameraRef = ref;
        }}
      />,
      glView
    ];
  }
}
