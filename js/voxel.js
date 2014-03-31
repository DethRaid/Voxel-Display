/* global VoxelDisplay: true */
VoxelDisplay = function(width, depth, height, subject) {
  if (!(this instanceof VoxelDisplay)) { return new VoxelDisplay(width, depth, height, subject); }
  this.width = width;
  this.height = height;
  this.depth = depth;
  this.zero();
  this.setDevice(subject);
};

VoxelDisplay.prototype.zero = function() {
  this.voxels = [];
  this.xplanes = [];
  this.yplanes = [];

  for (var x=0; x<this.width; x++) {
    this.voxels[x] = [];

    for (var y=0; y<this.depth; y++) {
      this.voxels[x][y] = [];

      for (var z=0; z<this.height; z++) {
        this.voxels[x][y][z] = false;
      }
    }
  }

  for (var p=0; p<(this.depth+1); p++) {
    this.xplanes[p] = [];
    for (var r=0; r<(this.width); r++) {
      this.xplanes[p][r] = [];
      for (var z=0; z<(this.height); z++) {
        this.xplanes[p][r][z] = false;
      }
    }
  }

  for (var p=0; p<(this.depth); p++) {
    this.yplanes[p] = [];
    for (var r=0; r<(this.width+1); r++) {
      this.yplanes[p][r] = [];
      for (var z=0; z<(this.height); z++) {
        this.yplanes[p][r][z] = false;
      }
    }
  }
};

VoxelDisplay.prototype.transform = function(vec) {
  return [Math.floor((vec[0])/2), Math.floor((vec[1])/2), vec[2]];
};

VoxelDisplay.prototype.toggleVoxel = function(x,y,z) {
  if (x >= this.width ||  
      y >= this.depth ||
      z >= this.height ||
      x < 0 || y < 0 || z < 0) { return; }

  var planes = [
    [2*x,2*y+1,z],
    [2*x+2,2*y+1,z],
    [2*x+1,2*y,z],
    [2*x+1,2*y+2,z]
  ];

  for (var i=0;i<planes.length;i++) {
    var c = this.transform(planes[i]);
    var plane;
    if (planes[i][0]%2===0) { //vertical (x)
      plane = this.xplanes;
    } else { //Horizontal planes
      plane = this.yplanes;
    }

    if (plane[c[0]][c[1]][c[2]]) {
      plane[c[0]][c[1]][c[2]] = false;
    } else {
      plane[c[0]][c[1]][c[2]] = true;
    }
  } 
};

VoxelDisplay.prototype.setVoxel = function(x,y,z,state) {
  if (state) {
    if (!this.voxel[x][y][z]) {
      this.toggleVoxel(x,y,z);
    }
  } else {
    if (this.voxel[x][y][z]) {
      this.toggleVoxel(x,y,z);
    }
  }
};

VoxelDisplay.prototype.setDevice = function(subject) {
  this.subject = subject;
};

VoxelDisplay.prototype.flush = function(subject) {
  if (!subject) {
    subject = this.subject;
  }
  if (!subject) {
    return; //No device to flush to
  }

  //Write the planes as they stand to the subject
  var buf = new Uint8Array((this.xplanes.length*this.xplanes[0].length*this.xplanes[0][0].length)+
                           (this.yplanes.length*this.yplanes[0].length*this.yplanes[0][0].length)+3);

  var pos = 0;
  buf[pos] = 0x9; //Indicate x planes start
  pos++;

  for (var planecount=0;planecount<this.xplanes.length;planecount++) {
    for (var colcount=0;colcount<this.xplanes[planecount].length;colcount++) {
      for (var zindex=0;zindex<this.xplanes[planecount][colcount].length;zindex++) {
        if (this.xplanes && this.xplanes[planecount] && this.xplanes[planecount][colcount] && this.xplanes[planecount][colcount][zindex]) {
          buf[pos] = 1; 
        } else {
          buf[pos] = 0;
        }
        pos++;
      }
    }
  }

  buf[pos] = 0x10; //indicate y planes start
  pos++;

  for (var planecount=0;planecount<this.yplanes.length;planecount++) {
    for (var colcount=0;colcount<this.yplanes[planecount].length;colcount++) {
      for (var zindex=0;zindex<this.yplanes[planecount][colcount].length;zindex++) {
        if (this.yplanes && this.yplanes[planecount] && this.yplanes[planecount][colcount] && this.yplanes[planecount][colcount][zindex]) {
          buf[pos] = 1;  
        } else {
          buf[pos] = 0; 
        }
        pos++;
      }
    }
  }

  buf[pos] = 0xff; //indicate finish

  subject.write(buf);
};