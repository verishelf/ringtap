// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Explicitly resolve @/ path alias (tsconfig paths can fail in some setups)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const relPath = moduleName.replace(/^@\//, '');
    const absPath = path.resolve(__dirname, relPath);
    // If file exists (exact path or with extension), return it
    if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
      return { filePath: absPath, type: 'sourceFile' };
    }
    const exts = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    for (const ext of exts) {
      const candidate = absPath + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return { filePath: candidate, type: 'sourceFile' };
      }
    }
    // Fallback: let default resolver try with absolute path
    return context.resolveRequest(context, absPath, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
