# ES5toES6

**ES5toES6** parse your ES5 code to ES6. Based on existing project with the same purpose [xto6](https://github.com/mohebifar/xto6) with additional on-going features.

## Usage
Clone this project

```bash
$ npm install
$ grunt
$ node bin/index.js --help
```

## Sample Usage
```bash
$ node bin/index.js -s input_files/sample2.js
```

## Previous project existing features

* Function/Prototypes to Classes
* Callback to Arrow functions
* String concatenation to Template Strings
* Using `let` and `const` instead of `var`
* Default arguments instead of `a = a || 2`
* Function properties in objects to Object methods

## Added features
- Namespace (support to remove namespace, since namespace is anti-pattern fo javascript)
- Google Closure code (`goog.require`, `goog.provide`, `goog.inherits`) to compatible ES6 features
- Detect Inheritance (`super` call, `extend`)
- Fix existing constructor to support arguments
- `import` support
- `export` support