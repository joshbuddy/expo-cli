import { isLandscape, isPortrait, isValid } from './Orientation';
import { Icon, Orientation, StartupImage } from '../WebpackPWAManifestPlugin.types';

interface Device {
  names: string[];
  width: number;
  height: number;
  scale: number;
  isTablet: boolean;
}

const Devices: Device[] = [
  { names: ['iPhone SE'], width: 640, height: 1136, scale: 2, isTablet: false },
  { names: ['iPhone Xs Max'], width: 1242, height: 2688, scale: 3, isTablet: false },
  { names: ['iPhone Xr'], width: 828, height: 1792, scale: 2, isTablet: false },
  { names: ['iPhone X', 'iPhone Xs'], width: 1125, height: 2436, scale: 3, isTablet: false },
  {
    names: ['iPhone 8 Plus', 'iPhone 7 Plus', 'iPhone 6s Plus', 'iPhone 6 Plus'],
    width: 1242,
    height: 2208,
    scale: 3,
    isTablet: false,
  },
  {
    names: ['iPhone 8', 'iPhone 7', 'iPhone 6s', 'iPhone 6'],
    width: 750,
    height: 1334,
    scale: 2,
    isTablet: false,
  },
  { names: ['iPad Pro 12.9"'], width: 2048, height: 2732, scale: 2, isTablet: true },
  { names: ['iPad Pro 11"'], width: 1668, height: 2388, scale: 2, isTablet: true },
  { names: ['iPad Pro 10.5"'], width: 1668, height: 2224, scale: 2, isTablet: true },
  { names: ['iPad Mini', 'iPad Air'], width: 1536, height: 2048, scale: 2, isTablet: true },
];

function assembleOrientationMedia(
  width: number,
  height: number,
  scale: number,
  orientation: string
): string {
  const params = {
    'device-width': `${Math.floor(width / scale)}px`,
    'device-height': `${Math.floor(height / scale)}px`,
    '-webkit-device-pixel-ratio': scale,
    orientation,
  };

  // @ts-ignore
  const query = ['screen', ...Object.keys(params).map(key => `(${key}: ${params[key]})`)];

  return query.join(' and ');
}

function getDevices({
  orientation = 'natural',
  supportsTablet = true,
}: {
  orientation: Orientation;
  supportsTablet: boolean;
}): (Device & { orientations: Orientation[] })[] {
  if (!isValid(orientation)) {
    throw new Error(`${orientation} is not a valid orientation`);
  }

  let orientations: Orientation[] = [];
  if (isLandscape(orientation)) {
    orientations.push('landscape');
  }
  if (isPortrait(orientation)) {
    orientations.push('portrait');
  }

  let devices = [];
  if (supportsTablet) {
    devices = Devices;
  } else {
    devices = Devices.filter(({ isTablet }) => !isTablet);
  }

  return devices.map(device => ({ ...device, orientations }));
}

export function fromStartupImage({ src, resizeMode, destination, color }: Icon): StartupImage[] {
  // You cannot lock iOS PWA orientation, we should produce every splash screen.
  // orientation
  const devices = getDevices({ orientation: 'any', supportsTablet: false });

  const startupImages: StartupImage[] = [];
  for (const device of devices) {
    const { width, height } = device;
    for (const orientation of device.orientations) {
      const size = orientation === 'portrait' ? [width, height] : [height, width];
      startupImages.push({
        ios: 'startup',
        src,
        sizes: [size],
        scale: device.scale,
        media: assembleOrientationMedia(device.width, device.height, device.scale, orientation),
        destination,
        resizeMode,
        color,
      });
    }
  }
  return startupImages;
}
