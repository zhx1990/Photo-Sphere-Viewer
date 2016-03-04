var vm = require('vm');
var fs = require('fs');
var assert = require('assert');

// Load PSVUtils (not a node module) in current context
var psvUtilsFile = fs.readFileSync('src/js/PSVUtils.js');
vm.runInThisContext(psvUtilsFile);

describe('PSVUtils::parsePosition', function() {
  it('should parse 2 keywords', function() {
    var values = {
      'top left': { left: 0, top: 0 },
      'top center': { left: 0.5, top: 0 },
      'top right': { left: 1, top: 0 },
      'center left': { left: 0, top: 0.5 },
      'center center': { left: 0.5, top: 0.5 },
      'center right': { left: 1, top: 0.5 },
      'bottom left': { left: 0, top: 1 },
      'bottom center': { left: 0.5, top: 1 },
      'bottom right': { left: 1, top: 1 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);

      var rev = pos.split(' ').reverse().join(' ');
      assert.deepEqual(PSVUtils.parsePosition(rev), values[pos], rev);
    }
  });

  it('should parse 1 keyword', function() {
    var values = {
      'top': { left: 0.5, top: 0 },
      'center': { left: 0.5, top: 0.5 },
      'bottom': { left: 0.5, top: 1 },
      'left': { left: 0, top: 0.5 },
      'right': { left: 1, top: 0.5 },
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should parse 2 percentages', function() {
    var values = {
      '0% 0%': { left: 0, top: 0 },
      '50% 50%': { left: 0.5, top: 0.5 },
      '100% 100%': { left: 1, top: 1 },
      '10% 80%': { left: 0.1, top: 0.8 },
      '80% 10%': { left: 0.8, top: 0.1 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should parse 1 percentage', function() {
    var values = {
      '0%': { left: 0, top: 0 },
      '50%': { left: 0.5, top: 0.5 },
      '100%': { left: 1, top: 1 },
      '80%': { left: 0.8, top: 0.8 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should parse mixed keyword & percentage', function() {
    var values = {
      'top 80%': { left: 0.8, top: 0 },
      '80% bottom': { left: 0.8, top: 1 },
      'left 40%': { left: 0, top: 0.4 },
      '40% right': { left: 1, top: 0.4 },
      'center 10%': { left: 0.5, top: 0.1 },
      '10% center': { left: 0.1, top: 0.5 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should fallback on parse fail', function() {
    var values = {
      '': { left: 0.5, top: 0.5 },
      'crap': { left: 0.5, top: 0.5 },
      'foo bar': { left: 0.5, top: 0.5 },
      'foo 50%': { left: 0.5, top: 0.5 },
      '%': { left: 0.5, top: 0.5 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should ignore extra tokens', function() {
    var values = {
      'top center bottom': { left: 0.5, top: 0 },
      '50% left 20%': { left: 0, top: 0.5 },
      '0% 0% okay this time it goes ridiculous': { left: 0, top: 0 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });

  it('should ignore case', function() {
    var values = {
      'TOP CENTER': { left: 0.5, top: 0 },
      'cenTer LefT': { left: 0, top: 0.5 }
    };

    for (var pos in values) {
      assert.deepEqual(PSVUtils.parsePosition(pos), values[pos], pos);
    }
  });
});
