import ejs from 'ejs';
import { promises as fs } from 'fs';
import getVideoDimensions from 'get-video-dimensions';
import path from 'path';
import sizeOf from 'image-size';
import parse from 'parse-gitignore';
import micromatch from 'micromatch';

import prettyBytes from 'pretty-bytes';


// get __filename and __dirname
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const TEMPLATE_DIR = 'views';
const GITIGNORE = parse(await fs.readFile('.gitignore', 'utf8')).patterns;
const GARDENIGNORE = parse(await fs.readFile('.gardenignore', 'utf8')).patterns;


async function cultivate(rootPath, relativePath = '', currDir = '') {
  var data = {
    title: relativePath + '/',
    files: [],
  };

  var currPath = path.join(rootPath, currDir);
  var files = await fs.readdir(currPath);
  var numFiles = 0;
  // files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

  for (const file of files) {
    if (file === '.DS_STORE') {
      console.log('Found .DS_STORE');
      continue;
    }

    var fileInfo = { path: file }
    var filePath = path.join(currPath, file);
    var stats = await fs.stat(filePath);

    if (stats.isDirectory()) {

      if (micromatch.isMatch(file + '/', GITIGNORE) ||
          micromatch.isMatch(file + '/', GARDENIGNORE)) {
        continue;
      }

      fileInfo.type = 'directory';
      fileInfo.name = file + '/';
      fileInfo.path += '/';

      // recurse! also, cultivate() returns directory length
      const length = await cultivate(currPath, path.join(relativePath, file), file);

      fileInfo.contents = (length == 0) ? 'empty' : length + ((length == 1) ? ' item' : ' items');

    } else if (stats.isFile()) {

      if (micromatch.isMatch(file, GITIGNORE) ||
          micromatch.isMatch(file, GARDENIGNORE)) {
        continue;
      }

      fileInfo.name = file;
      fileInfo.size = prettyBytes(stats.size, {space: false});

      // if image
      if (/\.(jpe?g|png)$/i.test(file)) {
        fileInfo.type = 'image';
        var dimensions = await sizeOf(filePath);

        // exif quirks with orientation info
        if (dimensions.orientation == 6 || dimensions.orientation == 8) {
          [dimensions.width, dimensions.height] = [dimensions.height, dimensions.width];
        }
        fileInfo.width = dimensions.width;
        fileInfo.height = dimensions.height;

      // if video
      } else if (/\.(mp4)$/i.test(file)) {
        fileInfo.type = 'video';
        var dimensions = await getVideoDimensions(filePath);
        fileInfo.width = dimensions.width;
        fileInfo.height = dimensions.height;

      // else
      } else {
        fileInfo.type = 'file';
      }

      // TODO: check .DS_STORE

    } else {
      console.log('Skipping file:', filePath);
      continue;
    }

    data.files.push(fileInfo);
    numFiles++;
  }

  var templatePath = path.join(TEMPLATE_DIR, 'gallery.ejs');
  var template = ejs.compile(await fs.readFile(templatePath, 'utf8'));
  var html = template(data);
  var outputPath = path.join(currPath, 'index.html');

  await fs.writeFile(outputPath, html);
  console.log('Planted', numFiles, 'of', files.length, 'files from', currPath);
  console.log('Generated HTML file:', outputPath);

  return numFiles;
}


cultivate(path.join(__dirname, '..'));
