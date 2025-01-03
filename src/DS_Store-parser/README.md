# .DS_Store-parser
Fully parses the .DS_Store files generated by macOS.

.DS_Store files contain records of the different properties (fields) of the
files or directories of the directory of .DS_Store.  These fields can specify
things like modification dates, icons, backgrounds, comments, etc.  This
program parses, displays, and explains all the fields currently known in
.DS_Store.  (There's a lot!)

This program extracts more data than other similar programs that I can find,
like [gehaxelt /
**Python-dsstore**](https://github.com/gehaxelt/Python-dsstore) or [al45tair /
**ds_store**](https://github.com/al45tair/ds_store), although the latter
provides the function of writing .DS_Stores (which I am working on).

## Usage
To list all the files and their properties:
```sh
python3 parse.py <.DS_Store file>
```

If you want more specific usages, see the functions of the classes in the code.
But the code above should suffice.

You can try running it against a random .DS_Store on the web or on your
desktop, etc.

## More about .DS_Stores
It's the file that every macOS developer knows (and hates) and any other person
doesn't know.  It can and has led to serious, juicy data breaches.

[All Things
Dork](http://www.allthingsdork.com/random/2007/07/11/those-pesky-ds_store-files/)
describes it as:
> . . . Finder hides this file, so Mac Users are typically oblivious to it.
> But when you start working in a networked environment with Windows or Linux
> users you'll soon here [*sic.*] people screaming "WTF are all these .DS_Store
> files". Yes, our beloved OS X runs around like a hamster, shitting .DS_Store
> files all over the network in any folder we go to . . .

Since .DS_Store formats are proprietary, there aren't official specifications
and current parsers and formats are more or less speculations.

It's worth noting that a large portion of the .DS_Store appears to be junk.
Maybe the OS writes to the places that are convenient and doesn't care about
.DS_Store sizes.

Below are some helpful links for .DS_Store.  I used some of them.  They are all
a little out of date for the current macOS version, though.
- Nice intro:
https://0day.work/parsing-the-ds_store-file-format/
- Very detailed:
https://metacpan.org/pod/distribution/Mac-Finder-DSStore/DSStoreFormat.pod
- Original:
https://wiki.mozilla.org/DS_Store_File_Format
