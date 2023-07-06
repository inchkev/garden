var fs = require('fs').promises;
var ejs = require('ejs');
var path = require('path');
var sizeOf = require('image-size');
var getVideoDimensions = require('get-video-dimensions');


async function run() {
  var plantsDir = path.join(__dirname, '../plants');

  directories = await fs.readdir(plantsDir);

  // filter hidden files
  directories = directories.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

  for (const dir of directories) {
    // console.log(dir);
    var data = {
      title: 120,
      multimedia: [],
    };

    var directoryPath = path.join(plantsDir, dir);

    files = await fs.readdir(directoryPath);

    for (const file of files) {
      var filePath = path.join('plants', dir, file);
      var isImage = /\.(jpe?g|png)$/i.test(file);
      var isVideo = /\.(mp4)$/i.test(file);
      if (!isImage && !isVideo) {
        console.log('Skipping file:', filePath);
        continue;
      }

      var dimensions;
      if (isImage) {
        dimensions = await sizeOf(filePath);
        if (dimensions.orientation == 6 || dimensions.orientation == 8) {
          [dimensions.width, dimensions.height] = [dimensions.height, dimensions.width];
        }
      } else {
        dimensions = await getVideoDimensions(filePath);
      }

      data.multimedia.push({
        name: file,
        path: '/' + filePath,
        type: isImage ? 'image' : (isVideo ? 'video' : 'unknown'),
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    var templatePath = path.join(__dirname, '..', 'views', 'gallery.ejs');
    var str = await fs.readFile(templatePath, 'utf8');
    var template = ejs.compile(str);
    var html = template(data);
    var outputFilePath = path.join(__dirname, '..', dir + '.html');

    await fs.writeFile(outputFilePath, html);
    console.log('Generated HTML file:', outputFilePath);
  }
}

run();
