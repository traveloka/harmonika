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
        "src": ["**/*.js", "!tpl/*.js"],
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
      'src/**/*.js', '!src/**/spec.js'
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
    },
    testTokenizer: {
      options: {
        reporter: 'spec'
      },
      src: ['test/util/*.js']
    }
  },
  browserify: {
    dist: {
      files: {
        'live-demo/js/bundle.js': ['live-demo/js/main.js']
      }
    }
  }
});

grunt.registerTask('default', ['clean', 'babel']);
grunt.registerTask('test', ['jshint', 'default', 'mochaTest:test']);
grunt.registerTask('testTokenizer', ['mochaTest:testTokenizer']);
grunt.registerTask('build-demo', ['test', 'browserify']);