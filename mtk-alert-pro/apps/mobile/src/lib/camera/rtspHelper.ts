/**
 * RTSP URL Helper - Smart URL generation based on camera brand
 * Supports common camera brands with their default RTSP URL patterns
 */

export interface CameraBrand {
  id: string;
  name: string;
  // Default ports
  rtspPort: number;
  httpPort: number;
  // URL pattern templates - {ip}, {port}, {user}, {pass}, {channel}
  mainStream: string;
  subStream: string;
  // Common default credentials
  defaultUser: string;
  defaultPass: string;
}

export const CAMERA_BRANDS: CameraBrand[] = [
  {
    id: 'hikvision',
    name: 'Hikvision',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/Streaming/Channels/101',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/Streaming/Channels/102',
    defaultUser: 'admin',
    defaultPass: '',
  },
  {
    id: 'dahua',
    name: 'Dahua',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/cam/realmonitor?channel=1&subtype=0',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/cam/realmonitor?channel=1&subtype=1',
    defaultUser: 'admin',
    defaultPass: '',
  },
  {
    id: 'reolink',
    name: 'Reolink',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/h264Preview_01_main',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/h264Preview_01_sub',
    defaultUser: 'admin',
    defaultPass: '',
  },
  {
    id: 'axis',
    name: 'Axis',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/axis-media/media.amp',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/axis-media/media.amp?videocodec=h264&resolution=640x480',
    defaultUser: 'root',
    defaultPass: '',
  },
  {
    id: 'uniview',
    name: 'Uniview',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/media/video1',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/media/video2',
    defaultUser: 'admin',
    defaultPass: '123456',
  },
  {
    id: 'hanwha',
    name: 'Hanwha (Samsung)',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/profile1/media.smp',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/profile2/media.smp',
    defaultUser: 'admin',
    defaultPass: '',
  },
  {
    id: 'vivotek',
    name: 'Vivotek',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/live.sdp',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/live2.sdp',
    defaultUser: 'root',
    defaultPass: '',
  },
  {
    id: 'amcrest',
    name: 'Amcrest',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/cam/realmonitor?channel=1&subtype=0',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/cam/realmonitor?channel=1&subtype=1',
    defaultUser: 'admin',
    defaultPass: '',
  },
  {
    id: 'foscam',
    name: 'Foscam',
    rtspPort: 88,
    httpPort: 88,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/videoMain',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/videoSub',
    defaultUser: 'admin',
    defaultPass: '',
  },
  {
    id: 'generic',
    name: 'Generic ONVIF',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{user}:{pass}@{ip}:{port}/stream1',
    subStream: 'rtsp://{user}:{pass}@{ip}:{port}/stream2',
    defaultUser: 'admin',
    defaultPass: 'admin',
  },
  {
    id: 'custom',
    name: 'Custom URL',
    rtspPort: 554,
    httpPort: 80,
    mainStream: 'rtsp://{ip}:{port}/stream',
    subStream: 'rtsp://{ip}:{port}/stream',
    defaultUser: '',
    defaultPass: '',
  },
];

/**
 * Generate RTSP URL from template
 */
export function generateRtspUrl(
  brandId: string,
  ip: string,
  options: {
    port?: number;
    username?: string;
    password?: string;
    channel?: number;
    useSubStream?: boolean;
  } = {}
): string {
  const brand = CAMERA_BRANDS.find((b) => b.id === brandId);
  if (!brand) return '';

  const {
    port = brand.rtspPort,
    username = brand.defaultUser,
    password = brand.defaultPass,
    channel = 1,
    useSubStream = false,
  } = options;

  const template = useSubStream ? brand.subStream : brand.mainStream;

  // Build URL with or without credentials
  let url = template
    .replace('{ip}', ip)
    .replace('{port}', String(port))
    .replace('{channel}', String(channel));

  // Handle credentials
  if (username && password) {
    url = url.replace('{user}', encodeURIComponent(username));
    url = url.replace('{pass}', encodeURIComponent(password));
  } else if (username) {
    url = url.replace('{user}:{pass}@', `${encodeURIComponent(username)}@`);
  } else {
    url = url.replace('{user}:{pass}@', '');
  }

  return url;
}

/**
 * Parse RTSP URL to extract components
 */
export function parseRtspUrl(url: string): {
  ip: string;
  port: number;
  username?: string;
  password?: string;
  path: string;
} | null {
  try {
    // Handle rtsp:// URLs
    const rtspRegex = /^rtsp:\/\/(?:([^:]+):([^@]+)@)?([^:/]+)(?::(\d+))?(.*)$/;
    const match = url.match(rtspRegex);

    if (!match) return null;

    return {
      username: match[1] ? decodeURIComponent(match[1]) : undefined,
      password: match[2] ? decodeURIComponent(match[2]) : undefined,
      ip: match[3],
      port: match[4] ? parseInt(match[4], 10) : 554,
      path: match[5] || '/',
    };
  } catch {
    return null;
  }
}

/**
 * Validate IP address format
 */
export function isValidIpAddress(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;

  const parts = ip.split('.').map(Number);
  return parts.every((part) => part >= 0 && part <= 255);
}

/**
 * Parse QR code data to extract camera info
 * Supports various QR formats from different camera manufacturers
 */
export function parseQrCodeData(data: string): {
  rtspUrl?: string;
  ip?: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
} | null {
  try {
    // Try parsing as JSON (common format)
    if (data.startsWith('{')) {
      const json = JSON.parse(data);
      return {
        rtspUrl: json.rtspUrl || json.rtsp_url || json.url,
        ip: json.ip || json.ipAddress || json.ip_address,
        serialNumber: json.sn || json.serialNumber || json.serial,
        brand: json.brand || json.manufacturer,
        model: json.model,
      };
    }

    // Check if it's a direct RTSP URL
    if (data.toLowerCase().startsWith('rtsp://')) {
      const parsed = parseRtspUrl(data);
      return {
        rtspUrl: data,
        ip: parsed?.ip,
      };
    }

    // Check for Hikvision format: SN:xxx;IP:xxx
    if (data.includes(';')) {
      const parts = data.split(';');
      const result: Record<string, string> = {};
      
      parts.forEach((part) => {
        const [key, value] = part.split(':');
        if (key && value) {
          result[key.toLowerCase().trim()] = value.trim();
        }
      });

      return {
        ip: result.ip || result.ipaddress,
        serialNumber: result.sn || result.serial,
        brand: result.brand,
        model: result.model,
      };
    }

    // Check if it's just an IP address
    if (isValidIpAddress(data)) {
      return { ip: data };
    }

    // Check for URL encoded data
    if (data.includes('=')) {
      const params = new URLSearchParams(data);
      return {
        ip: params.get('ip') || params.get('IP') || undefined,
        rtspUrl: params.get('rtsp') || params.get('url') || undefined,
        serialNumber: params.get('sn') || params.get('serial') || undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get suggested brand based on IP or serial number patterns
 */
export function detectCameraBrand(ip: string, serialNumber?: string): string | null {
  // Hikvision serial numbers often start with DS-
  if (serialNumber?.toUpperCase().startsWith('DS-')) return 'hikvision';
  
  // Dahua serial numbers pattern
  if (serialNumber?.toUpperCase().match(/^[A-Z]{3}[A-Z0-9]+/)) return 'dahua';
  
  // Reolink patterns
  if (serialNumber?.toUpperCase().startsWith('RLC-')) return 'reolink';
  
  return null;
}
