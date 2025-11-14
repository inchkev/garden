kevin.garden is a website sown from files, directories, and .DS_Store.

kevin.garden is the code that generates itself.

kevin.garden is a file garden.

kevin.garden is [sisters](https://en.wikipedia.org/wiki/Sister_city)
with [file.gallery](https://github.com/inchkev/file-gallery), which you should look at if you wish to start your own garden.


## subjectively,

- Images (jpeg, png, webp, gif, apng, svg, bmp, ico), videos (mp4, webm), and audio (mp3, wav, ogg, m4a) are displayed as their html equivalents: \<img\>, \<video\>, \<audio\>.
- Markdown (md) files are parsed into their relevant html.
- A file with no extension has its name and contents displayed. An empty extensionless file makes for a great visual header.
- All other file types are direct links with no formatting.

### kevin.garden

- Respects .gitignore and .gardenignore denylists.
- Parses from the .DS_Store file coordinates, directory view options, and background colors.

## seeding guide for new gardeners

Please read this entire section if you're interested in forking kevin.garden.

```console
how do we turn a directory into a garden?
usage:      node cultivate.js DIR
options:    -h, --help       print help
```

Since I have my code and my content in the same place, everywhere here, it's a bit messy if you want to fork this repo. To start fresh, all you need is to copy `package.json`, `src/` and `views/`. I didn't want to hide `src/` and `views/` on kevin.garden, so those folders will have residual index.htmls inside them; pardon the dust.

In the `views/` directory are two [ejs](https://ejs.co/) templates, `natural.ejs`, and `formal.ejs`. The script selects the natural template when "Sort By > None" is selected for the directory AND every file to be displayed has been moved at least once. Otherwise, it chooses the formal template.

By default, `npm run cultivate` runs `node src/cultivate.js .` (on the current directory). Beware where you run this! The maximum recursion depth is set to 3 but even that can easily wreak havoc in the wrong directory.

Before you go off cultivating everything, be sure to create a `.gardenignore` file with `.*` so that hidden files and directories (such as .git/) are not visited. My .gardenignore also includes:

```
*.html
CNAME
README.md
package-lock.json
package.json
```

And please make sure `node_modules/` is ignored somewhere (cultivate.js also reads .gitignore files, so there is great), otherwise index.htmls will find their way into many, many unwanted cracks (folders). Unless you want that. An important note is that the script only reads .gardenignore and .gitignore once, at the root directory it was invoked in. It will not listen to additional .gitignores within directories.

### taming .DS_Store

I have found that the best way to have the .DS_Store file update, and thus the `cultivate.js` script to know where you have moved your files, is to first make all your updates and movements, and then delete the `index.html` file before re-running the script. Deleting a file in a directory seems to trigger an update to .DS_Store which in turn updates the location data of its contents.

Also important to know is that the "Sort By" and background color properties of the current directory is stored in the .DS_Store file of the *previous directory*. This is not an issue when visiting subsequent directories, but does mean that the script, in the beginning, will try to read the `.DS_Store` file in the directory *before* the root directory. This happens in `cultivateHelper()`.

## license

- `src/` — `parse.py` by [Thomas Zhu](https://github.com/hanwenzhu) is licensed under the MIT license. all other source code (in `src/`) is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
  - if modified, indicate it by adding it to the header comment, e.g. "modified by \[name\]: add jpeg xl support"
- `views/` — all templates and their styles are licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
  - if modified, indicate it in the attribution, e.g. "modified by \[name\]"
- the license for site content (published images, text, etc) is specified on the website itself.

for published websites, having the CC attribution only in the html source is sufficient. i'd appreciate a link to https://kevin.garden/ or https://file.gallery/ in the attribution. a visible reference on the website itself would be nice too. thank you!
