#!/usr/bin/env node

const { spawn } = require('child_process');
var cwd = process.cwd();
console.log('Current folder: ' + cwd);
var package = require(cwd + '/package.json')
var packageName = process.argv[2]

var getAllVersions = function(URL) {
    return new Promise((res, rej) => {
        var result = {}
        var git = spawn('git', ['ls-remote', '-t', URL])
        var stdout = ''
        var stderr = ''
        git.stdout.on('data', (data) => {
            stdout += data
        });

        git.stderr.on('data', (data) => {
            stderr += data
        });

        git.on('close', (code) => {
            if (stderr) {
                return rej(stderr)
            }
            stdout.split('\n').forEach((line) => {
                if (line) {
                    var tag = line.match(/refs\/tags\/?(.*)/)[1]
                    if (!tag.endsWith('^{}') && tag.match(/v\d+\.\d+\.\d+/)) {
                        result[tag] = line
                    }
                }
            })
            res(Object.keys(result))
        });
    })
}

var installNewVersion = function(URL, version) {
    return new Promise((res, rej) => {
        var result = {}
        var npm = spawn('npm', ['i', URL + "#semver:~" + version])
        var stderr = '';

        npm.stderr.on('data', (data) => {
            stderr += data

        });

        npm.on('close', (code) => {
            if (stderr) {
                return rej(stderr)
            }
            res(code)
        });
    })
}

if (packageName && package.dependencies) {
    console.log('Package name: ' + packageName)
    var gitURL = package.dependencies[packageName]
    if (gitURL) {
        var URL = gitURL.split("#")[0];
        console.log('Fetch all available versions of ' + URL)
        getAllVersions(URL).then((vers) => {
            var latest = vers[vers.length - 1]
            var semver = latest.match(/v(.*)/)[1]
            console.log('Install new version: ' + semver)
            return installNewVersion(URL, semver)
        }).catch((err) => {
            console.log(err)
        })
    }
} else {
    console.log('Usage: git-ssh-update-version <package name>')
    console.log('You must run command from project root folder where you can see package.json file')
}