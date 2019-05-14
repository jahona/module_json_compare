const compare = require('./compare');
const colors = require('colors');
const _ = require('lodash');
const util = require('util');

colors.setTheme({
    added: 'green',
    deleted: 'red',
    typeChanged: 'red',
    valueChanged: 'yellow'
});

module.exports = function(files, options) {
    const opts = _.defaults(options, {
        exit: false,
        output: msg => {
            process.stdout.write(msg + '\n');
        },
        error: msg => {
            process.stderr.write(msg + '\n');
        }
    });

    var output = opts.output;
    var error = opts.error;

    var exitCode = 0;

    if(!files || files.length !== 2) {
        exitCode = 1;    
    } else {
        compare.compareFiles(files, function(err, result) {
            if(err) {
                exitCode = 2;
                error(err);
            } else {
                var before = result[0];
                var after = result[1];
                
                _.forOwn(before.diff, function(value, key) {
                    output(colors.added(util.format('++ added %s\n\t %s', key, 
                        (util.isArray(value[after.file]) && value[after.file].length == 0) ? '[]' : value[after.file])))
                });

                _.forOwn(after.diff, function(value, key) {
                    output(colors.deleted(util.format('-- deleted %s\n\t %s', key, 
                        (util.isArray(value[before.file]) && value[before.file].length == 0) ? '[]' : value[before.file])));
                });

                _.forOwn(before.common, function(value, key) {
                    var baseValue = value[before.file].baseValue;
                    var baseType = value[before.file].baseType;
                    var targetValue = value[before.file].targetValue;
                    var targetType = value[before.file].targetType;
                    
                    if(baseType !== targetType) {
                        output(colors.typeChanged(util.format('type  changed %s\n\t %s -> %s', key, baseType, targetType)));
                    }

                    if(baseValue !== targetValue) {
                        output(colors.valueChanged(util.format('value changed %s\n\t %s -> %s', key, baseValue, targetValue)));
                    }
                });
            }
        });
    }

    if (opts.exit && exitCode > 0) {
        process.exit(1);
    } else if (exitCode === 0) {
        opts.output('\nComplete\n');
    }
}

if(module == require.main) {
    module.exports(['../target-origin.json', '../target-work.json']);
}