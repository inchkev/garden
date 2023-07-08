import ejs from 'ejs';
import { promises as fs } from 'fs';
import getVideoDimensions from 'get-video-dimensions';
import path from 'path';
import sizeOf from 'image-size';
import parse from 'parse-gitignore';
import micromatch from 'micromatch';
import prettyBytes from 'pretty-bytes';
import { spawnSync } from 'child_process';


// get __filename and __dirname
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const TEMPLATE_DIR = 'views';
const GITIGNORE = parse(await fs.readFile('.gitignore', 'utf8')).patterns;
const GARDENIGNORE = parse(await fs.readFile('.gardenignore', 'utf8')).patterns;


function parseDS_Store(path) {
  // credit https://stackoverflow.com/a/23452742 & https://stackoverflow.com/a/58571306
  const child = spawnSync('python3', ['src/DS_Store-parser/main.py', path]);
  if (child.error) {
    return null;
  }
  const json = child.stdout;
  return JSON.parse(json);
}

async function cultivate(rootPath, relativePath = '', currDir = '', icvp = null) {
  var currPath = path.join(rootPath, currDir);

  var renderFreeform = icvp && (icvp['arrangeBy'] === 'none' || icvp['arrangeBy'] === 'grid');
  var minLocationX = Infinity;
  var maxLocationX = -Infinity;

  var files = await fs.readdir(currPath);
  var fileCount = 0;
  var dirData = {
    title: (relativePath ? relativePath + '/' : ''),
    files: [],
  };

  // parse .DS_Store
  var dirDS_Store = undefined;
  if (files.includes('.DS_Store')) {
    dirDS_Store = parseDS_Store(path.join(currPath, '.DS_Store'));
    if (dirDS_Store) {
      // console.log(dirDS_Store);
    } else {
      renderFreeform = false;
    }
  }

  for (const file of files) {
    var fileInfo = { path: file }
    var filePath = path.join(currPath, file);
    var stats = await fs.stat(filePath);

    if (stats.isDirectory()) {

      if (micromatch.isMatch(file + '/', GITIGNORE) ||
          micromatch.isMatch(file + '/', GARDENIGNORE)) {
        // console.debug('Ignored directory:', filePath);
        continue;
      }

      fileInfo.type = 'directory';
      fileInfo.name = file + '/';
      fileInfo.path += '/';

      // recurse! also, cultivate() returns directory length
      const length = await cultivate(
        currPath,
        path.join(relativePath, file),
        file,
        (dirDS_Store && file in dirDS_Store) ? dirDS_Store[file]['icvp'] : null);

      fileInfo.contents = (length == 0) ? 'empty' : length + ((length == 1) ? ' item' : ' items');

    } else if (stats.isFile()) {

      if (micromatch.isMatch(file, GITIGNORE) ||
          micromatch.isMatch(file, GARDENIGNORE)) {
        // console.debug('Ignored file:', filePath);
        continue;
      }

      fileInfo.name = file;
      fileInfo.size = prettyBytes(stats.size, {space: false});

      // image
      if (/\.(jpe?g|png)$/i.test(file)) {
        fileInfo.type = 'image';
        try {
          var dimensions = await sizeOf(filePath);
          fileInfo.width = dimensions.width;
          fileInfo.height = dimensions.height;

          // exif quirks with orientation info
          if (dimensions.orientation == 6 || dimensions.orientation == 8) {
            [fileInfo.width, fileInfo.height] = [fileInfo.height, fileInfo.width];
          }
        } catch (err) {
          console.log('Error reading image:', filePath);
          console.log(err);
          continue;
        }

      // video
      } else if (/\.(mp4)$/i.test(file)) {
        fileInfo.type = 'video';
        try {
          var dimensions = await getVideoDimensions(filePath);
          fileInfo.width = dimensions.width;
          fileInfo.height = dimensions.height;
        } catch (err) {
          console.log('Error reading video:', filePath);
          console.log(err);
          continue;
        }

      // audio
      } else if (/\.(mp3|wav|ogg)$/i.test(file)) {
        fileInfo.type = 'audio';

      // } else if (/\.(txt)$/i.test(file)){
      //   fileInfo.type = 'text';
      //   try {
      //     fileInfo.contents = await fs.readFile(filePath, 'utf8');
      //   } catch (err) {
      //     console.log('Error reading file:', filePath);
      //     console.log(err);
      //     continue;
      //   }

      // other file extension
      } else if (/\.[\w]+$/.test(file)) {
        fileInfo.type = 'other';

      // if no extension, treat as raw text
      } else {
        fileInfo.type = 'raw';
        try {
          fileInfo.contents = await fs.readFile(filePath, 'utf8');
        } catch (err) {
          console.log('Error reading file:', filePath);
          console.log(err);
          continue;
        }
      }

    } else {
      console.log('Skipping file:', filePath);
      continue;
    }

    // renderFreeform means we've found a valid DS_Store with icon position data
    if (renderFreeform) {
      if (!(dirDS_Store && file in dirDS_Store && 'Iloc' in dirDS_Store[file])) {
        // console.log('File position for', filePath, 'not found in .DS_Store, using default');
        renderFreeform = false;
      } else {
        const location = dirDS_Store[file].Iloc;
        fileInfo.location = { x: location.x, y: location.y };
        minLocationX = Math.min(minLocationX, fileInfo.location.x);
        maxLocationX = Math.max(maxLocationX, fileInfo.location.x);
      }
    }

    dirData.files.push(fileInfo);
    fileCount++;
  }

  var templatePath = path.join(TEMPLATE_DIR, renderFreeform ? 'wild.ejs' : 'gallery.ejs');
  var template = ejs.compile(await fs.readFile(templatePath, 'utf8'));
  // subtract all by minLocationX
  if (renderFreeform) {
    const centerShift = (maxLocationX - minLocationX) / 2.0;
    for (let fileInfo of dirData.files) {
      fileInfo.location.x -= minLocationX + centerShift;
      fileInfo.location.y -= 70;
    }
  }
  var html = template(dirData);
  var outputPath = path.join(currPath, 'index.html');

  try {
    await fs.writeFile(outputPath, html);
    // console.log('Read', fileCount, 'of', files.length, 'files from', currPath);
    console.log('Read', fileCount, 'of', files.length, 'files from', 'garden/' + relativePath);
    // console.log('Planted HTML file:', outputPath);
    console.log('Planted HTML file:', 'garden/' + path.join(relativePath, 'index.html'));
    console.log();
  } catch (err) {
    console.log('Error planting HTML file:', outputPath);
    console.log(err);
  }

  return fileCount;
}


const gardenPath = path.join(__dirname, '..');
const dss = parseDS_Store(path.join(gardenPath, '..', '.DS_Store'));
if (dss && 'garden' in dss) {
  cultivate(gardenPath, '', '', dss['garden']['icvp']);
} else {
  cultivate(gardenPath);
}
