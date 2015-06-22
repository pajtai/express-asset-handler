# Express Asset Handler

`npm install --save express-asset-handler`

This is express middleware that can handle your script and style includes for both your dev and production 
work flows. It provides direct links to unoptimized files in dev mode, and cache busted links to optimized files in
optimize (production) mode.

Works only with plain js and css files.

To use require the npm and call with the options object.

```javascript
// Example usage
var assetHandlerMiddleware = require('express-asset-handler')({
    assetsJson : require('./../assets.json'),                               // the json object that describes your assets
    baseAssetsDir : path.join(__dirname, '..', 'public'),                   
    optimize : configs.optimize,                                            // true or false
    optimizedAssetsDir : path.join(__dirname, '..', 'public', 'optimized'), // optimized output directory
    tmpDir : path.join(__dirname, '..', 'tmp') 
});

expressApp.use(assetHandlerMiddleware);

// No you can define assets.json that was passed in above:
// links are as you wish them to appear in the unoptimized version

{
    "css" : {
        "main" : [
            "/css/style1.css",
            "/css/style2.css"
        ]
    }
    "js" : {
        "app" : [
            "/js/theme1.js",
            "/js/theme2.js"
        ]
    }
}

// And now in any express template you can use
!= assets.css('main')
!= assets.js('app')
```

If `options.optimize` is false, the above will put two script and style tags each in the html. Each tag will point to the
file referenced in the json.

```html
<link href="/css/style1.css" rel="stylesheet">
<link href="/css/style2.css" rel="stylesheet">
<script src="/js/theme1.js"></script>
<script src="/js/theme2.js"></script>
```

If `options.optimize` is true, the above will put one script and style tag each in the html. The tags will point to the
created min, concated files, and the file name will include the hash of the contents.

```html
<link href="/optimized/main.12fa0dff2545dbe250b595de818dac6a.min.css" rel="stylesheet">
<script src="/optimized/app.9079b4287896b7a8e2ef53ddc4d292d1.min.js"></script>
```

---

More docs, etc. coming later.
