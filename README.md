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

## Directory Structure
```bash
* bin /
  | - index.js (main entry)
* input_files /(sample)
* src /
  | - syntax /
      | - AST representation (reference Mozilla Parser AST)
  | - transformation / (list of parser function)
  | - utils / (string->ast && ast -> string library)
* test /
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
- Implicit import (import all undefined identifier)

## To-do Features
- [ ] Create test file for each parsed file
- [ ] Flow syntax
- [ ] Static method
- [ ] Static properties
- [ ] Singleton export 
- [ ] Superclass method call
- [ ] save typedef state
