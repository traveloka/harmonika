var grunt = require('grunt');
require('load-grunt-tasks')(grunt);

grunt.initConfig({
  babel: {
    options: {
      modules: 'common'
    },
    dist: {
      files:  [{
        "expand": true,
        "cwd": "src/",
        "src": ["**/*.js"],
        "dest": "lib/",
        "ext": ".js"
      }]
    }
  },
  watch: {
    options: {
      spawn: false
    },
    scripts: {
      files: ['src/**/*.js'],
      tasks: ['default']
    }
  },
  jshint: {
    options: {
      jshintrc: '.jshintrc'
    },
    allFiles: [
      'src/**/*.js'
    ]
  },
  clean: {
    js: ["lib/**/*.js"]
  },
  mochaTest: {
    test: {
      options: {
        reporter: 'spec'
      },
      src: ['test/**/*.js']
    }
  },
  browserify: {
    dist: {
      files: {
        'live-demo/bundle.js': ['live-demo/main.js']
      }
    }
  }
});

grunt.registerTask('default', ['clean', 'babel']);
grunt.registerTask('test', ['jshint', 'default', 'mochaTest']);
grunt.registerTask('build-demo', ['test', 'browserify']);