'use strict';
const fs = require('fs');
const path = require('path');

// Import the require hook. Enables us to require TS files natively.
require('ts-node/register');

const Angular2App = require('angular-cli/lib/broccoli/angular2-app');
const Funnel = require('broccoli-funnel');
const MergeTree = require('broccoli-merge-trees');
const autoPrefixerTree = require('broccoli-autoprefixer');
const BroccoliPlugin = require('broccoli-plugin');


class NgcBroccoli extends BroccoliPlugin {
  constructor(subTree, options) {
    super([subTree], {});
    this._options = options;
  }

  build() {
    require('reflect-metadata');
    const tsc = require('@angular/tsc-wrapped');
    const CodeGenerator = require('@angular/compiler-cli').CodeGenerator;

    function codegen(ngOptions, program, host) {
      return CodeGenerator.create(ngOptions, program, host).codegen();
    }

    return tsc.main('./src/demo-app', path.relative(process.cwd(), this.inputPaths[0], './src/demo-app'), codegen)
      .then(function (code) {
        console.log(123, code);
      })
      .catch(function (e) {
        console.error(e.stack);
        console.error('Compilation failed');
        process.exit(1);
      });
  }
}


module.exports = function(defaults) {
  // The Angular Application tree.
  const appTree = _buildAppTree(defaults);

  // The CSS tree that is auto prefixed with browser support.
  const cssAutoprefixed = autoPrefixerTree(new Funnel(appTree, {
    include: [ '**/*.css' ]
  }));

  // Include the scss sources in the output for when we publish.
  const scssSources = new Funnel('src', {include: ['**/*.scss']});

  let trees = new MergeTree([appTree, cssAutoprefixed, scssSources], { overwrite: true });

  if (process.env['MD_NGC']) {
    trees = new MergeTree([
      trees,
      new Funnel('src', {include: ['demo-app/**/*'], destDir: 'src'}),
    ]);

    trees = new NgcBroccoli(trees, {
      project: 'src/demo-app'
    });
  }

  return trees;
};


/**
 * Build the Broccoli Tree containing all the files used as the input to the Demo Angular2App.
 */
function _buildDemoAppInputTree() {
  return new MergeTree([
    new Funnel('typings', {
      destDir: 'typings'
    }),
    new Funnel('src', {
      include: ['components/**/*', 'core/**/*'],
      destDir: 'src/demo-app'
    }),
    new Funnel('src/demo-app', {
      destDir: 'src/demo-app'
    })
  ]);
}


/**
 * Build the Broccoli Tree containing all the files used as the input to the e2e Angular2App.
 */
function _buildE2EAppInputTree() {
  return new MergeTree([
    new Funnel('typings', {
      destDir: 'typings'
    }),
    new Funnel('src', {
      include: ['components/**/*', 'core/**/*'],
      destDir: 'src/e2e-app'
    }),
    new Funnel('src/e2e-app', {
      destDir: 'src/e2e-app'
    })
  ]);
}


/**
 * Build the Broccoli Tree that contains the Angular2 App. This picks between E2E, Example or Demo
 * app.
 * @param defaults The default objects from AngularCLI (deprecated).
 * @returns {Angular2App}
 */
function _buildAppTree(defaults) {
  let inputNode;
  let sourceDir;
  switch(process.env['MD_APP']) {
    case 'e2e':
      inputNode = _buildE2EAppInputTree();
      sourceDir = 'src/e2e-app';
      break;

    case 'ngc':
    default:
      inputNode = _buildDemoAppInputTree();
      sourceDir = 'src/demo-app';
  }

  return new Angular2App(defaults, inputNode, {
    sourceDir: sourceDir,
    polyfills: [
      'vendor/core-js/client/core.js',
      'vendor/systemjs/dist/system.src.js',
      'vendor/zone.js/dist/zone.js',
      'vendor/hammerjs/hammer.min.js'
    ],
    tsCompiler: {},
    sassCompiler: {
      includePaths: [
        'src/core/style'
      ]
    },
    vendorNpmFiles: [
      'systemjs/dist/system-polyfills.js',
      'systemjs/dist/system.src.js',
      'zone.js/dist/*.+(js|js.map)',
      'core-js/client/core.js',
      'rxjs/**/*.+(js|js.map)',
      '@angular/**/*.+(js|js.map)',
      'hammerjs/*.min.+(js|js.map)'
    ]
  });
}
