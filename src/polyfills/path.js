// Polyfill for path module in browsers
export default {
  join: (...args) => {
    const parts = args.filter(part => part && typeof part === 'string');
    if (parts.length === 0) return '.';
    
    let joined = parts.join('/');
    
    // Normalize slashes
    joined = joined.replace(/\/+/g, '/');
    
    // Remove trailing slash except for root
    if (joined.length > 1 && joined.endsWith('/')) {
      joined = joined.slice(0, -1);
    }
    
    return joined;
  },
  
  resolve: (...args) => {
    const parts = args.filter(part => part && typeof part === 'string');
    return parts.join('/').replace(/\/+/g, '/');
  },
  
  dirname: (filePath) => {
    const parts = filePath.split('/');
    if (parts.length <= 1) return '.';
    return parts.slice(0, -1).join('/') || '/';
  },
  
  basename: (filePath, ext) => {
    const name = filePath.split('/').pop() || '';
    if (ext && name.endsWith(ext)) {
      return name.slice(0, -ext.length);
    }
    return name;
  },
  
  extname: (filePath) => {
    const name = filePath.split('/').pop() || '';
    const dotIndex = name.lastIndexOf('.');
    return dotIndex > 0 ? name.slice(dotIndex) : '';
  },
  
  normalize: (filePath) => {
    return filePath.replace(/\/+/g, '/');
  },
  
  sep: '/',
  delimiter: ':',
  posix: {
    join: (...args) => args.filter(Boolean).join('/').replace(/\/+/g, '/'),
    resolve: (...args) => args.filter(Boolean).join('/').replace(/\/+/g, '/'),
    dirname: (p) => p.split('/').slice(0, -1).join('/') || '/',
    basename: (p, ext) => {
      const name = p.split('/').pop() || '';
      return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
    },
    extname: (p) => {
      const name = p.split('/').pop() || '';
      const dotIndex = name.lastIndexOf('.');
      return dotIndex > 0 ? name.slice(dotIndex) : '';
    },
    normalize: (p) => p.replace(/\/+/g, '/'),
    sep: '/',
    delimiter: ':'
  }
};
