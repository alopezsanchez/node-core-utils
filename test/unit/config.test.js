'use strict';

const path = require('path');
const assert = require('assert');
const os = require('os');
const fs = require('fs');
const mkdirp = require('mkdirp');

const MockFs = require('../fixtures/fs');
const parsedFileExample = require('../fixtures/fs_config_file');
const parsedLocalConfigExample = require('../fixtures/fs_local_config_file');

const {
  getHomeDir,
  getNcuDir,
  getConfigPath,
  getConfig,
  getMergedConfig,
  writeConfig,
  updateConfig
} = require('../../lib/config');

const newUsername = 'bar';
const newToken = 'asdfghj';

describe('config', () => {
  let xdgConfigHomeValue = process.env.XDG_CONFIG_HOME;
  let mockFs = null;

  // Original fs and mkdirp methods to be mocked
  let originalExistsSync = fs.existsSync;
  let originalReadFileSyc = fs.readFileSync;
  let originalWriteFileSync = fs.writeFileSync;
  let originalSync = mkdirp.sync;

  before(() => {
    mockFs = new MockFs();
    fs.existsSync = mockFs.existsSync;
    fs.readFileSync = mockFs.readFileSync;
    fs.writeFileSync = mockFs.writeFileSync;
    mkdirp.sync = mockFs.sync;

    // Delete env var to isolate test cases
    delete process.env.XDG_CONFIG_HOME;
  });

  after(() => {
    // Restore env var in order to maintain the integrity
    process.env.XDG_CONFIG_HOME = xdgConfigHomeValue;

    // Restore original methods
    fs.existsSync = originalExistsSync;
    fs.readFileSync = originalReadFileSyc;
    fs.writeFileSync = originalWriteFileSync;
    mkdirp.sync = originalSync;
  });

  afterEach(() => {
    mockFs.restoreFs();
  });

  describe('getHomeDir', () => {
    it(
      'should return the argument specified if there a no environment variable',
      () => {
        const homePath = '/home/foo';
        assert.strictEqual(homePath, getHomeDir(homePath));
      });

    it(
      'should return os.homedir() if no argument is specified' +
      'and there is no environment variable',
      () => {
        assert.strictEqual(getHomeDir(), os.homedir());
      });

    describe('environment variable', () => {
      const homeDirValue = '/path/to/home';

      before(() => {
        process.env.XDG_CONFIG_HOME = homeDirValue;
      });

      after(() => {
        delete process.env.XDG_CONFIG_HOME;
      });

      it('should return XDG_CONFIG_HOME env var if exists', () => {
        assert.strictEqual(getHomeDir(), homeDirValue);
        assert.strictEqual(getHomeDir('/home/foo'), homeDirValue);
      });
    });
  });

  describe('getNcuDir', () => {
    it('should return the path to the `.ncu` file', () => {
      assert.strictEqual(
        getNcuDir(path.join('home', 'foo')),
        path.join('home', 'foo', '.ncu')
      );
    });

    it(
      'should return the local `.ncu` file if no argument is specified',
      () => {
        assert.strictEqual(getNcuDir(), path.join(process.cwd(), '.ncu'));
      });
  });

  describe('getConfigPath', () => {
    it('should return `.ncurc` path', () => {
      const isGlobal = true;
      assert.strictEqual(
        getConfigPath(isGlobal),
        path.join(os.homedir(), '.ncurc')
      );
      // os.homedir() because no second argument passed to getConfigPath
      // and process.env.XDG_CONFIG_HOME does not exist.
    });

    it('should return the local `.ncu` path', () => {
      const isGlobal = false;
      assert.strictEqual(
        getConfigPath(isGlobal),
        path.join(process.cwd(), path.join('.ncu', 'config'))
      );
      // process.cwd() because no second argument passed to getConfigPath
    });
  });

  describe('getConfig', () => {
    // For simplicity, we assume only the global config
    it('should return the parsed `.ncurc` config', () => {
      const isGlobal = true;
      const configContent = getConfig(isGlobal);

      assert.strictEqual(configContent.username, parsedFileExample.username);
      assert.strictEqual(configContent.token, parsedFileExample.token);
    });
  });

  describe('getMergedConfig', () => {
    it('should return both local and global config merged', () => {
      const configContent = getMergedConfig();

      assert.strictEqual(
        configContent.username,
        parsedLocalConfigExample.username
      );
      assert.strictEqual(configContent.token, parsedFileExample.token);
    });
  });

  describe('writeConfig', () => {
    // For simplicity, we assume only the global config
    it('should write the global config file correctly', () => {
      const isGlobal = true;
      const newFileContent = {
        username: newUsername,
        token: newToken
      };
      writeConfig(isGlobal, newFileContent);

      const configContent = getConfig(isGlobal);
      assert.strictEqual(configContent.username, newUsername);
      assert.strictEqual(configContent.token, newToken);
    });
  });

  describe('updateConfig', () => {
    // For simplicity, we assume only the global config
    it('should update only the config parameters specified', () => {
      const isGlobal = true;
      // First, check that config has the old values
      const configContent = getConfig(isGlobal);
      assert.strictEqual(configContent.username, parsedFileExample.username);
      assert.strictEqual(configContent.token, parsedFileExample.token);

      updateConfig(isGlobal, {token: newToken});

      const newConfigContent = getConfig(isGlobal);
      assert.strictEqual(newConfigContent.username, parsedFileExample.username);
      assert.strictEqual(newConfigContent.token, newToken);
    });
  });
});
