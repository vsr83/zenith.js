const path = require('path');
//import {get} from 'https';

module.exports = {
    entry : './src/index.ts',
    module : {
        rules : [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    resolve : {
        extensions : ['.tsx', '.ts', '.js'],
    },
    output : {
        filename: 'zenith.js',
        path : path.resolve(__dirname, 'dist'),
        library : "zenithjs"
    },
};
