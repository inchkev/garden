/*
cultivate.js by kevin.garden

Copyright (C) 2024 Kevin Chen

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


// node defaults
import path from 'path';
import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';

// ejs templating
import ejs from 'ejs';
// get dimensions of image/videos
import sizeOf from 'image-size';
import getVideoDimensions from 'get-video-dimensions';
// parse .gitignore files
import parse from 'parse-gitignore';
// fast glob matching
import micromatch from 'micromatch';
// formatting file sizes
import prettyBytes from 'pretty-bytes';
// markdown parsing 
import { marked } from 'marked';
marked.use({
    async: true,
    mangle: false,
    headerIds: false,
});


import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GARDEN_DIR = path.join(__dirname, '..')
const TEMPLATE_DIR = path.join(GARDEN_DIR, 'views');

const GITIGNORE = parse(await fs.readFile(path.join(GARDEN_DIR, '.gitignore'), 'utf8')).patterns;
const GARDENIGNORE = parse(await fs.readFile(path.join(GARDEN_DIR, '.gardenignore'), 'utf8')).patterns;
const DS_STORE_PARSE = path.join(GARDEN_DIR, 'src', 'DS_Store-parser', 'main.py');

const TOP_PADDING_PX_FREEFORM = 50;


/**
 * Parses a given .DS_Store file into a JSON.
 * 
 * @param {string} path 
 * @returns {object}
 */
/* credit https://stackoverflow.com/a/23452742 & https://stackoverflow.com/a/58571306 */
function parseDS_Store(path) {
    const child = spawnSync('python3', [DS_STORE_PARSE, path]);
    if (child.error) {
        return null;
    }
    const json = child.stdout;
    return JSON.parse(json);
}


/**
 * Calculates the relative luminance L as defined by WVAG 2.0.
 * 
 * See https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * 
 * @param {number} R8bit 
 * @param {number} G8bit 
 * @param {number} B8bit 
 * @returns {number}
 */
function calculateRelativeLuminance(R8bit, G8bit, B8bit) {
    const RsRGB = R8bit / 255;
    const GsRGB = G8bit / 255;
    const BsRGB = B8bit / 255;
    const R = RsRGB <= 0.03928 ? RsRGB / 12.92 : Math.pow((RsRGB + 0.055) / 1.055, 2.4);
    const G = GsRGB <= 0.03928 ? GsRGB / 12.92 : Math.pow((GsRGB + 0.055) / 1.055, 2.4);
    const B = BsRGB <= 0.03928 ? BsRGB / 12.92 : Math.pow((BsRGB + 0.055) / 1.055, 2.4);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}


/**
 * :house_with_garden:
 */
async function cultivate(rootPath, relativePath = '.', currDir = '', icvp = null, maxDepth = 3) {
    if (maxDepth < 0) {
        return 0;
    }

    const currPath = path.join(rootPath, currDir);
    const files = await fs.readdir(currPath);

    let fileCount = 0;
    let dirData = {
        title: (relativePath != '.' ? relativePath + '/' : ''),
        files: [],
    };

    let renderFreeform = false;
    let minLocationX = Infinity;
    let maxLocationX = -Infinity;
    let minLocationY = Infinity;
    let maxLocationY = -Infinity;
    let fileLocations = [];

    if (icvp) {
        renderFreeform = icvp['arrangeBy'] === 'none' || icvp['arrangeBy'] === 'grid';

        // according to wcag 2.0 both background color and text color must be specified together
        if (icvp['bgType'] == 1) { // type = 0 : Default, 1: Color, 2: Image
            dirData.backgroundColor = `rgb(${icvp['bgR']}, ${icvp['bgG']}, ${icvp['bgB']})`;
            // pick white or black text color based on contrast w/ background color
            if (calculateRelativeLuminance(icvp['bgR'], icvp['bgG'], icvp['bgB']) <= 0.1791) {
                dirData.textColor = 'white';
            } else {
                dirData.textColor = 'black';
            }
        }
    }

    // parse .DS_Store
    let dirDS_Store = null;
    if (files.includes('.DS_Store')) {
        dirDS_Store = parseDS_Store(path.join(currPath, '.DS_Store'));
        if (dirDS_Store) {
            // console.debug(dirDS_Store);
        } else {
            renderFreeform = false;
        }
    }

    for (const file of files) {
        let fileInfo = { path: file }
        let filePath = path.join(currPath, file);
        let stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            // I should just figure out how to use micromatch.
            if (micromatch.isMatch(file, GITIGNORE) ||
                    micromatch.isMatch(file, GARDENIGNORE) ||
                    micromatch.isMatch(file + '/', GITIGNORE) ||
                    micromatch.isMatch(file + '/', GARDENIGNORE)) {
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
                (dirDS_Store && file in dirDS_Store) ? dirDS_Store[file]['icvp'] : null,
                maxDepth - 1
            );

            fileInfo.contents = (length == 0) ? 'empty' : `${length} item` + ((length > 1) ? 's' : '');

        } else if (stats.isFile()) {
            if (micromatch.isMatch(file, GITIGNORE) ||
                    micromatch.isMatch(file, GARDENIGNORE)) {
                continue;
            }

            fileInfo.name = file;
            fileInfo.size = prettyBytes(stats.size, {space: false});

            let fileType = file.includes('.') ? file.split('.').reverse()[0] : '';
            switch (fileType.toLowerCase()) {

                // image
                case 'jpeg':
                case 'jpg':
                case 'png':
                case 'webp':
                case 'gif':
                case 'apng':
                case 'svg':
                case 'bmp':
                case 'ico':
                    fileInfo.type = 'image';
                    try {
                        let dimensions = await sizeOf(filePath);
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
                    break;

                // video
                case 'mp4':
                case 'webm':
                    fileInfo.type = 'video';
                    try {
                        let dimensions = await getVideoDimensions(filePath);
                        fileInfo.width = dimensions.width;
                        fileInfo.height = dimensions.height;
                    } catch (err) {
                        console.log('Error reading video:', filePath);
                        console.log(err);
                        continue;
                    }
                    break;

                // audio
                case 'mp3':
                case 'wav':
                case 'ogg':
                case 'm4a':
                    fileInfo.type = 'audio';
                    break;

                // markdown
                case 'md':
                    fileInfo.type = 'markdown';
                    try {
                        const contents = await fs.readFile(filePath, 'utf8');
                        fileInfo.contents = await marked.parse(contents);
                    } catch (err) {
                        console.log('Error reading file:', filePath);
                        console.log(err);
                        continue;
                    }
                    break;

                // raw if no extension
                case '':
                    // skip 'LICENSE' files
                    if (fileInfo.name === 'LICENSE') {
                        fileInfo.type = 'other';
                        break;
                    }
                    fileInfo.type = 'raw';
                    try {
                        fileInfo.contents = await fs.readFile(filePath, 'utf8');
                    } catch (err) {
                        console.log('Error reading file:', filePath);
                        console.log(err);
                        continue;
                    }
                    break;

                // don't render text files
                case 'txt':
                // other
                default:
                    fileInfo.type = 'other';
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
                fileInfo.location = {
                    x: location.x,
                    y: location.y
                };
                minLocationX = Math.min(minLocationX, fileInfo.location.x);
                maxLocationX = Math.max(maxLocationX, fileInfo.location.x);
                minLocationY = Math.min(minLocationY, fileInfo.location.y);
                maxLocationY = Math.max(maxLocationY, fileInfo.location.y);
                fileLocations.push([location.x, location.y]);
            }
        }

        dirData.files.push(fileInfo);
        fileCount++;
    }

    // if freeform, do a hack to kinda "center" the contents
    if (renderFreeform) {
        // normalize locations
        for (let fileInfo of dirData.files) {
            fileInfo.location.x -= minLocationX;
            fileInfo.location.y -= minLocationY
            fileInfo.location.y += TOP_PADDING_PX_FREEFORM;
        }
        dirData.centerOffset = (maxLocationX - minLocationX) / 2.0;
    }

    // generate html file from associated template
    let templatePath = path.join(TEMPLATE_DIR, renderFreeform ? 'natural.ejs' : 'formal.ejs');
    let template = ejs.compile(await fs.readFile(templatePath, 'utf8'));
    let html = template(dirData);
    let outputPath = path.join(currPath, 'index.html');

    // plant html file
    if (fileCount > 0) {
        try {
            console.log('Read', fileCount, 'of', files.length, 'files from', relativePath);
            await fs.writeFile(outputPath, html);
            console.log('\tPlanted', path.join(relativePath, 'index.html'), `(${renderFreeform ? 'natural' : 'formal'})`);
        } catch (err) {
            console.log(`Could not plant ${outputPath}, skipping. Error:\n\t${err}`);
        }
    }

    return fileCount;
}

/**
 * :toolbox:
 */
async function cultivateHelper(root) {
    // check if directory provided is valid
    let stats = await fs.stat(root);
    if (!stats.isDirectory()) {
        console.error(`invalid directory ${root}`);
    }
    let dirname = path.basename(root);

    // try reading the .DS_Store of the previous directory as it contains
    // information about the current directory
    let icvp = null;
    try {
        await fs.access(path.join(root, '..', '.DS_Store'), fs.constants.R_OK);
        let dirDS_Store = parseDS_Store(path.join(root, '..', '.DS_Store'));
        icvp = dirDS_Store[dirname]['icvp'] ?? null;
    } catch { }

    // 🌱
    let _ = await cultivate(root, '.', '', icvp);
}


const usage = 'how do we turn a directory into a garden?\n' +
    'usage:      node cultivate.js DIR\n' +
    'options:    -h, --help       print help';

if (process.argv.includes('-h') || process.argv.includes('--help')) {
    console.log(usage);
} else if (process.argv.length == 3) {
    try {
        // try getting the path the user provided
        const resolvedPath = await fs.realpath(process.argv[2]);
        await cultivateHelper(resolvedPath);
    } catch (err) {
        console.error(`invalid directory ${process.argv[2]}`);
    }
} else {
    console.log(usage);
}
