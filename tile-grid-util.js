// Generated by CoffeeScript 2.3.2
(function() {
  //a javascript utility library to manage tile grids with arbitrary data.
  var DEFAULT_OPT, Rect, Tile, TileGrid, _clamp,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  DEFAULT_OPT = {
    x2: 3,
    y2: 3
  };

  _clamp = function(n, min, max) {
    return Math.min(Math.max(n, min), max);
  };

  // base rect class ith "bounds".
  Rect = class Rect {
    constructor(x1, x2, y1, y2) {
      this.set(x1, x2, y1, y2);
    }

    set(x1, x2, y1, y2) {
      this.x1 = x1 || 0;
      this.x2 = x2 || 0;
      this.y1 = y1 || 0;
      this.y2 = y2 || 0;
      return this;
    }

    copy(rect) {
      this.x1 = rect.x1;
      this.x2 = rect.x2;
      this.y1 = rect.y1;
      this.y2 = rect.y2;
      return this;
    }

    normalize() {
      if (this.x1 < 0) {
        this.x2 -= this.x1;
        this.x1 = 0;
      }
      if (this.y1 < 0) {
        this.y2 -= this.y1;
        this.y1 = 0;
      }
      return this;
    }

    loopMatrix(matrix, cb, argA, argB, argC) {
      var j, k, ref, ref1, ref2, ref3, x, y;
      for (y = j = ref = this.y1, ref1 = this.y2; (ref <= ref1 ? j < ref1 : j > ref1); y = ref <= ref1 ? ++j : --j) {
        if (y < 0) {
          continue;
        }
        if (y > matrix.length) {
          return false;
        }
        for (x = k = ref2 = this.x1, ref3 = this.x2; (ref2 <= ref3 ? k < ref3 : k > ref3); x = ref2 <= ref3 ? ++k : --k) {
          if (matrix[y][x] === void 0) {
            continue;
          }
          if (cb(matrix[y][x], x, y, argA, argB, argC) === false) {
            return false;
          }
        }
      }
      return true;
    }

    loopRect(cb, argA, argB, argC) {
      var j, k, ref, ref1, ref2, ref3, x, y;
      for (y = j = ref = this.y1, ref1 = this.y2; (ref <= ref1 ? j < ref1 : j > ref1); y = ref <= ref1 ? ++j : --j) {
        for (x = k = ref2 = this.x1, ref3 = this.x2; (ref2 <= ref3 ? k < ref3 : k > ref3); x = ref2 <= ref3 ? ++k : --k) {
          if (cb(x, y, argA, argB, argC)) {
            return false;
          }
        }
      }
      return true;
    }

  };

  // tile class, added as items in grid
  Tile = class Tile extends Rect {
    constructor(opt) {
      opt.x2 = opt.width;
      opt.y2 = opt.height;
      super(0, opt.width, 0, opt.height);
      this.item = opt.item;
      this.rect = opt.rect || null;
    }

    // if @x2 == 0 + @y2  0 || @x1 < 0 || @y1 < 0
    // 	throw new Error 'bad tile.'
    setXY(x, y) {
      return this.rect.set(x, x + this.x2, y, y + this.y2);
    }

  };

  // main grid class
  TileGrid = class TileGrid extends Rect {
    constructor(opt) {
      super();
      
      // clear one coordinate from matrix
      this.clearCoord = this.clearCoord.bind(this);
      this.isItemNull = this.isItemNull.bind(this);
      this.isCoordEmpty = this.isCoordEmpty.bind(this);
      // set the coordinate item
      this.setCoordItem = this.setCoordItem.bind(this);
      // clear one item from the matrix
      this.clearItem = this.clearItem.bind(this);
      this.check_holes = opt.check_holes != null ? opt.check_holes : true;
      this._temp = [new Rect, new Rect, new Rect];
      this.offset_x = 0;
      this.offset_y = 0;
      this.matrix = []; //2d matrix array that contains references to items in the list.
      // @item_list = [] # a list of items.
      this.removed = [];
      this.full = new Rect(opt.width - 1, 0, opt.height - 1, 0); // keep track of what portion of the matrix is full.
      this.full.count_x = [];
      this.full.count_y = [];
      this.set(0, opt.width, 0, opt.height);
    }

    clearCoord(item, x, y) {
      boundMethodCheck(this, TileGrid);
      if (this.matrix[y][x]) {
        this.decrY(y);
        this.decrX(x);
      }
      this.matrix[y][x] = null;
      return true;
    }

    isItemNull(item) {
      boundMethodCheck(this, TileGrid);
      return item === null;
    }

    isCoordEmpty(x, y) {
      boundMethodCheck(this, TileGrid);
      return this.matrix[y][x] === null;
    }

    setCoordItem(item, x, y, new_item) {
      boundMethodCheck(this, TileGrid);
      if (item) {
        throw new Error('setCoord, coord taken [' + x + ',' + y + '] by ' + item);
      }
      this.matrix[y][x] = [new_item, x - new_item.rect.x1, y - new_item.rect.y1];
      this.incrY(y);
      return this.incrX(x);
    }

    // (perf) decrease full row y value
    decrY(y) {
      this.full.count_y[y]--;
      if (this.full.y1 > y) {
        this.full.y1 = y;
      }
      if (this.full.y2 > y) {
        return this.full.y2 = y;
      }
    }

    // (perf) decrease
    decrX(x) {
      this.full.count_x[x]--;
      if (this.full.x1 > x) {
        this.full.x1 = x;
      }
      if (this.full.x2 > x) {
        return this.full.x2 = x;
      }
    }

    // increment row full value and count (all x items on y)
    incrY(y) {
      var j, k, ref, ref1, ref2, ref3, yi;
      this.full.count_y[y]++;
      // decide the full X/Y coord
      if (this.full.count_y[y] === this.width) {
        if (y < this.full.y1) {
          // check for holes
          if (this.check_holes) {
            for (yi = j = ref = y, ref1 = this.full.y1; (ref <= ref1 ? j < ref1 : j > ref1); yi = ref <= ref1 ? ++j : --j) {
              if (this.full.count_y[yi] !== this.width) {
                return;
              }
            }
          }
          return this.full.y1 = y;
        } else {
          // check for holes
          if (this.check_holes) {
            for (yi = k = ref2 = this.full.y1, ref3 = y; (ref2 <= ref3 ? k < ref3 : k > ref3); yi = ref2 <= ref3 ? ++k : --k) {
              if (this.full.count_y[yi] !== this.width) {
                return;
              }
            }
          }
          return this.full.y2 = y;
        }
      }
    }

    
    // increment column full value and count (all y items on x)
    incrX(x) {
      var j, k, ref, ref1, ref2, ref3, xi;
      this.full.count_x[x]++;
      // decide the full X/Y coord
      if (this.full.count_x[x] === this.height) {
        if (x < this.full.x1) {
          // check for holes
          if (this.check_holes) {
            for (xi = j = ref = x, ref1 = this.full.x1; (ref <= ref1 ? j < ref1 : j > ref1); xi = ref <= ref1 ? ++j : --j) {
              if (this.full.count_x[xi] !== this.height) {
                return;
              }
            }
          }
          return this.full.x1 = x;
        } else {
          // check for holes
          if (this.check_holes) {
            for (xi = k = ref2 = this.full.x1, ref3 = x; (ref2 <= ref3 ? k < ref3 : k > ref3); xi = ref2 <= ref3 ? ++k : --k) {
              if (this.full.count_y[xi] !== this.height) {
                return;
              }
            }
          }
          return this.full.x2 = x;
        }
      }
    }

    
    // clear all items in a rect from the matrix
    clearRect(rect) {
      var res;
      console.log('CLEAR RECT', rect, this.matrix);
      res = rect.loopMatrix(this.matrix, this.clearItem);
      if (!res) {
        return false;
      } else {
        return true;
      }
    }

    clearItem(spot, x, y) {
      var item, ix, iy, j, k, ref, ref1, ref2, ref3, sx, sy;
      boundMethodCheck(this, TileGrid);
      if (!spot) {
        return true;
      }
      item = spot[0];
      sx = x - spot[1];
      sy = y - spot[2];
      if (!item.rect) {
        throw new Error('cant clear item, item has no rect. ' + sx + ',' + sy);
      }
      for (iy = j = ref = sy, ref1 = sy + item.y2; (ref <= ref1 ? j < ref1 : j > ref1); iy = ref <= ref1 ? ++j : --j) {
        for (ix = k = ref2 = sx, ref3 = sx + item.x2; (ref2 <= ref3 ? k < ref3 : k > ref3); ix = ref2 <= ref3 ? ++k : --k) {
          this.clearCoord(item, ix, iy);
        }
      }
      item.rect = null;
      return true;
    }

    // @removed.push item

    // clear a row from matrix
    clearY(y) {
      var item, j, len, ref, results, x;
      ref = this.matrix[y];
      results = [];
      for (x = j = 0, len = ref.length; j < len; x = ++j) {
        item = ref[x];
        results.push(this.clearItem(this.matrix[y][x], x, y));
      }
      return results;
    }

    // clear any items in a column that are also in column x2
    clearLinkedX(x, x2) {
      var j, len, ref, results, row, y;
      ref = this.matrix;
      results = [];
      for (y = j = 0, len = ref.length; j < len; y = ++j) {
        row = ref[y];
        if (row[x] && row[x2] && row[x2][0] === row[x][0]) {
          results.push(this.clearItem(row[x], x, y));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }

    // clear any items in a column that are also in column x2
    clearLinkedY(y, y2) {
      var j, len, ref, results, spot, x;
      ref = this.matrix[y];
      results = [];
      for (x = j = 0, len = ref.length; j < len; x = ++j) {
        spot = ref[x];
        if (spot && this.matrix[y2] && this.matrix[y2][x][0] === spot[0]) {
          results.push(this.clearItem(spot, x, y));
        } else {
          results.push(void 0);
        }
      }
      return results;
    }

    
    // clear a column from matrix
    clearX(x) {
      var j, len, ref, results, row, y;
      ref = this.matrix;
      results = [];
      for (y = j = 0, len = ref.length; j < len; y = ++j) {
        row = ref[y];
        results.push(this.clearItem(row[x], x, y));
      }
      return results;
    }

    // insert column(s) into matrix
    insertX(pos, count) {
      var i, j, ref, results, y;
      this.clearLinkedX(pos, _clamp(pos - 1, 0, this.x2 - 1));
      if (this.full.x1 > pos) {
        this.full.x1 += count;
      } else {
        this.full.x1 = this.x2 - 1;
      }
      if (this.full.x2 > pos) {
        this.full.x2 = 0;
      }
      this.full.y1 = this.y2;
      this.full.y2 = 0;
      results = [];
      for (i = j = 0, ref = count; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        this.full.count_x.splice(pos, 0, 0);
        results.push((function() {
          var k, len, ref1, results1;
          ref1 = this.matrix;
          results1 = [];
          for (k = 0, len = ref1.length; k < len; k++) {
            y = ref1[k];
            results1.push(y.splice(pos, 0, null));
          }
          return results1;
        }).call(this));
      }
      return results;
    }

    // insert row(s) into matrix
    insertY(pos, count) {
      var i, j, ref, results;
      this.clearLinkedY(pos, _clamp(pos - 1, 0, this.y2 - 1));
      if (this.full.y1 < pos) {
        this.full.y1 = pos + count;
      }
      results = [];
      for (i = j = 0, ref = count; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
        this.full.count_y.splice(pos, 0, 0);
        results.push(this.matrix.splice(pos, 0, new Array(this.x2).fill(null)));
      }
      return results;
    }

    // set new bounds for matrix.
    set(x1, x2, y1, y2) {
      var diff, i, j, k, l, len, len1, len2, len3, m, o, p, q, r, ref, ref1, ref10, ref11, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, row, s, t, u, v, y;
      if (!this.height) {
        this.height = 0;
      }
      if (!this.width) {
        this.width = 0;
      }
      if (this.x1 === void 0) {
        return super.set(x1, x2, y1, y2);
      }
      diff = new Rect(x1 - this.x1, x2 - this.x2, y1 - this.y1, y2 - this.y2);
      if ((diff.y1 - diff.y2) > this.height) {
        throw new Error('set: Y out of bounds');
      }
      if ((diff.x1 - diff.x2) > this.width) {
        throw new Error('set: X out of bounds');
      }
      
      // log 'diff',diff

      //diff X2
      if (diff.x2 > 0) {
        for (i = j = 0, ref = diff.x2; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
          this.full.count_x.push(0);
          ref1 = this.matrix;
          for (k = 0, len = ref1.length; k < len; k++) {
            y = ref1[k];
            y.push(null);
          }
        }
      } else if (diff.x2 < 0) {
        for (i = l = 0, ref2 = diff.x2; (0 <= ref2 ? l < ref2 : l > ref2); i = 0 <= ref2 ? ++l : --l) {
          this.clearX(this.x2 - 1 + i);
          this.full.count_x.pop();
          ref3 = this.matrix;
          for (m = 0, len1 = ref3.length; m < len1; m++) {
            y = ref3[m];
            y.pop();
          }
        }
      }
      this.x2 = x2;
      //diff X1
      if (diff.x1 < 0) {
        for (i = o = 0, ref4 = diff.x1; (0 <= ref4 ? o < ref4 : o > ref4); i = 0 <= ref4 ? ++o : --o) {
          this.full.count_x.unshift(0);
          this.full.x2++;
          this.full.x1++;
          this.offset_x--;
          ref5 = this.matrix;
          for (p = 0, len2 = ref5.length; p < len2; p++) {
            row = ref5[p];
            row.unshift(null);
          }
        }
      } else if (diff.x1 > 0) {
        for (i = q = 0, ref6 = diff.x1; (0 <= ref6 ? q < ref6 : q > ref6); i = 0 <= ref6 ? ++q : --q) {
          this.clearX(0);
          this.full.x2--;
          this.full.x1--;
          this.offset_x++;
          this.full.count_x.shift();
          ref7 = this.matrix;
          for (r = 0, len3 = ref7.length; r < len3; r++) {
            row = ref7[r];
            row.shift();
          }
        }
      }
      this.x1 = x1;
      //diff Y2
      if (diff.y2 > 0) {
        for (i = s = 0, ref8 = diff.y2; (0 <= ref8 ? s < ref8 : s > ref8); i = 0 <= ref8 ? ++s : --s) {
          this.full.count_y.push(0);
          this.matrix.push(new Array(this.x2 - this.x1).fill(null));
        }
      } else if (diff.y2 < 0) {
        for (i = t = 0, ref9 = diff.y2; (0 <= ref9 ? t < ref9 : t > ref9); i = 0 <= ref9 ? ++t : --t) {
          this.clearY(this.y2 - 1 + i);
          this.full.count_y.pop();
          this.matrix.pop();
        }
      }
      // for i in [0...diff.y2]
      this.y2 = y2;
      //diff Y1
      if (diff.y1 > 0) {
        for (i = u = 0, ref10 = diff.y1; (0 <= ref10 ? u < ref10 : u > ref10); i = 0 <= ref10 ? ++u : --u) {
          this.clearY(0);
          this.full.y2--;
          this.full.y1--;
          this.offset_y++;
          this.full.count_y.shift();
          this.matrix.shift();
        }
      } else if (diff.y1 < 0) {
        for (i = v = 0, ref11 = diff.y1; (0 <= ref11 ? v < ref11 : v > ref11); i = 0 <= ref11 ? ++v : --v) {
          this.offset_y--;
          this.full.y2++;
          this.full.y1++;
          this.full.count_y.unshift(0);
          this.full.x1 = 0;
          this.full.x2 = 0;
          this.matrix.unshift(new Array(this.x2 - this.x1).fill(null));
        }
      }
      this.y1 = y1;
      this.normalize();
      if (diff.x2 - diff.x1 > 0) {
        this.full.y1 = this.y2 - 1;
        this.full.y2 = this.y1;
      }
      if (diff.y2 - diff.y1 > 0) {
        this.full.x1 = this.x2 - 1;
        this.full.x2 = this.x1;
      }
      this.width = this.x2;
      return this.height = this.y2;
    }

    pad(x1, x2, y1, y2) {
      return this.set(this.x1 - x1, this.x2 + x2, this.y1 - y1, this.y2 + y2);
    }

    crop(x1, x2, y1, y2, cb) {
      var i_map, items, j, k, ref, ref1, ref2, ref3, x, y;
      i_map = new Map();
      items = [];
      for (y = j = ref = y1, ref1 = y2; (ref <= ref1 ? j < ref1 : j > ref1); y = ref <= ref1 ? ++j : --j) {
        for (x = k = ref2 = x1, ref3 = x2; (ref2 <= ref3 ? k < ref3 : k > ref3); x = ref2 <= ref3 ? ++k : --k) {
          if (this.matrix[y][x]) {
            if (i_map.get(this.matrix[y][x][0])) {
              continue;
            }
            i_map.set(this.matrix[y][x][0], true);
            items.push(cb(this.matrix[y][x][0], x, y));
          }
        }
      }
      return items;
    }

    // find a free rect within bounds, if no rect is found, return false
    // rect x1 and y1 must be normalized.
    findEmptyRect(rect, bounds, result, ignore_taken_spots) {
      var break_rect, ix, iy, j, k, l, m, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, x, y;
      rect.normalize();
      if (rect.y2 > bounds.y2 || rect.x2 > bounds.x2 || rect.x1 < bounds.x1 || rect.y2 < bounds.y1) {
        return false;
      }
      for (y = j = ref = bounds.y1, ref1 = bounds.y2; (ref <= ref1 ? j < ref1 : j > ref1); y = ref <= ref1 ? ++j : --j) {
        for (x = k = ref2 = bounds.x1, ref3 = bounds.x2; (ref2 <= ref3 ? k < ref3 : k > ref3); x = ref2 <= ref3 ? ++k : --k) {
          break_rect = false;
          for (iy = l = ref4 = y + rect.y2 - 1, ref5 = y; (ref4 <= ref5 ? l <= ref5 : l >= ref5); iy = ref4 <= ref5 ? ++l : --l) {
            if (break_rect) {
              break;
            }
            for (ix = m = ref6 = x + rect.x2 - 1, ref7 = x; (ref6 <= ref7 ? m <= ref7 : m >= ref7); ix = ref6 <= ref7 ? ++m : --m) {
              if (!this.matrix[iy]) {
                break_rect = true;
                break;
              }
              if (this.matrix[iy][ix] === void 0) {
                break_rect = true;
                break;
              }
              if (this.matrix[iy][ix] !== null && !ignore_taken_spots) {
                break_rect = true;
                break;
              }
            }
          }
          if (break_rect === false) {
            if (result) {
              return result.set(x, x + rect.x2, y, y + rect.y2);
            }
            return true;
          }
        }
      }
      return false;
    }

    insertTile(item, x, y) {
      var bounds;
      bounds = this._temp[0].set(x, x + item.x2, y, y + item.y2);
      if (!this.findEmptyRect(item, bounds, null, true)) {
        return false;
      }
      if (!this.clearRect(bounds)) {
        console.warn('failed to clear rect');
        return false;
      }
      item.rect = new Rect().copy(bounds);
      return bounds.loopMatrix(this.matrix, this.setCoordItem, item);
    }

    addTile(item, x1, x2, y1, y2) {
      var bounds, result;
      bounds = this._temp[0].set(x1, x2, y1, y2);
      
      // limit search  by the rect that we are trying to find (no overflow searches)
      if (bounds.x2 > bounds.x1) {
        bounds.x2 -= item.x2 - 1;
      } else {
        bounds.x1 -= item.x2 - 1;
      }
      if (bounds.y2 > bounds.y1) {
        bounds.y2 -= item.y2 - 1;
      } else {
        bounds.y1 -= item.y2 - 1;
      }
      if (bounds.y2 < 0 || bounds.x2 < 0 || bounds.y1 > this.y2 || bounds.x1 > this.x2) {
        return false;
      }
      result = this._temp[1].set();
      if (!this.findEmptyRect(item, bounds, result)) {
        return false;
      } else {
        item.rect = new Rect().copy(result);
        item.rect.loopMatrix(this.matrix, this.setCoordItem, item);
        // @item_list.push item
        return true;
      }
    }

    setTileCb(bounds) {
      this.clearRect(bounds);
      return false;
    }

    
    // setTile: (item,x1,y1)->
    // 	@addTile(item,x1,x1+item.x2,y1,y1+item.y2)
    log() {
      var j, len, ref, str, y;
      console.log('-----------------\n\n');
      ref = this.matrix;
      for (j = 0, len = ref.length; j < len; j++) {
        y = ref[j];
        str = y.map(function(x) {
          return x && String(x[0].item.key) || '- ';
        });
        console.log(str.join('     ') + '\n\n');
      }
      return console.log('-----------------');
    }

  };

  module.exports = {Rect, Tile, TileGrid};

}).call(this);
