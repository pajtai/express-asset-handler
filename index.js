'use strict';

var _           = require('lodash'),
    BB          = require('bluebird'),
    Compressor  = require('node-minify'),
    fs          = BB.promisifyAll(require('fs')),
    path        = require('path'),
    files       = {},       // The cache of optimized file hashes
    built       = false;    // Whether the optimized file hashes and files were created

module.exports = configure;

function configure(options) {

    // All available options keys are represented below:
    var defaults = {
        assetsJson              : null,
        baseAssetsDir           : null,     // this is the parent dir of the js and css files, e.g. "path.join(__dirname, 'public')"
        optimize                : false,    // set to true to min, concat, and cache bust
        optimizedAssetsDir      : null,     // where the optimized assets are put
        tmpDir                  : null,
        verbose                 : false
    };

    options = _.extend({}, defaults, options);

    if (! options.baseAssetsDir) {
        throw new Error('You must pass in options.baseAssetsDir. e.g. "path.join(__dirname, \'public\')"');
    }

    if (! options.assetsJson) {
        throw new Error('You must pass in a JSON object representing you assets groupings. e.g. "require(\'./assets.json\')');
    }

    return function(req, res, next) {

        // Send functions into jade templates
        res.locals.assets = {
            unmodified : {
                css : css.bind(null, options),
                js  : js.bind(null, options)
            },
            css :   options.optimize ? cssMin.bind(null, files)   : css.bind(null, options),
            js  :   options.optimize ? jsMin.bind(null, files)    : js.bind(null, options)
        };

        // Create optimized assets
        if (options.optimize && !built) {
            built = true;

            BB.join(
                minify(options, options.assetsJson.css,  'clean-css',    '.css', {}),
                minify(options, options.assetsJson.js,   'uglifyjs',     '.js' , { mangle : false, compress : true }),
                function(resultsCss, resultsJs) {

                    files.css = resultsCss.reduce(reduceFiles, {});
                    files.js  = resultsJs.reduce( reduceFiles, {});

                    next();
                });
        } else {
            next();
        }
    };
}

function minify(options, assetsJsonObject, minType, suffix, moreOptions) {

    return BB
        .all(_.map(assetsJsonObject, function(group, name) {

            var fileOut = path.join(options.optimizedAssetsDir, name + suffix),
                newFile;

            return new BB(function(resolve) {

                Compressor.minify({
                    compressor : minType,
                    input : _.map(group, function(file) {
                        return path.join(options.baseAssetsDir, file);
                    }),
                    output : fileOut,
                    options : moreOptions,
                    // tempPath : options.tmpDir,
                    callback : function(err, file) {
                        console.log('file:', file.slice(0,50));


                        var hash = require('crypto').createHash('md5').update(file).digest('hex');

                        // Add the hash of the file contents to the file name
                        newFile = fileOut.split('.');
                        newFile.splice(-1,0, hash + '.min');
                        newFile = newFile.join('.');

                        if (options.verbose) {
                            console.log('old', fileOut);
                            console.log('new', newFile);
                        }

                        fs
                            .renameAsync(fileOut, newFile)
                            .then(function() {
                                // TODO: remove this
                                if ('uglifyjs' === minType) {
                                    fs.writeFileSync(newFile, file);
                                }
                                resolve({
                                    name : name,
                                    hash : hash
                                });
                            });


                    }
                });
            });
        }));
}

function css(options, group) {
    return options.assetsJson
        .css[group]
        .reduce(function(output, file) {
            return output + '<link href="' + file + '" rel="stylesheet">';
        }, '');
}

function js(options, group) {
    return options.assetsJson
        .js[group]
        .reduce(function(output, file) {
            return output + '<script src="' + file + '"></script>';
        }, '');
}

function cssMin(files, group) {
    var file = '/optimized/' + group + '.' + files.css[group].hash + '.min.css';
    return '<link href="' + file + '" rel="stylesheet">';
}

function jsMin(files, group) {
    var file = '/optimized/' + group + '.' + files.js[group].hash + '.min.js';
    file = '<script src="' + file + '"></script>';
    return file;
}

function reduceFiles(allFiles, result) {
    allFiles[result.name] = {
        hash : result.hash
    };
    return allFiles;
}

