kevin.garden is a site sown from files, directories, and .DS_Store.

kevin.garden is also the code used to generate itself.

## subjectively,

- Images (jpeg, png, webp, gif, apng, svg, bmp, ico), videos (mp4, webm), and audio (mp3, wav, ogg, m4a) are displayed as their html equivalents: \<img\>, \<video\>, \<audio\>.
- Markdown (md) files are parsed into their relevant html.
- Files with no extension have their contents displayed. An empty extensionless file makes for a great header.
- All other file types are direct links with no formatting.

## seeding guide for new gardeners

Please read this whole section if you're interested in forking kevin.garden.

```console
how do we turn a directory into a garden?
usage:      node cultivate.js DIR
options:    -h, --help       print help
```

Since I have my code and my content in the same place, everywhere here, it's a bit messy if you want to fork this repo. To start fresh, all you need is to copy `package.json`, `src/` and `views/`. I didn't want to hide `src/` and `views/` on kevin.garden, so those folders will have residual index.htmls inside them; pardon the dust.

In the `views/` directory are two [ejs](https://ejs.co/) templates, `natural.ejs`, and `formal.ejs`. The script selects the natural template when "Sort By > None" is selected for the directory AND every file to be displayed has been moved at least once. Otherwise, it chooses the formal template.

By default, `npm run cultivate` runs `node src/cultivate.js .` (on the current directory). Beware where you run this! The maximum recursion depth is set to 3 but even that can easily wreak havoc.

Before you go off cultivating everything, be sure to create a `.gardenignore` file with `.*` so that hidden files and directories (such as .git/) are not visited. My .gardenignore also includes:

```
*.html
CNAME
README.md
package-lock.json
package.json
```

And please make sure `node_modules/` is also ignored somewhere (cultivate.js also reads .gitignore files), otherwise weeds (index.htmls) will find their way in many, many unwanted cracks (folders). Unless you want that.

### taming .DS_Store

I have found that the best way to have the .DS_Store file update, and thus the `cultivate.js` script to know where you have moved your files, is to first make all your updates and movements, and then delete the `index.html` file before re-running the script. Deleting a file in a directory seems to trigger an update to .DS_Store which in turn updates the location data of its contents.

Also important to know is that the "Sort By" and background color properties of the current directory is stored in the .DS_Store file of the *previous directory*. This is not an issue when visiting subsequent directories, but does mean that the script, in `cultivateHelper()`, will attempt to read the `.DS_Store` file in the directory *before* the one you have passed in.

## more

- I have plans to add max resursion depth as a command line argument. I have not done that yet. For now, manually set it, or pass it in in `cultivateHelper()`.
- The script only reads the .gardenignore and .gitignore files once, at the root directory it was invoked in. It will not listen to .gitignores within directories.

### plots

- [kevin.garden](https://kevin.garden)
