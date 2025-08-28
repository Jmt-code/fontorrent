// Polyfill for os module in browsers
export default {
  platform: () => 'browser',
  arch: () => 'x64',
  release: () => navigator.userAgent,
  type: () => 'Browser',
  endianness: () => 'LE',
  hostname: () => location.hostname,
  tmpdir: () => '/tmp',
  homedir: () => '/home',
  freemem: () => 1024 * 1024 * 1024, // 1GB fake
  totalmem: () => 4 * 1024 * 1024 * 1024, // 4GB fake
  cpus: () => [{ model: 'Browser CPU', speed: 2000 }],
  networkInterfaces: () => ({}),
  EOL: '\n'
};
