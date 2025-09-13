
**Minifier** provides the ability to save compressed JavaScript and CSS file. It uses the [YUI Compressor](https://yui.github.io/yuicompressor/) for CSS and [Google Closure](https://developers.google.com/closure/compiler/docs/gettingstarted_app) for JavaScript.

This is a first attempt at a Nova extension and an attempt to migrate from Eclipse. This extension is based on Eclipse's [Minifier plug-in](https://github.com/mnlipp/EclipseMinifyBuilder), with the preferences I use for work projects for the Google Closure: `--warning_level QUIET --compilation_level SIMPLE` and to generate the source map

(Option to change settings may come in the future)

## Requirements

- **Java (8+)** - The extension is packed with the jars for YUICompressor (V2.4.8) and Google Closure Compiler (20180202).

## Usage

Minifier runs when ever you save a JavaScript file (".js") that is in a "js/" folder or it's subfolder
or a CSS file (".css") that is in a "css/" folder or it's subfolder.

If the minification fails, it will add an Issues to the sidebar now.

### Configuration

None yet.
