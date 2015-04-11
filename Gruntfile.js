module.exports = function(grunt) {
  grunt.util.linefeed = '\n';

  var files_in_order = [
    'src/PhotoSphereViewer.js',
    'src/PSVLoader.js',
    'src/PSVNavBar.js',
    'src/PSVNavBarButton.js',
    'src/PSVNavBarAutorotateButton.js',
    'src/PSVNavBarFullscreenButton.js',
    'src/PSVNavBarZoomButton.js',
    'src/PSVUtils.js'
  ];


  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    banner:
      '/*!\n'+
      ' * Photo Sphere Viewer <%= pkg.version %>\n'+
      ' * Copyright (c) 2014-<%= grunt.template.today("yyyy") %> Jérémy Heleine\n'+
      ' * Copyright (c) <%= grunt.template.today("yyyy") %> Damien "Mistic" Sorel\n'+
      ' * Licensed under MIT (http://opensource.org/licenses/MIT)\n'+
      ' */',

    concat: {
      js: {
        options: {
          stripBanners: false,
          separator: '\n\n'
        },
        src: files_in_order,
        dest: 'photo-sphere-viewer.js'
      },
      css: {
        options: {
          banner: '<%= banner %>\n\n'
        },
        files: [{
            expand: true,
            src: '*.css',
            dest: ''
        }]
      }
    },

    wrap: {
      dist: {
        src: 'photo-sphere-viewer.js',
        dest: '',
        options: {
          separator: '',
          wrapper: function() {
            var wrapper = grunt.file.read('src/.wrapper.js').replace(/\r\n/g, '\n').split(/@@js\n/);
            wrapper[0] = grunt.template.process('<%= banner %>\n\n') + wrapper[0];
            return wrapper;
          }
        }
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>\n\n'
      },
      dist: {
        src: 'photo-sphere-viewer.js',
        dest: 'photo-sphere-viewer.min.js'
      }
    },
    
    sass: {
      options: {
        sourcemap: 'none',
        style: 'expanded'
      },
      dist: {
        src: 'src/photo-sphere-viewer.scss',
        dest: 'photo-sphere-viewer.css'
      }
    },
    
    cssmin: {
        dist: {
            src: 'photo-sphere-viewer.css',
            dest: 'photo-sphere-viewer.min.css'
        }
    },

    jshint: {
      dist: {
        src: files_in_order
      }
    },

    watch: {
      js: {
        files: ['src/*.js', 'src/*.scss'],
        tasks: ['default']
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-wrap');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');


  grunt.registerTask('default', [
    'concat:js',
    'wrap',
    'uglify',
    'sass',
    'cssmin',
    'concat:css'
  ]);

  grunt.registerTask('test', [
    'jshint'
  ]);
};