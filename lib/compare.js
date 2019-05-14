const _ = require('lodash');
const fs = require('fs');

/*

*/
module.exports.compareFiles = (files, cb) => {
    if(files.length === 0) {
        return cb(new Error('Require at least one file'));
    }
    else if(files.length === 1) {
        return cb(null, [
            {
                file: files[0]
            }
        ]);
    }

    const objects = files.map(function(filepath) {
        try {
            return JSON.parse(fs.readFileSync(filepath, { encoding: 'utf-8'}));
        } catch (err) {
            return cb(new Error('Error occurred while parsing file "' + filepath + '"'));
        }
    });

    // must be objects.length === files.length
    const diff = compareObjects(objects, files);

    for(let base of diff) {
        base.commonPaths = {};
        base.common = {};

        for(let target of diff) {
            if(base.file == target.file) {
                continue;
            }
            
            let commonPaths = _.intersection(base.path, target.path);
            
            base.commonPaths[target.file] = commonPaths;

            commonPaths.forEach(function(path) {
                base.common[path] = {};
                var baseValue = _.get(base.object, path);
                var targetValue = _.get(target.object, path);

                base.common[path][base.file] = {
                    baseValue: baseValue,
                    baseType: getType(baseValue),
                    targetValue: targetValue,
                    targetType: getType(targetValue)
                };
            });
        }
    }

    diff.forEach(function(result) {
        const keys = result.missingPaths;
        
        result.diff = _.zipObject(
            keys,
            keys.map(missingPath => {
                return findDifference(diff, missingPath);
            })
        );
    });

    fs.writeFileSync('output.json', JSON.stringify(diff, null, 4));

    cb(null, diff);
}

function getType(arg) {
    var result;

    if(arg === null) {
        result = 'null'
    } else if(arg === undefined) {
        result = 'undefined'
    } else if(arg.constructor === Array ) {
        result = 'Array';
    } else if(arg.constructor === Object) {
        result = 'Object';
    } else if(arg.constructor === String) {
        result = 'String';
    } else if(arg.constructor === Number) {
        result = 'Number';
    } 

    return result;
}

function compareObjects(objects, files) {
    const paths = objects.map(objectPaths);
    const allPaths = _.uniq(_.flatten(paths)); 
   
    return _.zipWith(objects, paths, files, function(object, path, file) {
        return {
            object: object,
            file: file,
            missingPaths: _.difference(allPaths, path),
            path: path
        }
    });
}

/*
Input:
{
    "Info": {
        "Name":"TEST-NAME",
        "Created":"2018-03-22",
        "Age":20,
        "Parents": [
            {
                "Name":"Father",
                "Age":22
            },
            {
                "Name":"Mother",
                "Age":20
            }
        ]
    },
    "Friend": null,
    "Neighbor": []
}

Return:
[ 
    'Info.Name',
    'Info.Created',
    'Info.Age',
    'Info.Parents[0].Name',
    'Info.Parents[0].Age',
    'Info.Parents[1].Name',
    'Info.Parents[1].Age' ,
    'Friend',
    'Neighbor'
]
*/
function objectPaths(object) {
    var result = [];

    _.forOwn(object, function(value, key) {
        if(_.isPlainObject(value)) {
            let keys = objectPaths(value);
            
            if(keys.length === 0) {
                result.push(key);
            } else {
                keys.forEach(function(subKey) {
                    result.push(key + '.' + subKey);
                });
            }
        } else if(_.isArray(value)) {
            if(value.length === 0) {
                result.push(key + value);
            } else {
                value.forEach(function(elem, index) {
                    if(_.isPlainObject(elem)) {
                        let keys = objectPaths(elem);

                        keys.forEach(function(subKey) {
                            result.push(key + '[' + index + ']' + '.' + subKey);
                        });         
                    } else {
                        result.push(key + '[' + index + ']');
                    }
                });
            }
        } else {
            result.push(key);
        }
    })

    return result;
}

function findDifference(diff, missingPath) {
    const difference = {};

    diff.forEach(function(result) {
        const value = _.get(result.object, missingPath);

        if(value !== undefined) {
            difference[result.file] = value;
        }
    });

    return difference;
}