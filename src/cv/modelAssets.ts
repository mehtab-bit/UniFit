import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/**
 * Expo-compatible replacement for tfjs-react-native's bundleResourceIO.
 * Expo Go cannot include react-native-fs, so bundled model files are copied
 * with expo-asset and read through expo-file-system instead.
 */
export async function createBundledModelIO(
  modelJson: any,
  weightAssetIds: number[]
): Promise<any> {
  const manifest = modelJson.weightsManifest?.[0];
  if (!manifest) {
    throw new Error('Bundled MoveNet model.json is missing weightsManifest.');
  }

  const weightSpecs = manifest.weights;
  const weightBytes: Uint8Array[] = [];
  let byteCount = 0;
  const weightAssets = weightAssetIds.map((id) => Asset.fromModule(id));


  
 
 for (const asset of weightAssets) {

  let bytes: Uint8Array;

  if (Platform.OS === 'web') {

    const response = await fetch(asset.uri);

    if (!response.ok) {

      throw new Error(

        `Failed to load MoveNet model weight: ${response.status} ${response.statusText}`

      );

    }

    bytes = new Uint8Array(await response.arrayBuffer());

  } else if (asset.uri.startsWith('http')) {

    const response = await fetch(asset.uri);

    if (!response.ok) {

      throw new Error(

        `Failed to load MoveNet model weight: ${response.status} ${response.statusText}`

      );

    }

    bytes = new Uint8Array(await response.arrayBuffer());

  } else {

    const localUri = asset.localUri || asset.uri;

    const base64 = await FileSystem.readAsStringAsync(localUri, {

      encoding: FileSystem.EncodingType.Base64

    });

    bytes = base64ToBytes(base64);

  }

  weightBytes.push(bytes);

  byteCount += bytes.byteLength;

}

const weightData = new Uint8Array(byteCount);

let offset = 0;

for (const bytes of weightBytes) {

  weightData.set(bytes, offset);

  offset += bytes.byteLength;

}

return {

  load: async () => ({

    modelTopology: modelJson.modelTopology,

    weightSpecs,

    weightData,

    format: modelJson.format,

    generatedBy: modelJson.generatedBy,

    convertedAt: modelJson.convertedAt

  })

};

}
