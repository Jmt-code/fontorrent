// Polyfill for fs module in browsers
export default {
  readFile: () => {
    throw new Error('fs.readFile is not available in browsers');
  },
  
  writeFile: () => {
    throw new Error('fs.writeFile is not available in browsers');
  },
  
  createReadStream: () => {
    throw new Error('fs.createReadStream is not available in browsers');
  },
  
  createWriteStream: () => {
    throw new Error('fs.createWriteStream is not available in browsers');
  },
  
  stat: () => {
    throw new Error('fs.stat is not available in browsers');
  },
  
  access: () => {
    throw new Error('fs.access is not available in browsers');
  },
  
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1
  }
};

export const constants = {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1
};
