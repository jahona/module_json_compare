const g_token = '$';

function extract(obj, set, prefix='', flag=false) {
    prefix += g_token;

    var keys = Object.keys(obj);
  
    keys.forEach(function(key) {
        if(obj[key] !== null) {
            if(obj[key].constructor === Object) {
                extract(obj[key], set, prefix + key);
            } else if(obj[key].constructor === Array) {
                if(obj[key].length === 0) {
                    set.add(prefix + key);
                } else {
                    obj[key].forEach(function(elem, index) {
                        if(elem.constructor === String) {
                            extract(elem, set, prefix + key + '[' + index + ']', true);
                        } else {
                            extract(elem, set, prefix + key + '[' + index + ']');
                        }
                    });
                }
            } else if(obj[key].constructor === String) {
                if(flag) {
                    set.add(prefix);
                } else {
                    set.add(prefix + key);
                }
            } else {
                set.add(prefix + key);
            }
        } else {
            set.add(prefix + key);
        }
    });
}

function extractKeySetFromJson(jsonObj) {
    var budget = new Set();
    extract(jsonObj, budget);

    return budget;
}

function getDiffSet(set1, set2) {
    var difference = new Set(
        [...set1].filter(x => !set2.has(x))
    );
    
    return difference;
}

function getCommonSet(set1, set2) {
    var common = new Set(
        [...set1].filter(x => set2.has(x))
    );
    
    return common;
}

function getValueFromJson(json, keyPath) {
    var paths = keyPath.split(g_token);
    var result = json;

    paths.filter(function(val) {
       return val !== ""; 
    }).forEach(function(val) {
        var isArray = val.match(/[[0-9]+]$/);

        // array check
        if(isArray) {
            let str = val.substr(0, isArray.index);
            let index = val.substr(isArray.index).replace(/[^0-9]/g, "");
            result = result[str][index];
        } else {
            result = result[val];
        }
    });

    return result;
}

function compareJson(json1, json2) {
    var columnSet1 = extractKeySetFromJson(json1);
    var columnSet2 = extractKeySetFromJson(json2);

    var diffSet1 = getDiffSet(columnSet1, columnSet2);
    var diffSet2 = getDiffSet(columnSet2, columnSet1);
    var commonSet = getCommonSet(columnSet1, columnSet2);

    var level = 0;

    if(diffSet1.size !== 0 || diffSet2.size !== 0) {
        level = 3;

        console.log();
        diffSet1.forEach(function(val) {
            console.log('[removed] \t%s', val);
        });
    
        diffSet2.forEach(function(val) {
            console.log('[added] \t%s', val);
        });
    }

    commonSet.forEach(function(keyPath) {
        var val1 = getValueFromJson(json1, keyPath);
        var val2 = getValueFromJson(json2, keyPath);

        if(typeof val1 !== typeof val2) {
            // error logging...
            console.log('[type not match] %s', keyPath);
            console.log('\t(%s) -> (%s)', typeof val1, typeof val2);
            console.log();
            if(level < 2) {
                level = 2;
            }
        } else {
            if(val1 === val2) {
                // success case 1 - type match, value match
                // console.log('key: %s, value: %s --- type match, value match', keyPath, val1);
            } else {
                // success case 2 - type match, but value not match
                console.log('[value not match] %s', keyPath);
                console.log('\tbefore - %s', val1);
                console.log();
                console.log('\tafter - %s', val2);
                console.log();
                if(level < 1) {
                    level = 1;
                }
            }
        }
    });

    return level;
}

function work(json1, json2) {
    // input json1, json2
    var result = compareJson(json1, json2);

    console.log("json compare result : %s", result);
}

work(require('./target-origin.json'), require('./target-work.json'));
